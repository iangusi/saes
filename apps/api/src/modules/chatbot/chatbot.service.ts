import { AppError, NotFoundError } from '../../common/errors/AppError';
import { StudentsService } from '../students/students.service';
import { TeachersService } from '../teachers/teachers.service';
import { ReenrollmentService } from '../reenrollment/reenrollment.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { ChatbotRepository, ConversacionRow, MensajeRow } from './chatbot.repository';
import { getSemanticTablesForRoles, getToolsForRoles, REGULATION_TOPICS } from './chatbot.catalog';
import { classifyIntentLocally } from './chatbot.intent';
import { executeValidatedSql, validateAndPrepareSqlPlan } from './chatbot.sql';
import {
  AgentTrace,
  ChatbotResponse,
  ChatMessageHistoryItem,
  ContextCapsule,
  DatabasePlan,
  DatabaseSqlPlan,
  DatabaseToolPlan,
  EvidenceItem,
  PlannerAgentStep,
  PlannerPlan,
  StructuredData,
  SuggestedAction,
  ToolResult,
} from './chatbot.types';

const AI_URL = process.env.CHATBOT_AI_URL ?? 'http://localhost:8000';
const HISTORY_LIMIT = 10;

export interface MensajeDto {
  pregunta: string;
}

interface ConversationContext {
  summary: string | null;
  entities: Record<string, unknown>;
  previousIntent: string | null;
  history: ChatMessageHistoryItem[];
}

interface ToolContext {
  idUsuario: number;
  roles: string[];
  question: string;
  conversation: ConversacionRow;
  context: ConversationContext;
  capsule: ContextCapsule;
}

export class ChatbotService {
  private readonly repo = new ChatbotRepository();
  private readonly students = new StudentsService();
  private readonly teachers = new TeachersService();
  private readonly reenrollment = new ReenrollmentService();
  private readonly withdrawals = new WithdrawalsService();

  async crearConversacion(idUsuario: number): Promise<{ id_conversacion: string }> {
    const id = await this.repo.crearConversacion(idUsuario);
    return { id_conversacion: id };
  }

  async listarConversaciones(idUsuario: number) {
    const convs = await this.repo.listarConversaciones(idUsuario);
    return convs.map((c) => ({
      id_conversacion: c.id_conversacion,
      titulo: c.titulo ?? 'Conversacion',
      creado_en: c.creado_en,
      actualizado_en: c.actualizado_en,
    }));
  }

  async eliminarConversacion(idConversacion: string, idUsuario: number): Promise<void> {
    const ok = await this.repo.eliminarConversacion(idConversacion, idUsuario);
    if (!ok) throw new NotFoundError('Conversacion no encontrada');
  }

  async obtenerHistorial(idConversacion: string, idUsuario: number) {
    const mensajes = await this.repo.obtenerHistorial(idConversacion, idUsuario);
    return mensajes
      .filter((m) => m.rol !== 'sistema')
      .map((m) => {
        const metadata = parseJson<Record<string, unknown>>(m.metadata_json) ?? {};
        const data = parseJson<StructuredData>(m.data_json);
        const actions = parseJson<SuggestedAction[]>(m.actions_json) ?? [];
        const evidence = parseJson<EvidenceItem[]>(m.evidence_json) ?? [];

        return {
          from: m.rol === 'usuario' ? 'user' : 'bot',
          text: m.contenido,
          timestamp: m.creado_en,
          status: metadata.status,
          intent: metadata.intent,
          confidence: metadata.confidence,
          data: data ?? undefined,
          suggested_actions: actions,
          evidence,
        };
      });
  }

