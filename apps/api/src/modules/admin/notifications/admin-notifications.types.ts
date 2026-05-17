export type TipoFiltro =
  | 'todos'
  | 'rol'
  | 'carrera'
  | 'plan'
  | 'semestre'
  | 'periodo'
  | 'grupo'
  | 'profesor'
  | 'especificos';

export interface FiltroNotificacion {
  tipo: TipoFiltro;
  id_rol?: string;
  id_carrera?: number;
  id_plan?: number;
  semestre?: number;
  id_periodo?: number;
  id_grupo?: number;
  id_profesor?: number;
  ids_usuario?: number[];
}

export interface SendNotificationDto {
  asunto: string;
  cuerpo: string;
  filtros: FiltroNotificacion;
}

export interface PreviewDto {
  filtros: FiltroNotificacion;
}

export interface DestinatarioPreview {
  id_usuario: number;
  nombre: string;
  apellido_paterno: string;
  correo_contacto: string;
  roles: string;
}

export interface SendResult {
  enviados: number;
  errores: string[];
}

export interface CatalogsResult {
  carreras: CarreraOption[];
  planes: PlanOption[];
  periodos: PeriodoOption[];
  grupos: GrupoOption[];
  profesores: ProfesorOption[];
}

export interface CarreraOption {
  id_carrera: number;
  nombre: string;
  clave: string;
}

export interface PlanOption {
  id_plan: number;
  nombre: string;
  nombre_carrera: string;
}

export interface PeriodoOption {
  id_periodo: number;
  nombre: string;
  activo: number;
}

export interface GrupoOption {
  id_grupo: number;
  clave_grupo: string;
  nombre_materia: string;
  id_periodo: number;
  nombre_periodo: string;
}

export interface ProfesorOption {
  id_profesor: number;
  nombre_completo: string;
  numero_empleado: string;
}
