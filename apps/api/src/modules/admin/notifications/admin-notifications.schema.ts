import { z } from 'zod';

const filtroSchema = z
  .object({
    tipo: z.enum(['todos', 'rol', 'carrera', 'plan', 'semestre', 'periodo', 'grupo', 'profesor', 'especificos']),
    id_rol: z.string().optional(),
    id_carrera: z.coerce.number().int().positive().optional(),
    id_plan: z.coerce.number().int().positive().optional(),
    semestre: z.coerce.number().int().min(1).max(12).optional(),
    id_periodo: z.coerce.number().int().positive().optional(),
    id_grupo: z.coerce.number().int().positive().optional(),
    id_profesor: z.coerce.number().int().positive().optional(),
    ids_usuario: z.array(z.number().int().positive()).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.tipo === 'rol' && !val.id_rol) {
      ctx.addIssue({ code: 'custom', path: ['id_rol'], message: 'id_rol es requerido para filtro por rol' });
    }
    if (val.tipo === 'carrera' && !val.id_carrera) {
      ctx.addIssue({ code: 'custom', path: ['id_carrera'], message: 'id_carrera es requerido' });
    }
    if (val.tipo === 'plan' && !val.id_plan) {
      ctx.addIssue({ code: 'custom', path: ['id_plan'], message: 'id_plan es requerido' });
    }
    if (val.tipo === 'semestre' && !val.semestre) {
      ctx.addIssue({ code: 'custom', path: ['semestre'], message: 'semestre es requerido' });
    }
    if (val.tipo === 'periodo' && !val.id_periodo) {
      ctx.addIssue({ code: 'custom', path: ['id_periodo'], message: 'id_periodo es requerido' });
    }
    if (val.tipo === 'grupo' && !val.id_grupo) {
      ctx.addIssue({ code: 'custom', path: ['id_grupo'], message: 'id_grupo es requerido' });
    }
    if (val.tipo === 'profesor' && !val.id_profesor) {
      ctx.addIssue({ code: 'custom', path: ['id_profesor'], message: 'id_profesor es requerido' });
    }
    if (val.tipo === 'especificos' && (!val.ids_usuario || val.ids_usuario.length === 0)) {
      ctx.addIssue({ code: 'custom', path: ['ids_usuario'], message: 'ids_usuario es requerido y no puede estar vacío' });
    }
  });

export const previewSchema = z.object({ filtros: filtroSchema });

export const sendNotificationSchema = z.object({
  asunto: z.string().min(1, 'El asunto es requerido').max(200),
  cuerpo: z.string().min(1, 'El cuerpo es requerido').max(5000),
  filtros: filtroSchema,
});
