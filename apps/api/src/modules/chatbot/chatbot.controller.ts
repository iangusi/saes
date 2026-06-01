// apps/api/src/modules/chatbot/chatbot.controller.ts
import { Request, Response } from 'express';
import { ChatbotService } from './chatbot.service';
import { sendSuccess } from '../../common/utils/response';
import { z } from 'zod';
import { AppError } from '../../common/errors/AppError';

const service = new ChatbotService();

const mensajeSchema = z.object({
  pregunta: z.string().min(1, 'La pregunta no puede estar vacía').max(2000),
});

export class ChatbotController {
  // POST /api/chatbot/conversaciones
  async crearConversacion(req: Request, res: Response) {
    const idUsuario = req.user!.sub as unknown as number;
    const result = await service.crearConversacion(idUsuario);
    return sendSuccess(res, result, 'Operación exitosa', 201);
  }

  // GET /api/chatbot/conversaciones
  async listarConversaciones(req: Request, res: Response) {
    const idUsuario = req.user!.sub as unknown as number;
    const conversaciones = await service.listarConversaciones(idUsuario);
    return sendSuccess(res, { conversaciones });
  }

  // DELETE /api/chatbot/conversaciones/:id
  async eliminarConversacion(req: Request, res: Response) {
    const idUsuario = req.user!.sub as unknown as number;
    const { id } = req.params;
    await service.eliminarConversacion(id, idUsuario);
    return sendSuccess(res, { eliminado: true });
  }

  // GET /api/chatbot/conversaciones/:id/historial
  async obtenerHistorial(req: Request, res: Response) {
    const idUsuario = req.user!.sub as unknown as number;
    const { id } = req.params;
    const historial = await service.obtenerHistorial(id, idUsuario);
    return sendSuccess(res, { historial });
  }

  // POST /api/chatbot/conversaciones/:id/mensajes
  async enviarMensaje(req: Request, res: Response) {
    const idUsuario = req.user!.sub as unknown as number;
    const roles = req.user!.roles ?? [];
    const { id } = req.params;

    const parsed = mensajeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const token = req.headers.authorization?.replace('Bearer ', '') ?? '';

    const result = await service.enviarMensaje(
      id,
      idUsuario,
      roles,
      parsed.data,
      token
    );
    return sendSuccess(res, result);
  }
}
