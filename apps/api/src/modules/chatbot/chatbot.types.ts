export type ChatbotStatus = 'answered' | 'needs_clarification' | 'no_data' | 'error';

export type ChatbotIntent =
  | 'consulta_horario'
  | 'consulta_kardex'
  | 'consulta_calificaciones'
  | 'consulta_promedio'
  | 'estado_reinscripcion'
  | 'recomendacion_reinscripcion'
  | 'baja_materias'
  | 'consulta_perfil'
  | 'consulta_horario_profesor'
  | 'consulta_grupos_profesor'
  | 'lista_alumnos_grupo'
  | 'institucional_general'
  | 'ambigua'
  | 'fuera_de_alcance';

export interface StructuredData {
  type: 'table' | 'cards' | 'summary';
  columns?: string[];
  rows?: Record<string, unknown>[];
  items?: Record<string, unknown>[];
}

export interface SuggestedAction {
  label: string;
  action: 'navigate' | 'ask';
  target: string;
  payload?: Record<string, unknown>;
}

export interface ChatbotResponse {
  reply: string;
  status: ChatbotStatus;
  intent: string;
  confidence: number;
  data?: StructuredData;
  suggested_actions: SuggestedAction[];
  evidence?: EvidenceItem[];
}

export interface IntentResult {
  intent: ChatbotIntent;
  confidence: number;
  requires_database: boolean;
  requires_dataset: boolean;
  requires_clarification: boolean;
  missing_fields: string[];
  target?: string;
  clarifying_question?: string;
}

export interface ChatMessageHistoryItem {
  role: 'usuario' | 'asistente' | 'sistema';
  content: string;
  createdAt?: Date;
}

export interface ContextCapsule {
  question: string;
  roles: string[];
  user_context: {
    id_usuario: number;
    authenticated_identifier?: string | null;
    current_view?: string | null;
  };
  conversation: {
    summary: string | null;
    entities: Record<string, unknown>;
    previous_intent: string | null;
    history: ChatMessageHistoryItem[];
  };
  catalogs: {
    tools: ToolCatalogItem[];
    database: SemanticTable[];
    regulations: RegulationTopic[];
  };
}

export interface PlannerRequiredContext {
  conversation_history: boolean;
  student_profile: boolean;
  database: boolean;
  regulation: boolean;
}

export interface PlannerAgentStep {
  name: 'database' | 'regulation' | 'responder';
  goal: string;
  inputs: Record<string, unknown>;
}

export interface PlannerPlan {
  intent: string;
  confidence: number;
  needs_clarification: boolean;
  clarification_question?: string;
  required_context: PlannerRequiredContext;
  agents: PlannerAgentStep[];
  safety_flags: string[];
  response_strategy: string;
}

export interface ToolCatalogItem {
  name: string;
  description: string;
  roles: string[];
  parameters: Record<string, string>;
  returns: string;
  tags: string[];
}

export interface RegulationTopic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
}

export interface SemanticTable {
  table: string;
  description: string;
  columns: Record<string, string>;
  relations: string[];
  rules: string[];
  roles: string[];
}

export interface DatabaseToolPlan {
  type: 'tool';
  tool_name: string;
  args: Record<string, unknown>;
  purpose: string;
  expected_result: string;
}

export interface DatabaseSqlPlan {
  type: 'sql';
  sql: string;
  params: Record<string, unknown>;
  tables: string[];
  columns: string[];
  purpose: string;
  expected_result: string;
}

export interface DatabaseNoopPlan {
  type: 'none';
  reason: string;
}

export type DatabasePlan = DatabaseToolPlan | DatabaseSqlPlan | DatabaseNoopPlan;

export interface AgentTrace {
  agent: 'context' | 'planner' | 'database' | 'regulation' | 'responder';
  status: 'ok' | 'skipped' | 'error';
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string;
  started_at: string;
  finished_at: string;
}

export interface ToolResult {
  source: 'tool' | 'sql' | 'regulation';
  name: string;
  purpose: string;
  data: unknown;
}

export interface EvidenceItem {
  source: string;
  title?: string;
  content?: string;
  data?: unknown;
}
