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

  getStudentProfile: (id: number) =>
    api.get<{ data: StudentProfileResult }>(`${USERS_BASE}/${id}/student-profile`).then((r) => r.data.data),

  getProfessorProfile: (id: number) =>
    api.get<{ data: ProfessorProfileResult }>(`${USERS_BASE}/${id}/professor-profile`).then((r) => r.data.data),
};

export interface StudentProfile {
  id_alumno: number;
  id_plan: number;
  boleta: string;
  semestre_actual: number;
  estatus: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo_contacto: string;
  nombre_carrera: string;
  nombre_plan: string;
  total_creditos: number;
  total_materias: number;
}

export interface KardexEntry {
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

export interface KardexStats {
  promedio: number;
  aprobadas: number;
}

export interface GradeEntry {
  id_materia: number;
  nombre_materia: string;
  clave_grupo: string;
  nombre_profesor: string;
  apellido_paterno_profesor: string;
  tipo_evaluacion: string;
  calificacion: number | null;
  cerrada: number;
}

export interface ScheduleEntry {
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

export interface StudentProfileResult {
  profile: StudentProfile;
  kardex: KardexEntry[];
  stats: KardexStats;
  creditosCompletados: number;
  grades: GradeEntry[];
  schedule: ScheduleEntry[];
}

export interface ProfessorProfile {
  id_profesor: number;
  numero_empleado: string;
  estatus: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo_contacto: string;
  id_departamento: number;
  nombre_departamento: string;
}

export interface ProfessorGroup {
  id_grupo: number;
  clave_grupo: string;
  cupo_max: number;
  cupo_actual: number;
  estatus: string;
  nombre_materia: string;
  clave_materia: string;
  creditos: number;
  id_periodo: number;
  nombre_periodo: string;
  periodo_activo: number;
  horarios_resumen: string | null;
}

export interface ProfessorScheduleEntry {
  id_grupo: number;
  clave_grupo: string;
  nombre_materia: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  nombre_aula: string;
  edificio: string | null;
}

export interface EvaluationEntry {
  id_pregunta: number;
  texto: string;
  tipo: string;
  orden: number;
  promedio: number | null;
  total_respuestas: number;
  comentarios: string | null;
}

export interface ProfessorProfileResult {
  profile: ProfessorProfile;
  groups: ProfessorGroup[];
  schedule: ProfessorScheduleEntry[];
  evaluations: EvaluationEntry[];
}

// ─── Admin Oferta Académica ───────────────────────────────────────────────────

export interface DepartamentoRef {
  id_departamento: number;
  nombre: string;
  clave: string;
}

export interface AulaRef {
  id_aula: number;
  nombre: string;
  edificio: string;
  capacidad: number;
}

export interface ProfesorRef {
  id_profesor: number;
  id_usuario: number;
  numero_empleado: string;
  nombre_completo: string;
  departamento: string;
}

export interface MateriaRef {
  id_materia: number;
  clave: string;
  nombre: string;
}

export interface Carrera {
  id_carrera: number;
  id_departamento: number;
  nombre: string;
  clave: string;
  nombre_departamento: string;
  activo: number;
}

export interface CreateCarreraDto {
  nombre: string;
  clave: string;
  idDepartamento: number;
}

export interface UpdateCarreraDto {
  nombre?: string;
  clave?: string;
  idDepartamento?: number;
  activo?: boolean;
}

export interface PlanEstudios {
  id_plan: number;
  id_carrera: number;
  nombre: string;
  nombre_carrera: string;
  total_creditos: number;
  total_materias: number;
  activo: number;
}

export interface MateriaEnPlan {
  id_materia: number;
  clave: string;
  nombre: string;
  creditos: number;
  semestre: number;
  tipo: 'obligatoria' | 'optativa';
}

export interface PlanDetalle extends PlanEstudios {
  materias: MateriaEnPlan[];
}

export interface CreatePlanDto {
  nombre: string;
  idCarrera: number;
  totalCreditos: number;
  totalMaterias: number;
}

export interface UpdatePlanDto {
  nombre?: string;
  idCarrera?: number;
  totalCreditos?: number;
  totalMaterias?: number;
  activo?: boolean;
}

export interface AddMateriaAlPlanDto {
  idMateria: number;
  semestre: number;
  tipo: 'obligatoria' | 'optativa';
}

export interface Materia {
  id_materia: number;
  clave: string;
  nombre: string;
  creditos: number;
  horas_teoria: number;
  horas_practica: number;
  activo: number;
}

export interface Prerrequisito {
  id_materia: number;
  clave: string;
  nombre: string;
}

export interface CreateMateriaDto {
  clave: string;
  nombre: string;
  creditos: number;
  horasTeoria: number;
  horasPractica: number;
}

export interface UpdateMateriaDto {
  clave?: string;
  nombre?: string;
  creditos?: number;
  horasTeoria?: number;
  horasPractica?: number;
  activo?: boolean;
}

export interface GrupoAdmin {
  id_grupo: number;
  id_periodo: number;
  id_materia: number;
  id_profesor: number;
  clave_grupo: string;
  cupo_max: number;
  cupo_actual: number;
  estatus: 'abierto' | 'cerrado' | 'cancelado';
  nombre_materia: string;
  clave_materia: string;
  nombre_profesor: string;
  numero_empleado: string;
}

export interface CreateGrupoDto {
  idPeriodo: number;
  idMateria: number;
  idProfesor: number;
  claveGrupo: string;
  cupoMax: number;
  estatus?: 'abierto' | 'cerrado' | 'cancelado';
}

export interface UpdateGrupoDto {
  idProfesor?: number;
  claveGrupo?: string;
  cupoMax?: number;
  estatus?: 'abierto' | 'cerrado' | 'cancelado';
}

export interface HorarioGrupo {
  id_horario: number;
  id_grupo: number;
  id_aula: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  nombre_aula: string;
  edificio: string;
}

export interface CreateHorarioDto {
  idAula: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

export interface UpdateHorarioDto {
  idAula?: number;
  diaSemana?: string;
  horaInicio?: string;
  horaFin?: string;
}

const OFFER_BASE = '/admin/offer';

export const adminOfferService = {
  // Referencia
  getDepartamentos: () =>
    api.get<{ data: DepartamentoRef[] }>(`${OFFER_BASE}/departamentos`).then((r) => r.data.data),

  getAulas: () =>
    api.get<{ data: AulaRef[] }>(`${OFFER_BASE}/aulas`).then((r) => r.data.data),

  getProfesores: () =>
    api.get<{ data: ProfesorRef[] }>(`${OFFER_BASE}/profesores`).then((r) => r.data.data),

  // Carreras
  getCarreras: () =>
    api.get<{ data: Carrera[] }>(`${OFFER_BASE}/carreras`).then((r) => r.data.data),

  createCarrera: (dto: CreateCarreraDto) =>
    api.post<{ data: Carrera }>(`${OFFER_BASE}/carreras`, dto).then((r) => r.data.data),

  updateCarrera: (id: number, dto: UpdateCarreraDto) =>
    api.put<{ data: Carrera }>(`${OFFER_BASE}/carreras/${id}`, dto).then((r) => r.data.data),

  deleteCarrera: (id: number) => api.delete(`${OFFER_BASE}/carreras/${id}`),

  // Planes de estudio
  getPlanes: () =>
    api.get<{ data: PlanEstudios[] }>(`${OFFER_BASE}/planes`).then((r) => r.data.data),

  getPlanDetalle: (id: number) =>
    api.get<{ data: PlanDetalle }>(`${OFFER_BASE}/planes/${id}`).then((r) => r.data.data),

  createPlan: (dto: CreatePlanDto) =>
    api.post<{ data: PlanEstudios }>(`${OFFER_BASE}/planes`, dto).then((r) => r.data.data),

  updatePlan: (id: number, dto: UpdatePlanDto) =>
    api.put<{ data: PlanEstudios }>(`${OFFER_BASE}/planes/${id}`, dto).then((r) => r.data.data),

  deletePlan: (id: number) => api.delete(`${OFFER_BASE}/planes/${id}`),

  addMateriaAlPlan: (idPlan: number, dto: AddMateriaAlPlanDto) =>
    api.post<{ data: MateriaEnPlan[] }>(`${OFFER_BASE}/planes/${idPlan}/materias`, dto).then((r) => r.data.data),

  removeMateriaDelPlan: (idPlan: number, idMateria: number) =>
    api.delete(`${OFFER_BASE}/planes/${idPlan}/materias/${idMateria}`),

  // Materias
  getMaterias: (search?: string) =>
    api.get<{ data: Materia[] }>(`${OFFER_BASE}/materias`, { params: search ? { search } : undefined }).then((r) => r.data.data),

  getMateriasList: () =>
    api.get<{ data: MateriaRef[] }>(`${OFFER_BASE}/materias/list`).then((r) => r.data.data),

  createMateria: (dto: CreateMateriaDto) =>
    api.post<{ data: Materia }>(`${OFFER_BASE}/materias`, dto).then((r) => r.data.data),

  updateMateria: (id: number, dto: UpdateMateriaDto) =>
    api.put<{ data: Materia }>(`${OFFER_BASE}/materias/${id}`, dto).then((r) => r.data.data),

  deleteMateria: (id: number) => api.delete(`${OFFER_BASE}/materias/${id}`),

  getPrerrequisitos: (idMateria: number) =>
    api.get<{ data: Prerrequisito[] }>(`${OFFER_BASE}/materias/${idMateria}/prerrequisitos`).then((r) => r.data.data),

  addPrerrequisito: (idMateria: number, idPrerrequisito: number) =>
    api.post<{ data: Prerrequisito[] }>(`${OFFER_BASE}/materias/${idMateria}/prerrequisitos`, { idPrerrequisito }).then((r) => r.data.data),

  removePrerrequisito: (idMateria: number, idPrerrequisito: number) =>
    api.delete(`${OFFER_BASE}/materias/${idMateria}/prerrequisitos/${idPrerrequisito}`),

  // Grupos
  getGrupos: (idPeriodo?: number) =>
    api.get<{ data: GrupoAdmin[] }>(`${OFFER_BASE}/grupos`, { params: idPeriodo ? { idPeriodo } : undefined }).then((r) => r.data.data),

  createGrupo: (dto: CreateGrupoDto) =>
    api.post<{ data: GrupoAdmin }>(`${OFFER_BASE}/grupos`, dto).then((r) => r.data.data),

  updateGrupo: (id: number, dto: UpdateGrupoDto) =>
    api.put<{ data: GrupoAdmin }>(`${OFFER_BASE}/grupos/${id}`, dto).then((r) => r.data.data),

  deleteGrupo: (id: number) => api.delete(`${OFFER_BASE}/grupos/${id}`),

  // Horarios
  getHorarios: (idGrupo: number) =>
    api.get<{ data: HorarioGrupo[] }>(`${OFFER_BASE}/grupos/${idGrupo}/horarios`).then((r) => r.data.data),

  createHorario: (idGrupo: number, dto: CreateHorarioDto) =>
    api.post<{ data: HorarioGrupo[] }>(`${OFFER_BASE}/grupos/${idGrupo}/horarios`, dto).then((r) => r.data.data),

  updateHorario: (idGrupo: number, idHorario: number, dto: UpdateHorarioDto) =>
    api.put<{ data: HorarioGrupo[] }>(`${OFFER_BASE}/grupos/${idGrupo}/horarios/${idHorario}`, dto).then((r) => r.data.data),

  deleteHorario: (idGrupo: number, idHorario: number) =>
    api.delete(`${OFFER_BASE}/grupos/${idGrupo}/horarios/${idHorario}`),
};
