import { z } from 'zod';

export const submitExceptionSchema = z.object({
  idUsuario: z.number().int().positive(),
  grupos: z.array(z.number().int().positive()).min(1, 'Debe seleccionar al menos un grupo'),
});

export type SubmitExceptionDto = z.infer<typeof submitExceptionSchema>;
