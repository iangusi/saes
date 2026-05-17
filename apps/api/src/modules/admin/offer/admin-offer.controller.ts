import { Request, Response } from 'express';
import { AdminOfferService } from './admin-offer.service';
import { sendSuccess } from '../../../common/utils/response';
import {
  createCarreraSchema, updateCarreraSchema,
  createPlanSchema, updatePlanSchema, addMateriaAlPlanSchema,
  createMateriaSchema, updateMateriaSchema, addPrerrequistoSchema,
  createGrupoSchema, updateGrupoSchema,
  createHorarioSchema, updateHorarioSchema,
} from './admin-offer.schema';

const svc = new AdminOfferService();

// ─── Departamentos ────────────────────────────────────────────────────────────

export async function getDepartamentos(_req: Request, res: Response): Promise<void> {
  const data = await svc.getDepartamentos();
  sendSuccess(res, data, 'Departamentos obtenidos');
}

// ─── Carreras ─────────────────────────────────────────────────────────────────

export async function getCarreras(_req: Request, res: Response): Promise<void> {
  const data = await svc.getCarreras();
  sendSuccess(res, data, 'Carreras obtenidas');
}

export async function createCarrera(req: Request, res: Response): Promise<void> {
  const dto = createCarreraSchema.parse(req.body);
  const data = await svc.createCarrera(dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Carrera creada', 201);
}

export async function updateCarrera(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const dto = updateCarreraSchema.parse(req.body);
  const data = await svc.updateCarrera(id, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Carrera actualizada');
}

export async function deleteCarrera(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  await svc.deleteCarrera(id, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Carrera eliminada');
}

// ─── Planes de estudio ────────────────────────────────────────────────────────

export async function getPlanes(_req: Request, res: Response): Promise<void> {
  const data = await svc.getPlanes();
  sendSuccess(res, data, 'Planes de estudio obtenidos');
}

export async function getPlanDetalle(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const data = await svc.getPlanDetalle(id);
  sendSuccess(res, data, 'Detalle del plan obtenido');
}

export async function createPlan(req: Request, res: Response): Promise<void> {
  const dto = createPlanSchema.parse(req.body);
  const data = await svc.createPlan(dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Plan de estudios creado', 201);
}

export async function updatePlan(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const dto = updatePlanSchema.parse(req.body);
  const data = await svc.updatePlan(id, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Plan de estudios actualizado');
}

export async function deletePlan(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  await svc.deletePlan(id, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Plan de estudios eliminado');
}

export async function addMateriaAlPlan(req: Request, res: Response): Promise<void> {
  const idPlan = parseInt(req.params.id);
  const dto = addMateriaAlPlanSchema.parse(req.body);
  const data = await svc.addMateriaAlPlan(idPlan, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Materia agregada al plan', 201);
}

export async function removeMateriaDelPlan(req: Request, res: Response): Promise<void> {
  const idPlan = parseInt(req.params.id);
  const idMateria = parseInt(req.params.idMateria);
  await svc.removeMateriaDelPlan(idPlan, idMateria, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Materia quitada del plan');
}

// ─── Materias ─────────────────────────────────────────────────────────────────

export async function getMaterias(req: Request, res: Response): Promise<void> {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const data = await svc.getMaterias(search);
  sendSuccess(res, data, 'Materias obtenidas');
}

export async function getMateriasList(_req: Request, res: Response): Promise<void> {
  const data = await svc.getMateriasList();
  sendSuccess(res, data, 'Lista de materias obtenida');
}

export async function createMateria(req: Request, res: Response): Promise<void> {
  const dto = createMateriaSchema.parse(req.body);
  const data = await svc.createMateria(dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Materia creada', 201);
}

export async function updateMateria(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const dto = updateMateriaSchema.parse(req.body);
  const data = await svc.updateMateria(id, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Materia actualizada');
}

export async function deleteMateria(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  await svc.deleteMateria(id, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Materia eliminada');
}

export async function getPrerrequisitos(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const data = await svc.getPrerrequisitos(id);
  sendSuccess(res, data, 'Prerrequisitos obtenidos');
}

export async function addPrerrequisito(req: Request, res: Response): Promise<void> {
  const idMateria = parseInt(req.params.id);
  const dto = addPrerrequistoSchema.parse(req.body);
  const data = await svc.addPrerrequisito(idMateria, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Prerrequisito agregado', 201);
}

export async function removePrerrequisito(req: Request, res: Response): Promise<void> {
  const idMateria = parseInt(req.params.id);
  const idPrerrequisito = parseInt(req.params.idPre);
  await svc.removePrerrequisito(idMateria, idPrerrequisito, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Prerrequisito quitado');
}

// ─── Aulas y Profesores ───────────────────────────────────────────────────────

export async function getAulas(_req: Request, res: Response): Promise<void> {
  const data = await svc.getAulas();
  sendSuccess(res, data, 'Aulas obtenidas');
}

export async function getProfesores(_req: Request, res: Response): Promise<void> {
  const data = await svc.getProfesores();
  sendSuccess(res, data, 'Profesores obtenidos');
}

// ─── Grupos ───────────────────────────────────────────────────────────────────

export async function getGrupos(req: Request, res: Response): Promise<void> {
  const idPeriodo = req.query.idPeriodo ? parseInt(req.query.idPeriodo as string) : undefined;
  const data = await svc.getGrupos(idPeriodo);
  sendSuccess(res, data, 'Grupos obtenidos');
}

export async function createGrupo(req: Request, res: Response): Promise<void> {
  const dto = createGrupoSchema.parse(req.body);
  const data = await svc.createGrupo(dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Grupo creado', 201);
}

export async function updateGrupo(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const dto = updateGrupoSchema.parse(req.body);
  const data = await svc.updateGrupo(id, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Grupo actualizado');
}

export async function deleteGrupo(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  await svc.deleteGrupo(id, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Grupo eliminado');
}

// ─── Horarios ─────────────────────────────────────────────────────────────────

export async function getHorarios(req: Request, res: Response): Promise<void> {
  const idGrupo = parseInt(req.params.idGrupo);
  const data = await svc.getHorarios(idGrupo);
  sendSuccess(res, data, 'Horarios obtenidos');
}

export async function createHorario(req: Request, res: Response): Promise<void> {
  const idGrupo = parseInt(req.params.idGrupo);
  const dto = createHorarioSchema.parse(req.body);
  const data = await svc.createHorario(idGrupo, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Horario creado', 201);
}

export async function updateHorario(req: Request, res: Response): Promise<void> {
  const idGrupo = parseInt(req.params.idGrupo);
  const idHorario = parseInt(req.params.idHorario);
  const dto = updateHorarioSchema.parse(req.body);
  const data = await svc.updateHorario(idGrupo, idHorario, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Horario actualizado');
}

export async function deleteHorario(req: Request, res: Response): Promise<void> {
  const idGrupo = parseInt(req.params.idGrupo);
  const idHorario = parseInt(req.params.idHorario);
  await svc.deleteHorario(idGrupo, idHorario, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Horario eliminado');
}
