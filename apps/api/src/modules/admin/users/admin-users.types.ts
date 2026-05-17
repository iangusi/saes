export interface ListUsersFilters {
  search?: string;
  rol?: string;
  estado?: 'activo' | 'bloqueado' | 'inactivo' | 'todos';
}

export interface CreateUserDto {
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

export interface ImportResult {
  creados: number;
  errores: string[];
}