  async enviarMensaje(
    idConversacion: string,
    idUsuario: number,
    roles: string[],
    dto: MensajeDto,
    _token: string
  ): Promise<ChatbotResponse> {
    const conv = await this.repo.obtenerConversacion(idConversacion, idUsuario);
    if (!conv) throw new NotFoundError('Conversacion no encontrada');

    const previousMessages = await this.repo.obtenerUltimosMensajes(idConversacion, HISTORY_LIMIT);
    const context = this.buildConversationContext(conv, previousMessages);
    await this.repo.guardarMensaje(idConversacion, 'usuario', dto.pregunta);

    const agentTraces: AgentTrace[] = [];
    const toolResults: ToolResult[] = [];
    const evidence: EvidenceItem[] = [];
    const capsule = this.buildContextCapsule(dto.pregunta, roles, idUsuario, context);
    agentTraces.push(trace('context', 'ok', { question: dto.pregunta }, capsule.conversation.entities));

    const plan = await this.planWithModel(capsule, agentTraces);
    const safePlan = this.validatePlannerPlan(plan, roles, capsule);

    let response: ChatbotResponse;
    if (safePlan.needs_clarification) {
      response = {
        reply: safePlan.clarification_question ?? 'Necesito un poco mas de informacion para ayudarte.',
        status: 'needs_clarification',
        intent: safePlan.intent,
        confidence: safePlan.confidence,
        suggested_actions: [],
        evidence,
      };
    } else {
      for (const step of safePlan.agents) {
        if (step.name === 'database') {
          const result = await this.runDatabaseAgent(step, {
            idUsuario,
            roles,
            question: dto.pregunta,
            conversation: conv,
            context,
            capsule,
          }, agentTraces);
          if (result) toolResults.push(result);
        }

        if (step.name === 'regulation') {
          const regulationEvidence = await this.runRegulationAgent(step, capsule, agentTraces);
          evidence.push(...regulationEvidence);
          for (const item of regulationEvidence) {
            toolResults.push({
              source: 'regulation',
              name: item.source,
              purpose: step.goal,
              data: item,
            });
          }
        }
      }

      response = await this.runResponderAgent(safePlan, capsule, toolResults, evidence, agentTraces);
    }

    response.evidence = evidence;
    await this.repo.guardarMensaje(idConversacion, 'asistente', response.reply, response, {
      plan: safePlan,
      agentTraces,
      toolResults,
      evidence,
    });

    if (!conv.titulo && dto.pregunta.length > 0) {
      await this.repo.actualizarTitulo(idConversacion, dto.pregunta.slice(0, 80));
    }

    await this.persistConversationContext(idConversacion, conv, dto.pregunta, response, safePlan, toolResults);
    return response;
  }

  private async planWithModel(capsule: ContextCapsule, traces: AgentTrace[]): Promise<PlannerPlan> {
    const started = new Date().toISOString();
    const aiPlan = await this.fetchAi<Partial<PlannerPlan>>('/ai/plan', capsule);
    const plan = normalizePlannerPlan(aiPlan) ?? this.localPlan(capsule);
    traces.push({
      agent: 'planner',
      status: aiPlan ? 'ok' : 'skipped',
      input: { question: capsule.question },
      output: plan,
      started_at: started,
      finished_at: new Date().toISOString(),
    });
    return plan;
  }

  private async runDatabaseAgent(
    step: PlannerAgentStep,
    ctx: ToolContext,
    traces: AgentTrace[]
  ): Promise<ToolResult | null> {
    const started = new Date().toISOString();
    try {
      const plan =
        normalizeDatabasePlan(
          await this.fetchAi<Partial<DatabasePlan>>('/ai/database-plan', {
            goal: step.goal,
            inputs: step.inputs,
            context: ctx.capsule,
          })
        ) ?? this.localDatabasePlan(ctx.capsule, step);

      const result = await this.executeDatabasePlan(plan, ctx);
      traces.push({
        agent: 'database',
        status: result ? 'ok' : 'skipped',
        input: { step, plan },
        output: result,
        started_at: started,
        finished_at: new Date().toISOString(),
      });
      return result;
    } catch (error) {
      traces.push({
        agent: 'database',
        status: 'error',
        input: { step },
        error: errorMessage(error),
        started_at: started,
        finished_at: new Date().toISOString(),
      });
      return {
        source: 'tool',
        name: 'database_error',
        purpose: step.goal,
        data: {
          error: true,
          message: 'No pude obtener esos datos con las herramientas autorizadas en este momento.',
          detail: errorMessage(error),
        },
      };
    }
  }

