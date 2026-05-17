import { Request, Response } from 'express';
import { AdminNotificationsService } from './admin-notifications.service';
import { previewSchema, sendNotificationSchema } from './admin-notifications.schema';

const service = new AdminNotificationsService();

export async function getCatalogs(req: Request, res: Response) {
  const data = await service.getCatalogs();
  res.json({ success: true, message: 'OK', data, errors: [] });
}

export async function previewDestinatarios(req: Request, res: Response) {
  const { filtros } = previewSchema.parse(req.body);
  const data = await service.previewDestinatarios(filtros);
  res.json({ success: true, message: 'OK', data, errors: [] });
}

export async function sendNotification(req: Request, res: Response) {
  const dto = sendNotificationSchema.parse(req.body);
  const idAdmin = req.user!.sub;
  const ip = req.ip ?? '';
  const result = await service.sendNotification(dto, idAdmin, ip);
  res.json({
    success: true,
    message: `Comunicado enviado a ${result.enviados} destinatario(s)`,
    data: result,
    errors: [],
  });
}
