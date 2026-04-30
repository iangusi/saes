import { z } from 'zod';

export const withdrawalRequestSchema = z.object({
  idInscripcion: z.number().int().positive('ID de inscripción inválido'),
  motivo: z.string().min(5, 'El motivo debe tener al menos 5 caracteres').max(500),
});

export type WithdrawalRequestDto = z.infer<typeof withdrawalRequestSchema>;
