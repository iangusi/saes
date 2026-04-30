export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export type UserRole = 'alumno' | 'profesor' | 'admin' | 'coordinador';
