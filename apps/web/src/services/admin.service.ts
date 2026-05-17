import { api } from './api';

export interface Periodo {
  id_periodo: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: number;
}

export interface ProcesoTipo {
  id_proceso: number;
  nombre: string;
  descripcion: string | null;
}

export interface PeriodoProceso {
  id_periodo_proceso: number;
  id_periodo: number;
  id_proceso: number;
  nombre_proceso: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: number;
}

export interface PeriodoDetalle extends Periodo {
  processes: PeriodoProceso[];
  appointmentCount: number;
}

export interface CitaAdmin {
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

export interface CreatePeriodoDto {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo?: boolean;
}

export interface UpdatePeriodoDto {
  nombre?: string;
  fechaInicio?: string;
  fechaFin?: string;
  activo?: boolean;
}

export interface CreateProcessTypeDto {
  nombre: string;
  descripcion?: string;
}

export interface UpdateProcessTypeDto {
  nombre?: string;
  descripcion?: string;
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

const BASE = '/admin/periods';

export const adminService = {
  getPeriods: () => api.get<{ data: Periodo[] }>(BASE).then((r) => r.data.data),

  getPeriodDetail: (id: number) =>
    api.get<{ data: PeriodoDetalle }>(`${BASE}/${id}`).then((r) => r.data.data),

  getProcessTypes: () =>
    api.get<{ data: ProcesoTipo[] }>(`${BASE}/process-types`).then((r) => r.data.data),

  createProcessType: (dto: CreateProcessTypeDto) =>
    api.post<{ data: ProcesoTipo }>(`${BASE}/process-types`, dto).then((r) => r.data.data),

  updateProcessType: (id: number, dto: UpdateProcessTypeDto) =>
    api.put<{ data: ProcesoTipo }>(`${BASE}/process-types/${id}`, dto).then((r) => r.data.data),

  deleteProcessType: (id: number) => api.delete(`${BASE}/process-types/${id}`),

  createPeriod: (dto: CreatePeriodoDto) =>
    api.post<{ data: Periodo }>(BASE, dto).then((r) => r.data.data),

  updatePeriod: (id: number, dto: UpdatePeriodoDto) =>
    api.put<{ data: Periodo }>(`${BASE}/${id}`, dto).then((r) => r.data.data),

  deletePeriod: (id: number) => api.delete(`${BASE}/${id}`),

  finalizePeriod: (id: number) =>
    api.post<{ data: { alumnosAvanzados: number } }>(`${BASE}/${id}/finalize`).then((r) => r.data.data),

  getProcessWindows: (idPeriodo: number) =>
    api.get<{ data: PeriodoProceso[] }>(`${BASE}/${idPeriodo}/processes`).then((r) => r.data.data),

  createProcessWindow: (idPeriodo: number, dto: CreateProcessWindowDto) =>
    api.post<{ data: PeriodoProceso }>(`${BASE}/${idPeriodo}/processes`, dto).then((r) => r.data.data),

  updateProcessWindow: (idPeriodo: number, pid: number, dto: UpdateProcessWindowDto) =>
    api.put<{ data: PeriodoProceso }>(`${BASE}/${idPeriodo}/processes/${pid}`, dto).then((r) => r.data.data),

  deleteProcessWindow: (idPeriodo: number, pid: number) =>
    api.delete(`${BASE}/${idPeriodo}/processes/${pid}`),

  getAppointments: (idPeriodo: number) =>
    api.get<{ data: CitaAdmin[] }>(`${BASE}/${idPeriodo}/appointments`).then((r) => r.data.data),

  generateAppointments: (idPeriodo: number, dto: GenerateAppointmentsDto) =>
    api
      .post<{ data: { generadas: number; minutosPorAlumno: number } }>(
        `${BASE}/${idPeriodo}/appointments/generate`,
        dto
      )
      .then((r) => r.data.data),

  createManualAppointment: (idPeriodo: number, dto: ManualAppointmentDto) =>
    api.post(`${BASE}/${idPeriodo}/appointments/manual`, dto),

  deleteAllAppointments: (idPeriodo: number) =>
    api.delete(`${BASE}/${idPeriodo}/appointments`),
};

// ─── Admin Users ──────────────────────────────────────────────────────────────

export interface AdminUser {
  id_usuario: number;
  identificador: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo_contacto: string;
  activo: number;
  bloqueado: number;
  roles: string;
}

export interface PlanOption {
  id_plan: number;
  nombre: string;
  nombre_carrera: string;
}

export interface DepartamentoOption {
  id_departamento: number;
  nombre: string;
}

export interface CreateAdminUserDto {
  rol: 'alumno' | 'profesor' | 'admin' | 'coordinador';
  identificador: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  correo_contacto: string;
  id_plan?: number;
  semestre_actual?: number;
  id_departamento?: number;
}

export interface ImportUsersResult {
  creados: number;
  errores: string[];
}

const USERS_BASE = '/admin/users';

export const adminUsersService = {
  listUsers: (params?: { search?: string; rol?: string; estado?: string }) =>
    api.get<{ data: AdminUser[] }>(USERS_BASE, { params }).then((r) => r.data.data),

  getPlanes: () =>
    api.get<{ data: PlanOption[] }>(`${USERS_BASE}/planes`).then((r) => r.data.data),

  getDepartamentos: () =>
    api.get<{ data: DepartamentoOption[] }>(`${USERS_BASE}/departamentos`).then((r) => r.data.data),

  createUser: (dto: CreateAdminUserDto) =>
    api.post<{ data: AdminUser }>(USERS_BASE, dto).then((r) => r.data.data),

  importUsersFromExcel: (file: File) => {
    const form = new FormData();
    form.append('archivo', file);
    return api
      .post<{ data: ImportUsersResult }>(`${USERS_BASE}/import`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  },

  deactivateUser: (id: number) => api.patch(`${USERS_BASE}/${id}/deactivate`),

  blockUser: (id: number) => api.patch(`${USERS_BASE}/${id}/block`),

  activateUser: (id: number) => api.patch(`${USERS_BASE}/${id}/activate`),
};