  private async runRegulationAgent(
    step: PlannerAgentStep,
    capsule: ContextCapsule,
    traces: AgentTrace[]
  ): Promise<EvidenceItem[]> {
    const started = new Date().toISOString();
    try {
      const result = await this.fetchAi<{ evidence?: EvidenceItem[] }>('/ai/regulation', {
        goal: step.goal,
        inputs: step.inputs,
        context: capsule,
      });
      const evidence = Array.isArray(result?.evidence) ? result.evidence : [];
      traces.push({
        agent: 'regulation',
        status: evidence.length ? 'ok' : 'skipped',
        input: { step },
        output: evidence,
        started_at: started,
        finished_at: new Date().toISOString(),
      });
      return evidence;
    } catch (error) {
      traces.push({
        agent: 'regulation',
        status: 'error',
        input: { step },
        error: errorMessage(error),
        started_at: started,
        finished_at: new Date().toISOString(),
      });
      return [];
    }
  }

  private async runResponderAgent(
    plan: PlannerPlan,
    capsule: ContextCapsule,
    toolResults: ToolResult[],
    evidence: EvidenceItem[],
    traces: AgentTrace[]
  ): Promise<ChatbotResponse> {
    const started = new Date().toISOString();
    const aiResponse = await this.fetchAi<Partial<ChatbotResponse>>('/ai/respond', {
      question: capsule.question,
      plan,
      context: capsule,
      tool_results: toolResults,
      evidence,
    });
    const response = normalizeChatbotResponse(aiResponse, plan, evidence) ?? this.localResponder(plan, toolResults, evidence);
    if (!response.data) response.data = structuredDataFromToolResult(toolResults[0]);
    if (!response.suggested_actions.length) response.suggested_actions = suggestedActionsForIntent(plan.intent);
    traces.push({
      agent: 'responder',
      status: aiResponse ? 'ok' : 'skipped',
      input: { plan, tool_results: toolResults.length, evidence: evidence.length },
      output: response,
      started_at: started,
      finished_at: new Date().toISOString(),
    });
    return response;
  }

  private async executeDatabasePlan(plan: DatabasePlan, ctx: ToolContext): Promise<ToolResult | null> {
    if (plan.type === 'none') return null;

    if (plan.type === 'tool') {
      return {
        source: 'tool',
        name: plan.tool_name,
        purpose: plan.purpose,
        data: await this.executeToolPlan(plan, ctx),
      };
    }

    const validated = validateAndPrepareSqlPlan(plan, ctx.capsule.catalogs.database, {
      idUsuario: ctx.idUsuario,
      roles: ctx.roles,
    });
    return {
      source: 'sql',
      name: 'validated_select',
      purpose: plan.purpose,
      data: await executeValidatedSql(validated),
    };
  }

  private async executeToolPlan(plan: DatabaseToolPlan, ctx: ToolContext): Promise<unknown> {
    const allowedTool = ctx.capsule.catalogs.tools.find((tool) => tool.name === plan.tool_name);
    if (!allowedTool) throw new AppError(`Herramienta no permitida para este usuario: ${plan.tool_name}`, 403);

    switch (plan.tool_name) {
      case 'student.profile':
        return this.students.getProfile(ctx.idUsuario);
      case 'student.schedule':
        return filterStudentSchedule(await this.students.getSchedule(ctx.idUsuario), getRequestedDay(plan, ctx));
      case 'student.kardex':
        return this.students.getKardex(ctx.idUsuario);
      case 'student.grades':
        return this.students.getGrades(ctx.idUsuario);
      case 'student.reenrollment_status':
        return this.reenrollment.getStatus(ctx.idUsuario);
      case 'student.reenrollment_eligibility':
        return this.reenrollment.getEligibility(ctx.idUsuario);
      case 'student.withdrawals_status':
        return this.withdrawals.getStatus(ctx.idUsuario);
      case 'teacher.profile':
        return this.teachers.getProfile(ctx.idUsuario);
      case 'teacher.schedule':
      case 'teacher.groups':
        return filterTeacherSchedule(await this.teachers.getSchedule(ctx.idUsuario), getRequestedDay(plan, ctx));
      case 'teacher.group_students':
        return this.getTeacherGroupStudentsTool(ctx, String(plan.args.group_key ?? ''));
      default:
        throw new AppError(`Herramienta no implementada: ${plan.tool_name}`, 400);
    }
  }

