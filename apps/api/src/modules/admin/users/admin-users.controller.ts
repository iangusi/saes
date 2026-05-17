import { Request, Response } from 'express';
import { AdminUsersService } from './admin-users.service';
import { listUsersQuerySchema, createUserSchema } from './admin-users.schema';

const service = new AdminUsersService();

export async function listUsers(req: Request, res: Response) {
  const query = listUsersQuerySchema.parse(req.query);
  const users = await service.listUsers(query);
  res.json({ success: true, message: 'OK', data: users, errors: [] });
}

export async function getPlanes(req: Request, res: Response) {
  const data = await service.getPlanes();
  res.json({ success: true, message: 'OK', data, errors: [] });
}

export async function getDepartamentos(req: Request, res: Response) {
  const data = await service.getDepartamentos();
  res.json({ success: true, message: 'OK', data, errors: [] });
}

export async function createUser(req: Request, res: Response) {
  const dto = createUserSchema.parse(req.body);
  const idAdmin = req.user!.sub;
  const ip = req.ip ?? '';
  const user = await service.createUser(dto, idAdmin, ip);
  res.status(201).json({ success: true, message: 'Usuario creado', data: user, errors: [] });
}

export async function importUsers(req: Request, res: Response) {
  if (!req.file) {
    res.status(422).json({ success: false, message: 'No se recibió ningún archivo', data: null, errors: ['archivo requerido'] });
    return;
  }
  const idAdmin = req.user!.sub;
  const ip = req.ip ?? '';
  const result = await service.importUsersFromExcel(req.file.buffer, idAdmin, ip);
  res.json({ success: true, message: `${result.creados} usuario(s) importado(s)`, data: result, errors: [] });
}

export async function deactivateUser(req: Request, res: Response) {
  const idUsuario = parseInt(req.params.id);
  const idAdmin = req.user!.sub;
  const ip = req.ip ?? '';
  await service.deactivateUser(idUsuario, idAdmin, ip);
  res.json({ success: true, message: 'Usuario dado de baja', data: null, errors: [] });
}

export async function blockUser(req: Request, res: Response) {
  const idUsuario = parseInt(req.params.id);
  const idAdmin = req.user!.sub;
  const ip = req.ip ?? '';
  await service.blockUser(idUsuario, idAdmin, ip);
  res.json({ success: true, message: 'Usuario bloqueado', data: null, errors: [] });
}

export async function activateUser(req: Request, res: Response) {
  const idUsuario = parseInt(req.params.id);
  const idAdmin = req.user!.sub;
  const ip = req.ip ?? '';
  await service.activateUser(idUsuario, idAdmin, ip);
  res.json({ success: true, message: 'Usuario reactivado', data: null, errors: [] });
}
