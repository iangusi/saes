import { z } from 'zod';

export const submitEvaluationSchema = z.object({
  idInscripcion: z.number().int().positive(),
  respuestas: z
    .array(
      z.object({
        idPregunta: z.number().int().positive(),
        respuestaNumerica: z.number().int().min(1).max(5).optional(),
        respuestaTexto: z.string().max(1000).optional(),
      })
    )
    .min(1, 'Debe enviar al menos una respuesta'),
});

export type SubmitEvaluationDto = z.infer<typeof submitEvaluationSchema>;
