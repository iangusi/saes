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

export interface AttendanceRecord {
  idAlumno: number;
  boleta: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  presente: boolean;
  justificada: boolean;
  fecha: string;
}

export interface GradeRecord {
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

export interface Announcement {
  idAnuncio: number;
  idGrupo: number;
  titulo: string;
  contenido: string;
  fechaCreacion: string;
  leido: boolean;
}

export interface CreateAnnouncementDto {
  idGrupo: number;
  titulo: string;
  contenido: string;
}

export interface RecordAttendanceDto {
  idGrupo: number;
  fecha: string;
  asistencias: Array<{
    idAlumno: number;
    presente: boolean;
    justificada?: boolean;
  }>;
}

export interface UpdateGradeDto {
  idInscripcion: number;
  idGrupoEvaluacion: number;
  calificacion: number;
}
