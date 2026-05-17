import { Request, Response } from 'express';
import { AdminExceptionsService } from './admin-exceptions.service';
import { submitExceptionSchema } from './admin-exceptions.schema';

const service = new AdminExceptionsService();

export async function getEligibility(req: Request, res: Response): Promise<void> {
  const idUsuario = parseInt(req.params.idUsuario, 10);
  const data = await service.getEligibility(idUsuario);
  res.json({ success: true, message: 'OK', data, errors: [] });
}

export async function submitException(req: Request, res: Response): Promise<void> {
  const dto = submitExceptionSchema.parse(req.body);
  const idAdmin = req.user!.sub;
  const ip = req.ip ?? '';
  const data = await service.submit(dto, idAdmin, ip);
  res.status(201).json({ success: true, message: `${data.gruposInscritos} grupo(s) inscritos como excepción`, data, errors: [] });
}
