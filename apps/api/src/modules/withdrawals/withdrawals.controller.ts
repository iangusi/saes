import { Request, Response } from 'express';
import { WithdrawalsService } from './withdrawals.service';
import { withdrawalRequestSchema } from './withdrawals.schema';
import { sendSuccess } from '../../common/utils/response';

const service = new WithdrawalsService();

export async function getWithdrawalsStatus(req: Request, res: Response): Promise<void> {
  const result = await service.getStatus(req.user!.sub);
  sendSuccess(res, result);
}

export async function requestWithdrawal(req: Request, res: Response): Promise<void> {
  const dto = withdrawalRequestSchema.parse(req.body);
  await service.requestWithdrawal(req.user!.sub, dto, req.ip ?? 'unknown');
  sendSuccess(res, null, 'Baja procesada correctamente');
}
