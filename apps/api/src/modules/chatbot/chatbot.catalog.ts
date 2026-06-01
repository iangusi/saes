import { RegulationTopic, SemanticTable, ToolCatalogItem } from './chatbot.types';

export const TOOL_CATALOG: ToolCatalogItem[] = [
  {
    name: 'student.profile',
    description: 'Datos academicos principales del alumno autenticado.',
    roles: ['alumno'],
    parameters: {},
    returns: 'Perfil del alumno, carrera, plan, semestre y estatus.',
    tags: ['perfil', 'alumno', 'datos_personales'],
  },
  {
    name: 'student.schedule',
    description: 'Horario inscrito del alumno autenticado en el periodo activo.',
    roles: ['alumno'],
    parameters: {
      day: 'Dia de la semana opcional para filtrar, por ejemplo lunes.',
    },
    returns: 'Lista de materias, grupos, profesor, dia, hora y aula.',
    tags: ['horario', 'clases', 'inscripcion'],
  },
  {
    name: 'student.kardex',
    description: 'Historial academico y avance del alumno autenticado.',
    roles: ['alumno'],
    parameters: {},
    returns: 'Materias cursadas, calificaciones, resultado, promedio y avance.',
    tags: ['kardex', 'historial', 'promedio', 'avance'],
  },
  {
    name: 'student.grades',
    description: 'Calificaciones del alumno autenticado en el periodo activo.',
    roles: ['alumno'],
    parameters: {},
    returns: 'Evaluaciones, calificacion, profesor, materia y grupo.',
    tags: ['calificaciones', 'parcial', 'evaluacion'],
  },
  {
    name: 'student.reenrollment_status',
    description: 'Estado de cita y ventana de reinscripcion del alumno autenticado.',
    roles: ['alumno'],
    parameters: {},
    returns: 'Estado, mensaje, cita y periodo cuando existan.',
    tags: ['reinscripcion', 'cita', 'periodo'],
  },
  {
    name: 'student.reenrollment_eligibility',
    description: 'Grupos elegibles para reinscripcion del alumno autenticado.',
    roles: ['alumno'],
    parameters: {},
    returns: 'Grupos disponibles filtrados por prerrequisitos, cupo y choques.',
    tags: ['reinscripcion', 'materias', 'grupos', 'prerrequisitos'],
  },
  {
    name: 'student.withdrawals_status',
    description: 'Estado de bajas y materias inscritas que puede evaluar el alumno autenticado.',
    roles: ['alumno'],
    parameters: {},
    returns: 'Ventana de baja, creditos minimos, creditos inscritos y materias activas.',
    tags: ['bajas', 'materias', 'creditos'],
  },
  {
    name: 'teacher.profile',
    description: 'Datos principales del profesor autenticado.',
    roles: ['profesor'],
    parameters: {},
    returns: 'Numero de empleado, departamento, correo y estatus.',
    tags: ['perfil', 'profesor'],
  },
  {
    name: 'teacher.schedule',
    description: 'Horario y sesiones asignadas al profesor autenticado.',
    roles: ['profesor'],
    parameters: {
      day: 'Dia de la semana opcional para filtrar, por ejemplo lunes.',
    },
    returns: 'Grupos, materias, horarios y aulas del profesor.',
    tags: ['horario', 'profesor', 'grupos'],
  },
  {
    name: 'teacher.groups',
    description: 'Grupos asignados al profesor autenticado.',
    roles: ['profesor'],
    parameters: {},
    returns: 'Materia, clave de grupo, cupo, creditos y horario resumido.',
    tags: ['grupos', 'cupo', 'profesor'],
  },
  {
    name: 'teacher.group_students',
    description: 'Alumnos inscritos en un grupo asignado al profesor autenticado.',
    roles: ['profesor'],
    parameters: {
      group_key: 'Clave visible del grupo, por ejemplo 4CM2. Opcional si solo tiene un grupo.',
    },
    returns: 'Boleta, nombre y correo de alumnos del grupo autorizado.',
    tags: ['alumnos', 'lista', 'grupo'],
  },
];

export const REGULATION_TOPICS: RegulationTopic[] = [
  {
    id: 'reinscripcion',
    title: 'Reinscripcion',
    description: 'Reglas de cargas, creditos, adeudos, cita y continuidad academica.',
    keywords: ['reinscripcion', 'creditos', 'carga', 'adeudos', 'cita'],
  },
  {
    id: 'baja_materias',
    title: 'Baja de materias',
    description: 'Ventana, restricciones, carga minima y casos en los que procede una baja.',
    keywords: ['baja', 'materia', 'carga minima', 'recursando'],
  },
  {
    id: 'ets',
    title: 'ETS',
    description: 'Evaluacion a titulo de suficiencia y condiciones generales.',
    keywords: ['ets', 'titulo de suficiencia', 'evaluacion'],
  },
  {
    id: 'calificaciones',
    title: 'Calificaciones y revisiones',
    description: 'Escala, revision, responsabilidades docentes y plazos.',
    keywords: ['calificaciones', 'revision', 'profesor', 'docente'],
  },
  {
    id: 'gestion_escolar',
    title: 'Gestion escolar',
    description: 'Tramites, documentos, dictamen, justificantes y solicitudes academicas.',
    keywords: ['gestion', 'documentos', 'dictamen', 'justificantes'],
  },
  {
    id: 'portal_saes',
    title: 'Uso del portal SAES 2.0',
    description: 'Navegacion y acciones disponibles para alumnos y profesores.',
    keywords: ['portal', 'saes', 'horario', 'asistencia', 'anuncios'],
  },
];