  private async getTeacherGroupStudentsTool(ctx: ToolContext, groupKey: string): Promise<unknown> {
    const schedule = await this.teachers.getSchedule(ctx.idUsuario);
    const selected =
      schedule.grupos.find((group) => normalizeForMatch(group.claveGrupo) === normalizeForMatch(groupKey)) ??
      (schedule.grupos.length === 1 ? schedule.grupos[0] : null);

    if (!selected) {
      return {
        needs_clarification: true,
        message: 'El profesor tiene varios grupos. Se necesita la clave del grupo.',
        groups: schedule.grupos.map((group) => ({
          claveGrupo: group.claveGrupo,
          nombreMateria: group.nombreMateria,
          cupo: `${group.cupoActual}/${group.cupoMax}`,
        })),
      };
    }

    return {
      group: selected,
      students: await this.teachers.getGroupStudents(selected.idGrupo),
    };
  }

  private validatePlannerPlan(plan: PlannerPlan, roles: string[], capsule: ContextCapsule): PlannerPlan {
    if (looksLikeScheduleLookup(capsule.question) && (plan.intent === 'institucional_general' || !plan.required_context.database)) {
      return this.localPlan(capsule);
    }

    const allowedAgents = new Set(['database', 'regulation', 'responder']);
    const safeAgents = plan.agents.filter((step) => allowedAgents.has(step.name));
    const roleTools = getToolsForRoles(roles).map((tool) => tool.name);
    const safetyFlags = [...new Set([...(plan.safety_flags ?? []), ...detectUnsafeUserRequest(plan, roleTools)])];

    return {
      ...plan,
      confidence: clamp(plan.confidence, 0, 1),
      agents: safeAgents.length ? safeAgents : [{ name: 'responder', goal: 'Responder con la informacion disponible.', inputs: {} }],
      safety_flags: safetyFlags,
    };
  }

  private localPlan(capsule: ContextCapsule): PlannerPlan {
    const intent = classifyIntentLocally(capsule.question, {
      roles: capsule.roles,
      previousIntent: capsule.conversation.previous_intent,
      history: capsule.conversation.history,
    });
    const needsDatabase = intent.requires_database;
    const needsRegulation = intent.requires_dataset || /reglamento|baja|reinscripcion|ets|dictamen/i.test(capsule.question);
    const agents: PlannerAgentStep[] = [];
    if (needsDatabase) agents.push({ name: 'database', goal: `Obtener datos para ${intent.intent}`, inputs: { intent: intent.intent } });
    if (needsRegulation) agents.push({ name: 'regulation', goal: `Recuperar reglas para ${intent.intent}`, inputs: { intent: intent.intent } });
    agents.push({ name: 'responder', goal: 'Responder usando solo datos recolectados y evidencia.', inputs: {} });

    return {
      intent: intent.intent,
      confidence: intent.confidence,
      needs_clarification: intent.requires_clarification,
      clarification_question: intent.clarifying_question,
      required_context: {
        conversation_history: true,
        student_profile: intent.requires_database && capsule.roles.includes('alumno'),
        database: needsDatabase,
        regulation: needsRegulation,
      },
      agents,
      safety_flags: [],
      response_strategy: 'Usar datos reales si existen, evidencia institucional si aplica y pedir aclaracion ante ambiguedad.',
    };
  }

  private localDatabasePlan(capsule: ContextCapsule, step?: PlannerAgentStep): DatabasePlan {
    const intent = String(step?.inputs.intent ?? capsule.conversation.entities.intent_from_plan ?? '');
    const question = normalizeForMatch(capsule.question);
    const toolName = inferToolName(question, intent, capsule.roles);
    if (!toolName) return { type: 'none', reason: 'No hay herramienta clara para la solicitud.' };

    const groupKey = extractGroupKey(capsule.question);
    const day = extractDay(capsule.question);
    return {
      type: 'tool',
      tool_name: toolName,
      args: {
        ...(groupKey ? { group_key: groupKey } : {}),
        ...(day ? { day } : {}),
      },
      purpose: `Obtener datos para responder: ${capsule.question}`,
      expected_result: 'Datos estructurados desde una herramienta autorizada del backend.',
    };
  }

