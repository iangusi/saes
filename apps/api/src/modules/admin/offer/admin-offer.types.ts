// ─── Catálogos de referencia ──────────────────────────────────────────────────

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

// ─── Carreras ─────────────────────────────────────────────────────────────────

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

// ─── Planes de estudio ────────────────────────────────────────────────────────

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

// ─── Materias ─────────────────────────────────────────────────────────────────

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

export interface AddPrerrequistoDto {
  idPrerrequisito: number;
}

// ─── Grupos ───────────────────────────────────────────────────────────────────

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

// ─── Horarios ─────────────────────────────────────────────────────────────────

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

export interface HorarioGrupo {
  id_horario: number;
  id_grupo: number;
  id_aula: number;
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  nombre_aula: string;
  edificio: string;
}

export interface CreateHorarioDto {
  idAula: number;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export interface UpdateHorarioDto {
  idAula?: number;
  diaSemana?: DiaSemana;
  horaInicio?: string;
  horaFin?: string;
}
