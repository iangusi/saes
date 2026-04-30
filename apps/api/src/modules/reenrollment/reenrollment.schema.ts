import { z } from 'zod';

export const submitReenrollmentSchema = z.object({
  grupos: z
    .array(z.number().int().positive())
    .min(1, 'Debe seleccionar al menos un grupo'),
});

export type SubmitReenrollmentDto = z.infer<typeof submitReenrollmentSchema>;