export const SEMANTIC_DB_CATALOG: SemanticTable[] = [
  {
    table: 'alumno',
    description: 'Identidad escolar y plan del alumno.',
    roles: ['alumno', 'admin'],
    columns: {
      id_alumno: 'Identificador interno del alumno.',
      id_usuario: 'Usuario autenticado asociado.',
      boleta: 'Identificador escolar. Debe salir del contexto autenticado.',
      id_plan: 'Plan de estudios del alumno.',
      semestre_actual: 'Semestre actual registrado.',
      estatus: 'Estado academico.',
    },
    relations: ['alumno.id_usuario -> usuario.id_usuario', 'alumno.id_plan -> plan_estudios.id_plan'],
    rules: ['Nunca filtrar por boleta escrita por el usuario.', 'Datos personales requieren alumno.id_usuario = AUTH_USER_ID.'],
  },
  {
    table: 'inscripcion',
    description: 'Materias inscritas por alumnos.',
    roles: ['alumno', 'profesor', 'admin'],
    columns: {
      id_inscripcion: 'Identificador de inscripcion.',
      id_alumno: 'Alumno inscrito.',
      id_grupo: 'Grupo inscrito.',
      estatus: 'Estado de la inscripcion.',
    },
    relations: ['inscripcion.id_alumno -> alumno.id_alumno', 'inscripcion.id_grupo -> grupo.id_grupo'],
    rules: ['Alumnos solo pueden ver sus propias inscripciones.', 'Profesores solo grupos asignados.'],
  },
  {
    table: 'grupo',
    description: 'Oferta de grupos por periodo, materia y profesor.',
    roles: ['alumno', 'profesor', 'admin'],
    columns: {
      id_grupo: 'Identificador interno del grupo.',
      id_periodo: 'Periodo academico.',
      id_materia: 'Materia impartida.',
      id_profesor: 'Profesor asignado.',
      clave_grupo: 'Clave visible del grupo.',
      cupo_max: 'Cupo maximo.',
      cupo_actual: 'Cupo actual.',
      estatus: 'Estado del grupo.',
    },
    relations: ['grupo.id_materia -> materia.id_materia', 'grupo.id_profesor -> profesor.id_profesor'],
    rules: ['No mostrar grupos cancelados salvo que se solicite administrativamente.'],
  },
  {
    table: 'materia',
    description: 'Unidades de aprendizaje.',
    roles: ['alumno', 'profesor', 'admin'],
    columns: {
      id_materia: 'Identificador de materia.',
      clave: 'Clave oficial.',
      nombre: 'Nombre de la materia.',
      creditos: 'Creditos de la materia.',
    },
    relations: ['materia.id_materia -> plan_materia.id_materia'],
    rules: ['Puede consultarse como catalogo academico.'],
  },
  {
    table: 'historial_academico',
    description: 'Kardex y resultados historicos del alumno.',
    roles: ['alumno', 'admin'],
    columns: {
      id_alumno: 'Alumno propietario del registro.',
      id_materia: 'Materia cursada.',
      id_periodo: 'Periodo cursado.',
      calificacion_final: 'Calificacion final.',
      tipo_acreditacion: 'Forma de acreditacion.',
      resultado: 'Aprobado o reprobado.',
    },
    relations: ['historial_academico.id_alumno -> alumno.id_alumno', 'historial_academico.id_materia -> materia.id_materia'],
    rules: ['Debe filtrar por alumno autenticado.'],
  },
  {
    table: 'horario_grupo',
    description: 'Sesiones semanales de cada grupo.',
    roles: ['alumno', 'profesor', 'admin'],
    columns: {
      id_grupo: 'Grupo al que pertenece la sesion.',
      dia_semana: 'Dia de clase.',
      hora_inicio: 'Hora inicial.',
      hora_fin: 'Hora final.',
      id_aula: 'Aula asignada.',
    },
    relations: ['horario_grupo.id_grupo -> grupo.id_grupo', 'horario_grupo.id_aula -> aula.id_aula'],
    rules: ['Debe respetar permisos del grupo consultado.'],
  },
  {
    table: 'periodo_academico',
    description: 'Periodos academicos y periodo activo.',
    roles: ['alumno', 'profesor', 'admin'],
    columns: {
      id_periodo: 'Identificador del periodo.',
      nombre: 'Nombre del periodo.',
      fecha_inicio: 'Inicio.',
      fecha_fin: 'Fin.',
      activo: 'Indica periodo activo.',
    },
    relations: ['periodo_academico.id_periodo -> grupo.id_periodo'],
    rules: ['Puede consultarse para ubicar el periodo activo.'],
  },
  {
    table: 'profesor',
    description: 'Identidad docente y departamento.',
    roles: ['profesor', 'admin'],
    columns: {
      id_profesor: 'Identificador interno del profesor.',
      id_usuario: 'Usuario autenticado asociado.',
      numero_empleado: 'Numero de empleado.',
      id_departamento: 'Departamento.',
      estatus: 'Estado docente.',
    },
    relations: ['profesor.id_usuario -> usuario.id_usuario', 'profesor.id_profesor -> grupo.id_profesor'],
    rules: ['Profesores solo pueden consultar datos propios o grupos asignados.'],
  },
];

export function getToolsForRoles(roles: string[]): ToolCatalogItem[] {
  return TOOL_CATALOG.filter((tool) => tool.roles.some((role) => roles.includes(role)));
}

export function getSemanticTablesForRoles(roles: string[]): SemanticTable[] {
  return SEMANTIC_DB_CATALOG.filter((table) => table.roles.some((role) => roles.includes(role)));
}
