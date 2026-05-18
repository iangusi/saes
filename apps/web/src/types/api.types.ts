export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface StudentProfile {
  idAlumno: number;
  boleta: string;
  semestre: number;
  estatus: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  carrera: string;
  plan: string;
  totalCreditos: number;
  totalMaterias: number;
}

export interface KardexMateria {
  id_materia: number;
  clave_materia: string;
  nombre_materia: string;
  creditos: number;
  semestre_plan: number;
  nombre_periodo: string;
  calificacion_final: number | null;
  tipo_acreditacion: string;
  resultado: string;
}

export interface KardexResponse {
  materias: KardexMateria[];
  promedio: number;
  materiasAprobadas: number;
  totalMaterias: number;
  avancePorcentaje: number;
  porPeriodo: Array<{
    periodo: string;
    promedio_periodo: number;
    total_materias: number;
    aprobadas: number;
  }>;
}

export interface ScheduleSlot {
  id_grupo: number;
  clave_grupo: string;
  nombre_materia: string;
  nombre_profesor: string;
  apellido_paterno_profesor: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  nombre_aula: string;
  edificio: string | null;
}

export interface GradeRow {
  id_materia: number;
  nombre_materia: string;
  clave_grupo: string;
  nombre_profesor: string;
  apellido_paterno_profesor: string;
  tipo_evaluacion: string;
  calificacion: number | null;
  cerrada: number;
}

export interface OfferGroup {
  idGrupo: number;
  claveGrupo: string;
  materia: { id: number; clave: string; nombre: string; creditos: number };
  cupoMax: number;
  cupoActual: number;
  cupoDisponible: number;
  estatus: string;
  profesor: string;
  horarios: Array<{ dia: string; inicio: string; fin: string; aula: string }>;
}

// ===== TIPOS PARA PROFESOR =====

export interface TeacherProfile {
  idProfesor: number;
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  departamento: string;
  estatus: string;
}

export interface TeacherGroup {
  idGrupo: number;
  claveGrupo: string;
  nombreMateria: string;
  creditosMateria: number;
  cupoMax: number;
  cupoActual: number;
  estatus: string;
  horarios: Array<{
    dia: string;
    horaInicio: string;
    horaFin: string;
    nombreAula: string;
    edificio: string | null;
  }>;
}

export interface TeacherSchedule {
  grupos: TeacherGroup[];
  horarios: Array<{
    idGrupo: number;
    claveGrupo: string;
    nombreMateria: string;
    diaGrupo: string;
    horaInicio: string;
    horaFin: string;
    nombreAula: string;
    edificio: string | null;
  }>;
}

export interface StudentFromGroup {
  idAlumno: number;
  boleta: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
}

export interface TeacherGradeRecord {
  idAlumno: number;
  boleta: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  tipoEvaluacion: string;
  calificacion: number | null;
  cerrada: boolean;
  fechaCaptura: string | null;
}

export interface TeacherAnnouncement {
  idAnuncio: number;
  idGrupo: number;
  titulo: string;
  contenido: string;
  fechaCreacion: string;
}
