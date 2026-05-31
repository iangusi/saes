import { Request, Response } from 'express';
import { StudentsService } from './students.service';
import { sendSuccess } from '../../common/utils/response';

const service = new StudentsService();

export async function getStudentProfile(req: Request, res: Response): Promise<void> {
  const result = await service.getProfile(req.user!.sub);
  sendSuccess(res, result);
}

export async function getKardex(req: Request, res: Response): Promise<void> {
  const result = await service.getKardex(req.user!.sub);
  sendSuccess(res, result);
}

export async function getSchedule(req: Request, res: Response): Promise<void> {
  const result = await service.getSchedule(req.user!.sub);
  sendSuccess(res, result);
}

export async function getGrades(req: Request, res: Response): Promise<void> {
  const result = await service.getGrades(req.user!.sub);
  sendSuccess(res, result);
}

export async function getStudentAnnouncements(req: Request, res: Response): Promise<void> {
  const result = await service.getAnnouncements(req.user!.sub);
  sendSuccess(res, result);
}
