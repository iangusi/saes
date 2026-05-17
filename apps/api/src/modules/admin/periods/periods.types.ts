import { RowDataPacket } from 'mysql2/promise';

export interface PeriodoRow extends RowDataPacket {
  id_periodo: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: number;
}

export interface ProcesoAcademicoRow extends RowDataPacket {
  id_proceso: number;
  nombre: string;
  descripcion: string | null;
}

export interface PeriodoProcesoRow extends RowDataPacket {
  id_periodo_proceso: number;
  id_periodo: number;
  id_proceso: number;
  nombre_proceso: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: number;
}

export interface CitaAdminRow extends RowDataPacket {
  id_cita: number;
  id_alumno: number;
  boleta: string;
  nombre_alumno: string;
  correo: string;
  fecha_cita: string;
  hora_inicio: string;
  hora_fin: string;
  estatus: string;
}

export interface AlumnoParaCitaRow extends RowDataPacket {
  id_alumno: number;
  boleta: string;
  nombre: string;
  correo: string;
  promedio: number;
  semestre_actual: number;
}

export interface CreatePeriodDto {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo?: boolean;
}

export interface UpdatePeriodDto {
  nombre?: string;
  fechaInicio?: string;
  fechaFin?: string;
  activo?: boolean;
}

export interface CreateProcessWindowDto {
  idProceso: number;
  fechaInicio: string;
  fechaFin: string;
  activo?: boolean;
}

export interface UpdateProcessWindowDto {
  fechaInicio?: string;
  fechaFin?: string;
  activo?: boolean;
}

export interface GenerateAppointmentsDto {
  horaInicioDia: string;
  horaFinDia: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ManualAppointmentDto {
  boleta: string;
  fechaCita: string;
  horaInicio: string;
  horaFin: string;
}

export interface CreateProcessTypeDto {
  nombre: string;
  descripcion?: string;
}

export interface UpdateProcessTypeDto {
  nombre?: string;
  descripcion?: string;
}
