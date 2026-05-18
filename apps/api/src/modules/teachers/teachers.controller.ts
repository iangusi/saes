import { Request, Response } from 'express';
import { TeachersService } from './teachers.service';
import { sendSuccess } from '../../common/utils/response';

const service = new TeachersService();

export async function getTeacherProfile(req: Request, res: Response): Promise<void> {
  const result = await service.getProfile(req.user!.sub);
  sendSuccess(res, result);
}

export async function getTeacherSchedule(req: Request, res: Response): Promise<void> {
  // Obtener idProfesor desde la BD usando idUsuario
  const result = await service.getSchedule(req.user!.sub);
  sendSuccess(res, result);
}

export async function getGroupStudents(req: Request, res: Response): Promise<void> {
  const { groupId } = req.params;
  const result = await service.getGroupStudents(parseInt(groupId));
  sendSuccess(res, result);
}

export async function getGroupGrades(req: Request, res: Response): Promise<void> {
  const { groupId } = req.params;
  const result = await service.getGroupGrades(parseInt(groupId));
  sendSuccess(res, result);
}

export async function recordAttendance(req: Request, res: Response): Promise<void> {
  const { idGrupo, fecha, asistencias } = req.body;
  const idUsuario = req.user!.sub; // del token
  await service.recordAttendance(idUsuario, { idGrupo, fecha, asistencias });
  sendSuccess(res, { message: 'Asistencia registrada correctamente' });
}

export async function updateGrade(req: Request, res: Response): Promise<void> {
  const { idInscripcion, idGrupoEvaluacion, calificacion } = req.body;
  await service.updateGrade({ idInscripcion, idGrupoEvaluacion, calificacion });
  sendSuccess(res, { message: 'Calificación actualizada correctamente' });
}

export async function createAnnouncement(req: Request, res: Response): Promise<void> {
  const { idGrupo, titulo, contenido } = req.body;
  const result = await service.createAnnouncement(req.user!.sub, { idGrupo, titulo, contenido });
  sendSuccess(res, result);
}

export async function getGroupAnnouncements(req: Request, res: Response): Promise<void> {
  const { groupId } = req.params;
  const result = await service.getGroupAnnouncements(parseInt(groupId));
  sendSuccess(res, result);
}

export async function getGroupAttendanceHistory(req: Request, res: Response): Promise<void> {
  const { groupId } = req.params;
  const { fecha } = req.query;
  const result = await service.getGroupAttendanceHistory(
    parseInt(groupId),
    typeof fecha === 'string' ? fecha : undefined
  );
  sendSuccess(res, result);
}
