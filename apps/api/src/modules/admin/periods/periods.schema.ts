import { z } from 'zod';

export const createPeriodSchema = z.object({
  nombre: z.string().min(1).max(50),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  activo: z.boolean().optional().default(false),
});

export const updatePeriodSchema = z.object({
  nombre: z.string().min(1).max(50).optional(),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  activo: z.boolean().optional(),
});

export const createProcessWindowSchema = z.object({
  idProceso: z.number().int().positive(),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/, 'Formato de fecha inválido'),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/, 'Formato de fecha inválido'),
  activo: z.boolean().optional().default(true),
});

export const updateProcessWindowSchema = z.object({
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/).optional(),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/).optional(),
  activo: z.boolean().optional(),
});

export const generateAppointmentsSchema = z.object({
  horaInicioDia: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  horaFinDia: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fechaFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const manualAppointmentSchema = z.object({
  boleta: z.string().min(1).max(20),
  fechaCita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido'),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
});

export const createProcessTypeSchema = z.object({
  nombre: z.string().min(1).max(80),
  descripcion: z.string().max(255).optional(),
});

export const updateProcessTypeSchema = z.object({
  nombre: z.string().min(1).max(80).optional(),
  descripcion: z.string().max(255).optional(),
});