  private buildContextCapsule(
    question: string,
    roles: string[],
    idUsuario: number,
    context: ConversationContext
  ): ContextCapsule {
    const entities = {
      ...context.entities,
      ...extractEntities(question),
    };

    return {
      question,
      roles,
      user_context: {
        id_usuario: idUsuario,
        authenticated_identifier: null,
        current_view: null,
      },
      conversation: {
        summary: context.summary,
        entities,
        previous_intent: context.previousIntent,
        history: context.history,
      },
      catalogs: {
        tools: getToolsForRoles(roles),
        database: getSemanticTablesForRoles(roles),
        regulations: REGULATION_TOPICS,
      },
    };
  }

  private buildConversationContext(conv: ConversacionRow, messages: MensajeRow[]): ConversationContext {
    return {
      summary: conv.resumen_contexto,
      entities: parseJson<Record<string, unknown>>(conv.entidades_json) ?? {},
      previousIntent: conv.ultimo_intent,
      history: messages
        .filter((m) => m.rol !== 'sistema')
        .map((m) => ({
          role: m.rol,
          content: m.contenido,
          createdAt: m.creado_en,
        })),
    };
  }

  private async persistConversationContext(
    idConversacion: string,
    conv: ConversacionRow,
    question: string,
    response: ChatbotResponse,
    plan: PlannerPlan,
    toolResults: ToolResult[]
  ): Promise<void> {
    const previous = conv.resumen_contexto ? `${conv.resumen_contexto}\n` : '';
    const nextSummary = `${previous}Usuario: ${question}. Intent: ${plan.intent}. Respuesta: ${response.reply}`
      .slice(-2000)
      .trim();

    const previousEntities = parseJson<Record<string, unknown>>(conv.entidades_json) ?? {};
    const entities = {
      ...previousEntities,
      ...extractEntities(question),
      tema_actual: plan.intent,
      intencion_previa: plan.intent,
      last_tools: toolResults.map((result) => result.name),
      updated_at: new Date().toISOString(),
    };

    await this.repo.actualizarContexto(idConversacion, nextSummary, entities, plan.intent);
  }

  private localResponder(plan: PlannerPlan, toolResults: ToolResult[], evidence: EvidenceItem[]): ChatbotResponse {
    const failedTool = toolResults.find((result) => isRecord(result.data) && result.data.error);
    if (failedTool && !evidence.length) {
      return {
        reply: String((failedTool.data as Record<string, unknown>).message ?? 'No pude obtener los datos solicitados.'),
        status: 'no_data',
        intent: plan.intent,
        confidence: plan.confidence,
        suggested_actions: suggestedActionsForIntent(plan.intent),
        evidence,
      };
    }

    if (!toolResults.length && !evidence.length) {
      return {
        reply: 'No tengo suficiente informacion confiable para responder eso. Puedes darme mas detalle del tramite o dato que necesitas?',
        status: 'needs_clarification',
        intent: plan.intent,
        confidence: plan.confidence,
        suggested_actions: [],
        evidence,
      };
    }

    const firstTool = toolResults[0];
    const data = structuredDataFromToolResult(firstTool);
    const emptyTable = data?.type === 'table' && (!data.rows || data.rows.length === 0);
    const reply = evidence.length
      ? 'Revise datos disponibles y reglas institucionales relacionadas. Te dejo la respuesta con la informacion encontrada.'
      : emptyTable
        ? 'No encontre clases registradas para ese dia en tu horario actual.'
      : 'Consulte los datos disponibles en SAES y encontre esta informacion.';

    return {
      reply,
      status: emptyTable ? 'no_data' : data || toolResults.length ? 'answered' : 'no_data',
      intent: plan.intent,
      confidence: plan.confidence,
      data,
      suggested_actions: suggestedActionsForIntent(plan.intent),
      evidence,
    };
  }

