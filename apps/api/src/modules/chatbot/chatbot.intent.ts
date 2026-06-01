import { ChatbotIntent, IntentResult, ChatMessageHistoryItem } from './chatbot.types';

interface ClassifierContext {
  roles: string[];
  previousIntent?: string | null;
  history?: ChatMessageHistoryItem[];
}

const INTENT_KEYWORDS: Array<{
  intent: ChatbotIntent;
  keywords: string[];
  roles?: string[];
  requiresDatabase: boolean;
  requiresDataset: boolean;
}> = [
  {
    intent: 'consulta_horario',
    keywords: ['horario', 'clase', 'clases', 'aula', 'salon', 'salón'],
    roles: ['alumno'],
    requiresDatabase: true,
    requiresDataset: false,
  },
  {
    intent: 'consulta_horario_profesor',
    keywords: ['mi horario', 'horario', 'mis clases', 'aula', 'salon', 'salón'],
    roles: ['profesor'],
    requiresDatabase: true,
    requiresDataset: false,
  },
  {
    intent: 'consulta_kardex',
    keywords: ['kardex', 'historial academico', 'historial académico', 'materias aprobadas'],
    roles: ['alumno'],
    requiresDatabase: true,
    requiresDataset: false,
  },
  {
    intent: 'consulta_calificaciones',
    keywords: ['calificacion', 'calificación', 'calificaciones', 'parcial', 'evaluacion', 'evaluación'],
    roles: ['alumno'],
    requiresDatabase: true,
    requiresDataset: false,
  },
  {
    intent: 'consulta_promedio',
    keywords: ['promedio', 'avance', 'creditos aprobados', 'créditos aprobados'],
    roles: ['alumno'],
    requiresDatabase: true,
    requiresDataset: false,
  },
  {
    intent: 'estado_reinscripcion',
    keywords: ['cita', 'estado de reinscripcion', 'estado de reinscripción', 'puedo reinscribirme'],
    roles: ['alumno'],
    requiresDatabase: true,
    requiresDataset: true,
  },
  {
    intent: 'recomendacion_reinscripcion',
    keywords: ['que materias puedo meter', 'qué materias puedo meter', 'materias puedo inscribir', 'recomienda', 'recomendacion', 'recomendación'],
    roles: ['alumno'],
    requiresDatabase: true,
    requiresDataset: true,
  },
  {
    intent: 'baja_materias',
    keywords: ['baja', 'dar de baja', 'bajas', 'retirar materia', 'quitar materia'],
    roles: ['alumno'],
    requiresDatabase: true,
    requiresDataset: true,
  },
  {
    intent: 'consulta_perfil',
    keywords: ['perfil', 'mis datos', 'mi informacion', 'mi información', 'correo', 'boleta', 'numero de empleado', 'número de empleado'],
    requiresDatabase: true,
    requiresDataset: false,
  },
  {
    intent: 'consulta_grupos_profesor',
    keywords: ['mis grupos', 'grupos asignados', 'grupo asignado', 'cupo'],
    roles: ['profesor'],
    requiresDatabase: true,
    requiresDataset: false,
  },
  {
    intent: 'lista_alumnos_grupo',
    keywords: ['alumnos', 'lista', 'inscritos', 'estudiantes'],
    roles: ['profesor'],
    requiresDatabase: true,
    requiresDataset: false,
  },
  {
    intent: 'institucional_general',
    keywords: ['reglamento', 'ets', 'extraordinario', 'dictamen', 'requisitos', 'inscripcion', 'inscripción', 'gestion escolar', 'gestión escolar', 'profesor', 'docente'],
    requiresDatabase: false,
    requiresDataset: true,
  },
];

const OUT_OF_SCOPE_KEYWORDS = [
  'chiste',
  'receta',
  'futbol',
  'fútbol',
  'clima',
  'politica',
  'política',
  'bitcoin',
  'programame',
  'código',
  'codigo',
];

export function classifyIntentLocally(
  question: string,
  context: ClassifierContext
): IntentResult {
  const normalized = normalize(question);
  const roles = context.roles ?? [];
  const isTeacher = roles.includes('profesor');
  const isStudent = roles.includes('alumno');

  if (!normalized) return ambiguous('¿Qué necesitas consultar en SAES?');

  if (OUT_OF_SCOPE_KEYWORDS.some((word) => normalized.includes(word))) {
    return {
      intent: 'fuera_de_alcance',
      confidence: 0.86,
      requires_database: false,
      requires_dataset: false,
      requires_clarification: false,
      missing_fields: [],
      target: 'out_of_scope',
    };
  }

  if (looksLikeFollowUp(normalized) && context.previousIntent) {
    const followUpIntent = resolveFollowUpIntent(normalized, context.previousIntent);
    if (followUpIntent) {
      return buildResult(followUpIntent, 0.72, roles);
    }
  }

  if (looksLikeScheduleLookup(normalized)) {
    return buildResult(isTeacher ? 'consulta_horario_profesor' : 'consulta_horario', 0.88, roles);
  }

  let best: { intent: ChatbotIntent; score: number } | null = null;
  for (const item of INTENT_KEYWORDS) {
    if (item.roles?.length && !item.roles.some((role) => roles.includes(role))) continue;

    const score = item.keywords.reduce((sum, keyword) => {
      const normalizedKeyword = normalize(keyword);
      return normalized.includes(normalizedKeyword) ? sum + normalizedKeyword.length : sum;
    }, 0);

    if (score > 0 && (!best || score > best.score)) {
      best = { intent: item.intent, score };
    }
  }

  if (best) {
    return buildResult(best.intent, Math.min(0.95, 0.68 + best.score / 80), roles);
  }

  if (normalized.includes('horario')) {
    return buildResult(isTeacher ? 'consulta_horario_profesor' : 'consulta_horario', 0.78, roles);
  }

  if (normalized.includes('grupo')) {
    return buildResult(isTeacher ? 'consulta_grupos_profesor' : 'institucional_general', 0.66, roles);
  }

  if (isStudent || isTeacher) {
    return buildResult('institucional_general', 0.52, roles);
  }

  return ambiguous('¿Te refieres a inscripción, reinscripción, bajas, horario, kardex o calificaciones?');
}

