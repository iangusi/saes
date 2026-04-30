import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { updateEmailSchema, updatePasswordSchema } from './users.schema';
import { sendSuccess } from '../../common/utils/response';

const service = new UsersService();

export async function getMe(req: Request, res: Response): Promise<void> {
  const result = await service.getMe(req.user!.sub);
  sendSuccess(res, result);
}

export async function updateEmail(req: Request, res: Response): Promise<void> {
  const dto = updateEmailSchema.parse(req.body);
  await service.updateEmail(req.user!.sub, dto, req.ip ?? 'unknown');
  sendSuccess(res, null, 'Correo actualizado correctamente');
}

export async function updatePassword(req: Request, res: Response): Promise<void> {
  const dto = updatePasswordSchema.parse(req.body);
  await service.updatePassword(req.user!.sub, dto, req.ip ?? 'unknown');
  sendSuccess(res, null, 'Contraseña actualizada correctamente');
}
