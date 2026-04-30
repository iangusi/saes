import { Request, Response } from 'express';
import { ReenrollmentService } from './reenrollment.service';
import { submitReenrollmentSchema } from './reenrollment.schema';
import { sendSuccess } from '../../common/utils/response';

const service = new ReenrollmentService();

export async function getStatus(req: Request, res: Response): Promise<void> {
  const result = await service.getStatus(req.user!.sub);
  sendSuccess(res, result);
}

export async function getEligibility(req: Request, res: Response): Promise<void> {
  const result = await service.getEligibility(req.user!.sub);
  sendSuccess(res, result);
}

export async function submit(req: Request, res: Response): Promise<void> {
  const dto = submitReenrollmentSchema.parse(req.body);
  const result = await service.submit(req.user!.sub, dto, req.ip ?? 'unknown');
  sendSuccess(res, result, 'Reinscripción procesada exitosamente', 201);
}
