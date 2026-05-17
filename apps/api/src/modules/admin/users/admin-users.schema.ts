import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  rol: z.enum(['admin', 'alumno', 'profesor', 'coordinador']).optional(),
  estado: z.enum(['activo', 'bloqueado', 'inactivo', 'todos']).optional(),
});

export const createUserSchema = z
  .object({
    rol: z.enum(['alumno', 'profesor', 'admin', 'coordinador']),
    identificador: z.string().min(1),
    nombre: z.string().min(1),
    apellido_paterno: z.string().min(1),
    apellido_materno: z.string().optional(),
    correo_contacto: z.string().email(),
    id_plan: z.number().int().positive().optional(),
    semestre_actual: z.number().int().min(1).max(20).optional(),
    id_departamento: z.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.rol === 'alumno') {
      if (!data.id_plan) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'id_plan es requerido para alumnos', path: ['id_plan'] });
      }
      if (!data.semestre_actual) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'semestre_actual es requerido para alumnos', path: ['semestre_actual'] });
      }
    }
    if (data.rol === 'profesor' && !data.id_departamento) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'id_departamento es requerido para profesores', path: ['id_departamento'] });
    }
  });
