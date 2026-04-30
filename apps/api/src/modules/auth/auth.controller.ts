import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';
import { sendSuccess } from '../../common/utils/response';

const service = new AuthService();

export async function login(req: Request, res: Response): Promise<void> {
  const dto = loginSchema.parse(req.body);
  const ip = req.ip ?? 'unknown';
  const result = await service.login(dto, ip);
  sendSuccess(res, result, 'Login exitoso');
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const dto = forgotPasswordSchema.parse(req.body);
  const ip = req.ip ?? 'unknown';
  await service.forgotPassword(dto, ip);
  sendSuccess(res, null, 'Si el correo existe, recibirás un enlace de recuperación');
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const dto = resetPasswordSchema.parse(req.body);
  const ip = req.ip ?? 'unknown';
  await service.resetPassword(dto, ip);
  sendSuccess(res, null, 'Contraseña actualizada correctamente');
}

export async function logout(req: Request, res: Response): Promise<void> {
  const idUsuario = req.user!.sub;
  const ip = req.ip ?? 'unknown';
  await service.logout(idUsuario, ip);
  sendSuccess(res, null, 'Sesión cerrada');
}