export function normalizeIntentResult(raw: Partial<IntentResult> | null | undefined): IntentResult | null {
  if (!raw || !raw.intent) return null;
  const allowed: ChatbotIntent[] = [
    'consulta_horario',
    'consulta_kardex',
    'consulta_calificaciones',
    'consulta_promedio',
    'estado_reinscripcion',
    'recomendacion_reinscripcion',
    'baja_materias',
    'consulta_perfil',
    'consulta_horario_profesor',
    'consulta_grupos_profesor',
    'lista_alumnos_grupo',
    'institucional_general',
    'ambigua',
    'fuera_de_alcance',
  ];

  if (!allowed.includes(raw.intent)) return null;

  return {
    intent: raw.intent,
    confidence: clamp(Number(raw.confidence ?? 0.6), 0, 1),
    requires_database: Boolean(raw.requires_database),
    requires_dataset: Boolean(raw.requires_dataset),
    requires_clarification: Boolean(raw.requires_clarification),
    missing_fields: Array.isArray(raw.missing_fields) ? raw.missing_fields.map(String) : [],
    target: raw.target ? String(raw.target) : undefined,
    clarifying_question: raw.clarifying_question ? String(raw.clarifying_question) : undefined,
  };
}

function buildResult(intent: ChatbotIntent, confidence: number, roles: string[]): IntentResult {
  const item = INTENT_KEYWORDS.find((entry) => entry.intent === intent);
  return {
    intent,
    confidence: clamp(confidence, 0, 1),
    requires_database: item?.requiresDatabase ?? false,
    requires_dataset: item?.requiresDataset ?? false,
    requires_clarification: false,
    missing_fields: [],
    target: inferTarget(intent, roles),
  };
}

function ambiguous(question: string): IntentResult {
  return {
    intent: 'ambigua',
    confidence: 0.45,
    requires_database: false,
    requires_dataset: false,
    requires_clarification: true,
    missing_fields: ['tipo_de_consulta'],
    clarifying_question: question,
    target: 'clarification',
  };
}

function resolveFollowUpIntent(question: string, previousIntent: string): ChatbotIntent | null {
  if (question.includes('baja') || question.includes('quitar') || question.includes('retirar')) {
    return 'baja_materias';
  }
  if (previousIntent === 'consulta_horario' || previousIntent === 'consulta_kardex') {
    return previousIntent;
  }
  if (previousIntent === 'recomendacion_reinscripcion') return 'recomendacion_reinscripcion';
  return null;
}

function looksLikeFollowUp(question: string): boolean {
  return /\b(esa|ese|eso|esta|este|esas|esos|tambien|también|y|entonces)\b/.test(question);
}

function looksLikeScheduleLookup(question: string): boolean {
  const hasDay = /\b(lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|hoy|manana|mañana)\b/.test(question);
  const hasScheduleTerm = /\b(horario|clase|clases|materia|materias|profesor|profesores|docente|docentes|aula|salon|salón)\b/.test(question);
  const hasPersonalVerb = /\b(tengo|tendre|tendré|me toca|llevo|voy)\b/.test(question);
  return hasDay && (hasScheduleTerm || hasPersonalVerb);
}

function inferTarget(intent: ChatbotIntent, roles: string[]): string {
  const teacher = roles.includes('profesor');
  const targets: Record<ChatbotIntent, string> = {
    consulta_horario: 'student_schedule',
    consulta_kardex: 'student_kardex',
    consulta_calificaciones: 'student_grades',
    consulta_promedio: 'student_kardex_summary',
    estado_reinscripcion: 'reenrollment_status',
    recomendacion_reinscripcion: 'reenrollment_eligibility',
    baja_materias: 'withdrawals_status',
    consulta_perfil: teacher ? 'teacher_profile' : 'student_profile',
    consulta_horario_profesor: 'teacher_schedule',
    consulta_grupos_profesor: 'teacher_groups',
    lista_alumnos_grupo: 'teacher_group_students',
    institucional_general: 'institutional_knowledge',
    ambigua: 'clarification',
    fuera_de_alcance: 'out_of_scope',
  };
  return targets[intent];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}
