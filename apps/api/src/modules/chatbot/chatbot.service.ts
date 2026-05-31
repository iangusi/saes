// apps/api/src/modules/chatbot/chatbot.service.ts
import { ChatbotRepository } from './chatbot.repository';
import { env } from '../../config/env';
import { AppError, NotFoundError } from '../../common/errors/AppError';

const AI_URL = process.env.CHATBOT_AI_URL ?? 'http://localhost:8000';

export interface MensajeDto {
  pregunta: string;
}

export class ChatbotService {
  private readonly repo = new ChatbotRepository();

  // ----------------------------------------------------------------
  // CONVERSACIONES
  // ----------------------------------------------------------------

  async crearConversacion(idUsuario: number): Promise<{ id_conversacion: string }> {
    const id = await this.repo.crearConversacion(idUsuario);
    return { id_conversacion: id };
  }

  async listarConversaciones(idUsuario: number) {
    const convs = await this.repo.listarConversaciones(idUsuario);
    return convs.map((c) => ({
      id_conversacion: c.id_conversacion,
      titulo: c.titulo ?? 'Conversación',
      creado_en: c.creado_en,
      actualizado_en: c.actualizado_en,
    }));
  }

  async eliminarConversacion(idConversacion: string, idUsuario: number): Promise<void> {
    const ok = await this.repo.eliminarConversacion(idConversacion, idUsuario);
    if (!ok) throw new NotFoundError('Conversación no encontrada');
  }

  async obtenerHistorial(idConversacion: string, idUsuario: number) {
    const mensajes = await this.repo.obtenerHistorial(idConversacion, idUsuario);
    return mensajes
      .filter((m) => m.rol !== 'sistema')
      .map((m) => ({
        from: m.rol === 'usuario' ? 'user' : 'bot',
        text: m.contenido,
        timestamp: m.creado_en,
      }));
  }

  // ----------------------------------------------------------------
  // ENVIAR MENSAJE  →  Proxy hacia Python (Gemini)
  // ----------------------------------------------------------------

  async enviarMensaje(
    idConversacion: string,
    idUsuario: number,
    roles: string[],
    dto: MensajeDto,
    token: string
  ): Promise<{ reply: string }> {
    // 1. Verificar que la conversación pertenece a este usuario
    const conv = await this.repo.obtenerConversacion(idConversacion, idUsuario);
    if (!conv) throw new NotFoundError('Conversación no encontrada');

    // 2. Obtener boleta si es alumno (para que el bot pueda consultar BD)
    let boleta: string | null = null;
    if (roles.includes('alumno')) {
      boleta = await this.repo.obtenerBoletaPorUsuario(idUsuario);
    }

    // 3. Guardar mensaje del usuario en MySQL
    await this.repo.guardarMensaje(idConversacion, 'usuario', dto.pregunta);

    // 4. Obtener últimos mensajes como contexto (opcional, puede usarlo el bot)
    const historial = await this.repo.obtenerUltimosMensajes(idConversacion, 6);
    const contextoTexto = historial
      .filter((m) => m.rol !== 'sistema')
      .map((m) => `${m.rol === 'usuario' ? 'Usuario' : 'Asistente'}: ${m.contenido}`)
      .join('\n');

    // 5. Llamar al microservicio Python
    let reply: string;
    try {
      const payload: Record<string, string> = {
        pregunta: dto.pregunta,
        chat_id: idConversacion,
        contexto_previo: contextoTexto,
        token,
      };

      if (boleta) payload.boleta = boleta;
      
      const res = await fetch(`${AI_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new AppError(`AI service error: ${errText}`, 502);
      }

      const data = (await res.json()) as { reply?: string; respuesta?: string };
      reply = data.reply ?? data.respuesta ?? 'Sin respuesta del asistente.';
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError('El servicio de IA no está disponible', 502);
    }

    // 6. Guardar respuesta del bot en MySQL
    await this.repo.guardarMensaje(idConversacion, 'asistente', reply);

    // 7. Si es la primera respuesta, poner el inicio de la pregunta como título
    if (!conv.titulo && dto.pregunta.length > 0) {
      const titulo = dto.pregunta.slice(0, 80);
      await this.repo.actualizarTitulo(idConversacion, titulo);
    }

    return { reply };
  }
}
