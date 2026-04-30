import { z } from 'zod';

export const updateEmailSchema = z.object({
  correo: z.string().email('Correo inválido'),
});

export const updatePasswordSchema = z.object({
  passwordActual: z.string().min(1, 'Contraseña actual requerida'),
  passwordNueva: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener una mayúscula')
    .regex(/[0-9]/, 'Debe contener un número'),
});

export type UpdateEmailDto = z.infer<typeof updateEmailSchema>;
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;
