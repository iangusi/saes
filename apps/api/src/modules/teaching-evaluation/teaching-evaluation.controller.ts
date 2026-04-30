import { Request, Response } from 'express';
import { TeachingEvaluationService } from './teaching-evaluation.service';
import { submitEvaluationSchema } from './teaching-evaluation.schema';
import { sendSuccess } from '../../common/utils/response';

const service = new TeachingEvaluationService();

export async function getEvaluationStatus(req: Request, res: Response): Promise<void> {
  const result = await service.getStatus(req.user!.sub);
  sendSuccess(res, result);
}

export async function getEvaluationForm(req: Request, res: Response): Promise<void> {
  const result = await service.getForm(req.user!.sub);
  sendSuccess(res, result);
}

export async function submitEvaluation(req: Request, res: Response): Promise<void> {
  const dto = submitEvaluationSchema.parse(req.body);
  await service.submit(req.user!.sub, dto, req.ip ?? 'unknown');
  sendSuccess(res, null, 'Evaluación enviada correctamente', 201);
}