  private async fetchAi<T>(path: string, payload: unknown): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${AI_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function normalizePlannerPlan(raw: Partial<PlannerPlan> | null | undefined): PlannerPlan | null {
  if (!raw || !raw.intent) return null;
  const agents = Array.isArray(raw.agents) ? raw.agents.filter(isPlannerStep) : [];
  return {
    intent: String(raw.intent),
    confidence: clamp(Number(raw.confidence ?? 0.6), 0, 1),
    needs_clarification: Boolean(raw.needs_clarification),
    clarification_question: raw.clarification_question ? String(raw.clarification_question) : undefined,
    required_context: {
      conversation_history: Boolean(raw.required_context?.conversation_history),
      student_profile: Boolean(raw.required_context?.student_profile),
      database: Boolean(raw.required_context?.database),
      regulation: Boolean(raw.required_context?.regulation),
    },
    agents,
    safety_flags: Array.isArray(raw.safety_flags) ? raw.safety_flags.map(String) : [],
    response_strategy: String(raw.response_strategy ?? 'Responder con datos y evidencia disponibles.'),
  };
}

function normalizeDatabasePlan(raw: Partial<DatabasePlan> | null | undefined): DatabasePlan | null {
  if (!raw || !raw.type) return null;
  if (raw.type === 'tool' && 'tool_name' in raw) {
    return {
      type: 'tool',
      tool_name: String(raw.tool_name),
      args: isRecord(raw.args) ? raw.args : {},
      purpose: String(raw.purpose ?? 'Consultar herramienta backend.'),
      expected_result: String(raw.expected_result ?? 'Datos estructurados.'),
    };
  }
  if (raw.type === 'sql' && 'sql' in raw) {
    const sqlPlan = raw as Partial<DatabaseSqlPlan>;
    return {
      type: 'sql',
      sql: String(sqlPlan.sql ?? ''),
      params: isRecord(sqlPlan.params) ? sqlPlan.params : {},
      tables: Array.isArray(sqlPlan.tables) ? sqlPlan.tables.map(String) : [],
      columns: Array.isArray(sqlPlan.columns) ? sqlPlan.columns.map(String) : [],
      purpose: String(sqlPlan.purpose ?? 'Consulta SQL validada.'),
      expected_result: String(sqlPlan.expected_result ?? 'Filas de datos.'),
    };
  }
  if (raw.type === 'none') return { type: 'none', reason: String('reason' in raw ? raw.reason : 'Sin consulta') };
  return null;
}

function normalizeChatbotResponse(
  raw: Partial<ChatbotResponse> | null | undefined,
  plan: PlannerPlan,
  evidence: EvidenceItem[]
): ChatbotResponse | null {
  if (!raw?.reply) return null;
  return {
    reply: String(raw.reply),
    status: ['answered', 'needs_clarification', 'no_data', 'error'].includes(String(raw.status))
      ? (raw.status as ChatbotResponse['status'])
      : 'answered',
    intent: String(raw.intent ?? plan.intent),
    confidence: clamp(Number(raw.confidence ?? plan.confidence), 0, 1),
    data: raw.data,
    suggested_actions: Array.isArray(raw.suggested_actions) ? raw.suggested_actions : [],
    evidence,
  };
}

function isPlannerStep(value: unknown): value is PlannerAgentStep {
  if (!isRecord(value)) return false;
  return ['database', 'regulation', 'responder'].includes(String(value.name));
}

function structuredDataFromToolResult(result: ToolResult | undefined): StructuredData | undefined {
  if (!result) return undefined;
  const data = result.data as Record<string, unknown>;

  if (result.name === 'student.schedule' && isRecord(data) && Array.isArray(data.horario)) {
    const rows = (data.horario as Array<Record<string, unknown>>).map((slot) => ({
      Materia: slot.nombre_materia,
      Grupo: slot.clave_grupo,
      Profesor: `${slot.nombre_profesor ?? ''} ${slot.apellido_paterno_profesor ?? ''}`.trim(),
      Dia: slot.dia_semana,
      Hora: `${slot.hora_inicio ?? ''} - ${slot.hora_fin ?? ''}`,
      Aula: slot.nombre_aula,
    }));
    return { type: 'table', columns: ['Materia', 'Grupo', 'Profesor', 'Dia', 'Hora', 'Aula'], rows };
  }

  if (result.name === 'teacher.schedule' && isRecord(data) && Array.isArray(data.horarios)) {
    const rows = (data.horarios as Array<Record<string, unknown>>).map((slot) => ({
      Materia: slot.nombreMateria,
      Grupo: slot.claveGrupo,
      Dia: slot.diaGrupo,
      Hora: `${slot.horaInicio ?? ''} - ${slot.horaFin ?? ''}`,
      Aula: slot.nombreAula,
    }));
    return { type: 'table', columns: ['Materia', 'Grupo', 'Dia', 'Hora', 'Aula'], rows };
  }

  if (Array.isArray(result.data)) {
    const rows = result.data.slice(0, 20) as Record<string, unknown>[];
    return rows.length ? { type: 'table', columns: Object.keys(rows[0]), rows } : undefined;
  }

  if (isRecord(result.data)) {
    return {
      type: 'summary',
      items: Object.entries(result.data)
        .slice(0, 12)
        .map(([label, value]) => ({ label, value: stringifyValue(value) })),
    };
  }

  return undefined;
}

function suggestedActionsForIntent(intent: string): SuggestedAction[] {
  const normalized = normalizeForMatch(intent);
  if (normalized.includes('horario')) return [{ label: 'Ver horario', action: 'navigate', target: '/schedule' }];
  if (normalized.includes('kardex') || normalized.includes('promedio')) return [{ label: 'Ver kardex', action: 'navigate', target: '/kardex' }];
  if (normalized.includes('calificacion')) return [{ label: 'Ver calificaciones', action: 'navigate', target: '/grades' }];
  if (normalized.includes('reinscripcion')) return [{ label: 'Ir a reinscripcion', action: 'navigate', target: '/reenrollment' }];
  if (normalized.includes('baja')) return [{ label: 'Ir a bajas', action: 'navigate', target: '/withdrawals' }];
  return [];
}

function inferToolName(question: string, intent: string, roles: string[]): string | null {
  const text = `${question} ${normalizeForMatch(intent)}`;
  const isTeacher = roles.includes('profesor');
  if (looksLikeScheduleLookup(text)) return isTeacher ? 'teacher.schedule' : 'student.schedule';
  if (isTeacher && text.includes('alumno')) return 'teacher.group_students';
  if (isTeacher && text.includes('grupo')) return 'teacher.groups';
  if (isTeacher && text.includes('horario')) return 'teacher.schedule';
  if (text.includes('kardex') || text.includes('historial')) return 'student.kardex';
  if (text.includes('calificacion') || text.includes('parcial')) return 'student.grades';
  if (text.includes('promedio') || text.includes('avance')) return 'student.kardex';
  if (text.includes('reinscripcion') || text.includes('materiaspuedometer')) return 'student.reenrollment_eligibility';
  if (text.includes('cita')) return 'student.reenrollment_status';
  if (text.includes('baja')) return 'student.withdrawals_status';
  if (text.includes('perfil') || text.includes('datos')) return isTeacher ? 'teacher.profile' : 'student.profile';
  if (text.includes('horario')) return 'student.schedule';
  return null;
}

function detectUnsafeUserRequest(plan: PlannerPlan, roleTools: string[]): string[] {
  const flags: string[] = [];
  const planText = JSON.stringify(plan).toLowerCase();
  if (/\b(drop|delete|update|insert|alter)\b/.test(planText)) flags.push('requested_mutating_sql');
  for (const toolName of planText.match(/(?:student|teacher)\.[a-z_]+/g) ?? []) {
    if (!roleTools.includes(toolName)) flags.push(`tool_not_allowed:${toolName}`);
  }
  return flags;
}

function extractEntities(question: string): Record<string, unknown> {
  const group = extractGroupKey(question);
  const day = extractDay(question);
  const boleta = question.match(/\b\d{10}\b/)?.[0];
  return {
    ...(group ? { grupo_mencionado: group } : {}),
    ...(day ? { dia_mencionado: day } : {}),
    ...(boleta ? { boleta_mencionada_ignorada: boleta } : {}),
  };
}

function extractGroupKey(question: string): string | null {
  return question.match(/\b\d[A-Z]{2}\d\b/i)?.[0]?.toUpperCase() ?? null;
}

function getRequestedDay(plan: DatabaseToolPlan, ctx: ToolContext): string | null {
  return normalizeDay(
    plan.args.day ??
      plan.args.dia ??
      ctx.capsule.conversation.entities.dia_mencionado ??
      extractDay(ctx.question)
  );
}

function filterStudentSchedule(schedule: unknown, day: string | null): unknown {
  if (!day || !isRecord(schedule) || !Array.isArray(schedule.horario)) return schedule;
  const horario = (schedule.horario as Array<Record<string, unknown>>).filter(
    (slot) => normalizeDay(slot.dia_semana) === day
  );
  return {
    ...schedule,
    horario,
    porDia: groupRowsByDay(horario, 'dia_semana'),
    filtro: { dia: day },
  };
}

function filterTeacherSchedule(schedule: unknown, day: string | null): unknown {
  if (!day || !isRecord(schedule)) return schedule;
  const horarios = Array.isArray(schedule.horarios)
    ? (schedule.horarios as Array<Record<string, unknown>>).filter((slot) => normalizeDay(slot.diaGrupo) === day)
    : [];
  const groupIds = new Set(horarios.map((slot) => slot.idGrupo));
  const grupos = Array.isArray(schedule.grupos)
    ? (schedule.grupos as Array<Record<string, unknown>>)
        .map<Record<string, unknown>>((group) => {
          const groupHorarios = Array.isArray(group.horarios)
            ? (group.horarios as Array<Record<string, unknown>>).filter((slot) => normalizeDay(slot.dia) === day)
            : [];
          return { ...group, horarios: groupHorarios };
        })
        .filter((group) => (group.horarios as Array<Record<string, unknown>>).length > 0 || groupIds.has(group.idGrupo))
    : [];

  return {
    ...schedule,
    grupos,
    horarios,
    filtro: { dia: day },
  };
}

function groupRowsByDay(rows: Array<Record<string, unknown>>, dayKey: string): Record<string, Array<Record<string, unknown>>> {
  return rows.reduce<Record<string, Array<Record<string, unknown>>>>((acc, row) => {
    const key = normalizeDay(row[dayKey]) ?? String(row[dayKey] ?? 'sin_dia');
    acc[key] = acc[key] ?? [];
    acc[key].push(row);
    return acc;
  }, {});
}

function extractDay(question: string): string | null {
  const normalized = normalizeForWords(question);
  return DAYS.find((day) => normalized.includes(day)) ?? null;
}

function normalizeDay(value: unknown): string | null {
  if (!value) return null;
  const normalized = normalizeForWords(String(value));
  return DAYS.find((day) => normalized.includes(day)) ?? null;
}

function looksLikeScheduleLookup(value: string): boolean {
  const normalized = normalizeForWords(value);
  const hasDay = DAYS.some((day) => normalized.includes(day)) || normalized.includes('hoy') || normalized.includes('manana');
  const hasScheduleTerm = ['horario', 'clase', 'materia', 'profesor', 'docente', 'aula', 'salon'].some((term) =>
    normalized.includes(term)
  );
  const hasPersonalVerb = ['tengo', 'tendre', 'metoca', 'llevo', 'voy'].some((term) =>
    normalizeForMatch(normalized).includes(term)
  );
  return hasDay && (hasScheduleTerm || hasPersonalVerb);
}

function trace(agent: AgentTrace['agent'], status: AgentTrace['status'], input?: Record<string, unknown>, output?: unknown): AgentTrace {
  const now = new Date().toISOString();
  return { agent, status, input, output, started_at: now, finished_at: now };
}

function parseJson<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function normalizeForWords(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}
