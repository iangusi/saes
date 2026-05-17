import { z } from 'zod';

const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
const tipoMateria = ['obligatoria', 'optativa'] as const;
const estatusGrupo = ['abierto', 'cerrado', 'cancelado'] as const;

export const createCarreraSchema = z.object({
  nombre: z.string().min(2).max(120),
  clave: z.string().min(1).max(20),
  idDepartamento: z.number().int().positive(),
});

export const updateCarreraSchema = z.object({
  nombre: z.string().min(2).max(120).optional(),
  clave: z.string().min(1).max(20).optional(),
  idDepartamento: z.number().int().positive().optional(),
  activo: z.boolean().optional(),
});

export const createPlanSchema = z.object({
  nombre: z.string().min(2).max(120),
  idCarrera: z.number().int().positive(),
  totalCreditos: z.number().positive(),
  totalMaterias: z.number().int().positive(),
});

export const updatePlanSchema = z.object({
  nombre: z.string().min(2).max(120).optional(),
  idCarrera: z.number().int().positive().optional(),
  totalCreditos: z.number().positive().optional(),
  totalMaterias: z.number().int().positive().optional(),
  activo: z.boolean().optional(),
});

export const addMateriaAlPlanSchema = z.object({
  idMateria: z.number().int().positive(),
  semestre: z.number().int().min(1).max(20),
  tipo: z.enum(tipoMateria),
});

export const createMateriaSchema = z.object({
  clave: z.string().min(1).max(20),
  nombre: z.string().min(2).max(150),
  creditos: z.number().min(0),
  horasTeoria: z.number().min(0),
  horasPractica: z.number().min(0),
});

export const updateMateriaSchema = z.object({
  clave: z.string().min(1).max(20).optional(),
  nombre: z.string().min(2).max(150).optional(),
  creditos: z.number().min(0).optional(),
  horasTeoria: z.number().min(0).optional(),
  horasPractica: z.number().min(0).optional(),
  activo: z.boolean().optional(),
});

export const addPrerrequistoSchema = z.object({
  idPrerrequisito: z.number().int().positive(),
});

export const createGrupoSchema = z.object({
  idPeriodo: z.number().int().positive(),
  idMateria: z.number().int().positive(),
  idProfesor: z.number().int().positive(),
  claveGrupo: z.string().min(1).max(20),
  cupoMax: z.number().int().positive(),
  estatus: z.enum(estatusGrupo).default('abierto'),
});

export const updateGrupoSchema = z.object({
  idProfesor: z.number().int().positive().optional(),
  claveGrupo: z.string().min(1).max(20).optional(),
  cupoMax: z.number().int().positive().optional(),
  estatus: z.enum(estatusGrupo).optional(),
});

const horaRegex = /^\d{2}:\d{2}$/;

export const createHorarioSchema = z.object({
  idAula: z.number().int().positive(),
  diaSemana: z.enum(dias),
  horaInicio: z.string().regex(horaRegex, 'Formato HH:MM requerido'),
  horaFin: z.string().regex(horaRegex, 'Formato HH:MM requerido'),
});

export const updateHorarioSchema = z.object({
  idAula: z.number().int().positive().optional(),
  diaSemana: z.enum(dias).optional(),
  horaInicio: z.string().regex(horaRegex, 'Formato HH:MM requerido').optional(),
  horaFin: z.string().regex(horaRegex, 'Formato HH:MM requerido').optional(),
});
