import { Request, Response } from 'express';
import { PeriodsService } from './periods.service';
import { sendSuccess } from '../../../common/utils/response';
import {
  createPeriodSchema,
  updatePeriodSchema,
  createProcessWindowSchema,
  updateProcessWindowSchema,
  generateAppointmentsSchema,
  manualAppointmentSchema,
  createProcessTypeSchema,
  updateProcessTypeSchema,
} from './periods.schema';

const svc = new PeriodsService();

export async function getAllPeriods(_req: Request, res: Response): Promise<void> {
  const data = await svc.getAllPeriods();
  sendSuccess(res, data, 'Periodos obtenidos');
}

export async function getPeriodDetail(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const data = await svc.getPeriodWithProcesses(id);
  sendSuccess(res, data, 'Detalle del periodo obtenido');
}

export async function getAllProcessTypes(_req: Request, res: Response): Promise<void> {
  const data = await svc.getAllProcessTypes();
  sendSuccess(res, data, 'Tipos de proceso obtenidos');
}

export async function createProcessType(req: Request, res: Response): Promise<void> {
  const dto = createProcessTypeSchema.parse(req.body);
  const data = await svc.createProcessType(dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Tipo de proceso creado', 201);
}

export async function updateProcessType(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.tid);
  const dto = updateProcessTypeSchema.parse(req.body);
  const data = await svc.updateProcessType(id, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Tipo de proceso actualizado');
}

export async function deleteProcessType(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.tid);
  await svc.deleteProcessType(id, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Tipo de proceso eliminado');
}

export async function createPeriod(req: Request, res: Response): Promise<void> {
  const dto = createPeriodSchema.parse(req.body);
  const data = await svc.createPeriod(dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Periodo creado', 201);
}

export async function updatePeriod(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const dto = updatePeriodSchema.parse(req.body);
  const data = await svc.updatePeriod(id, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Periodo actualizado');
}

export async function deletePeriod(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  await svc.deletePeriod(id, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Periodo eliminado');
}

export async function finalizePeriod(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id);
  const data = await svc.finalizePeriod(id, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, `Ciclo finalizado. ${data.alumnosAvanzados} alumnos avanzaron de semestre.`);
}

export async function getProcessWindows(req: Request, res: Response): Promise<void> {
  const idPeriodo = parseInt(req.params.id);
  const data = await svc.getProcessWindows(idPeriodo);
  sendSuccess(res, data, 'Ventanas de proceso obtenidas');
}

export async function createProcessWindow(req: Request, res: Response): Promise<void> {
  const idPeriodo = parseInt(req.params.id);
  const dto = createProcessWindowSchema.parse(req.body);
  const data = await svc.createProcessWindow(idPeriodo, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Ventana de proceso creada', 201);
}

export async function updateProcessWindow(req: Request, res: Response): Promise<void> {
  const idPeriodo = parseInt(req.params.id);
  const idPeriodoProceso = parseInt(req.params.pid);
  const dto = updateProcessWindowSchema.parse(req.body);
  const data = await svc.updateProcessWindow(idPeriodo, idPeriodoProceso, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, 'Ventana de proceso actualizada');
}

export async function deleteProcessWindow(req: Request, res: Response): Promise<void> {
  const idPeriodo = parseInt(req.params.id);
  const idPeriodoProceso = parseInt(req.params.pid);
  await svc.deleteProcessWindow(idPeriodo, idPeriodoProceso, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Ventana de proceso eliminada');
}

export async function getAppointments(req: Request, res: Response): Promise<void> {
  const idPeriodo = parseInt(req.params.id);
  const data = await svc.getAppointments(idPeriodo);
  sendSuccess(res, data, 'Citas obtenidas');
}

export async function generateAppointments(req: Request, res: Response): Promise<void> {
  const idPeriodo = parseInt(req.params.id);
  const dto = generateAppointmentsSchema.parse(req.body);
  const data = await svc.generateAppointments(idPeriodo, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, data, `${data.generadas} citas generadas. Se enviarán correos en segundo plano.`);
}

export async function createManualAppointment(req: Request, res: Response): Promise<void> {
  const idPeriodo = parseInt(req.params.id);
  const dto = manualAppointmentSchema.parse(req.body);
  await svc.createManualAppointment(idPeriodo, dto, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Cita asignada y notificación enviada', 201);
}

export async function deleteAllAppointments(req: Request, res: Response): Promise<void> {
  const idPeriodo = parseInt(req.params.id);
  await svc.deleteAllAppointments(idPeriodo, req.user!.sub, req.ip ?? '');
  sendSuccess(res, null, 'Todas las citas del periodo fueron eliminadas');
}
