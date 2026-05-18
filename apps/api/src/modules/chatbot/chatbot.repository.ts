// apps/api/src/modules/chatbot/chatbot.repository.ts
import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export interface ConversacionRow extends RowDataPacket {
  id_conversacion: string;
  id_usuario: number;
  titulo: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

export interface MensajeRow extends RowDataPacket {
  id_mensaje: number;
  id_conversacion: string;
  rol: 'usuario' | 'asistente' | 'sistema';
  contenido: string;
  creado_en: Date;
}

export class ChatbotRepository {
  // ------------------------------------------------------------------
  // CONVERSACIONES
  // ------------------------------------------------------------------

  async crearConversacion(idUsuario: number): Promise<string> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO chat_conversacion (id_conversacion, id_usuario) VALUES (?, ?)`,
      [id, idUsuario]
    );
    return id;
  }

  async listarConversaciones(idUsuario: number): Promise<ConversacionRow[]> {
    const [rows] = await pool.query<ConversacionRow[]>(
      `SELECT id_conversacion, id_usuario, titulo, creado_en, actualizado_en
       FROM chat_conversacion
       WHERE id_usuario = ?
       ORDER BY actualizado_en DESC`,
      [idUsuario]
    );
    return rows;
  }

  async obtenerConversacion(
    idConversacion: string,
    idUsuario: number
  ): Promise<ConversacionRow | null> {
    const [rows] = await pool.query<ConversacionRow[]>(
      `SELECT id_conversacion, id_usuario, titulo, creado_en, actualizado_en
       FROM chat_conversacion
       WHERE id_conversacion = ? AND id_usuario = ?`,
      [idConversacion, idUsuario]
    );
    return rows[0] ?? null;
  }

  async eliminarConversacion(idConversacion: string, idUsuario: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM chat_conversacion
       WHERE id_conversacion = ? AND id_usuario = ?`,
      [idConversacion, idUsuario]
    );
    return result.affectedRows > 0;
  }

  async actualizarTitulo(idConversacion: string, titulo: string): Promise<void> {
    await pool.query(
      `UPDATE chat_conversacion SET titulo = ? WHERE id_conversacion = ?`,
      [titulo, idConversacion]
    );
  }

  // ------------------------------------------------------------------
  // MENSAJES
  // ------------------------------------------------------------------

  async guardarMensaje(
    idConversacion: string,
    rol: 'usuario' | 'asistente' | 'sistema',
    contenido: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO chat_mensaje (id_conversacion, rol, contenido) VALUES (?, ?, ?)`,
      [idConversacion, rol, contenido]
    );
    // Actualizar timestamp de la conversación
    await pool.query(
      `UPDATE chat_conversacion SET actualizado_en = NOW() WHERE id_conversacion = ?`,
      [idConversacion]
    );
  }

  async obtenerHistorial(
    idConversacion: string,
    idUsuario: number,
    limite = 20
  ): Promise<MensajeRow[]> {
    // Verificar que la conversación pertenece al usuario
    const conv = await this.obtenerConversacion(idConversacion, idUsuario);
    if (!conv) return [];

    const [rows] = await pool.query<MensajeRow[]>(
      `SELECT id_mensaje, id_conversacion, rol, contenido, creado_en
       FROM chat_mensaje
       WHERE id_conversacion = ?
       ORDER BY creado_en ASC
       LIMIT ?`,
      [idConversacion, limite]
    );
    return rows;
  }

  async obtenerUltimosMensajes(idConversacion: string, n = 6): Promise<MensajeRow[]> {
    const [rows] = await pool.query<MensajeRow[]>(
      `SELECT id_mensaje, id_conversacion, rol, contenido, creado_en
       FROM (
         SELECT * FROM chat_mensaje
         WHERE id_conversacion = ?
         ORDER BY creado_en DESC
         LIMIT ?
       ) sub
       ORDER BY creado_en ASC`,
      [idConversacion, n]
    );
    return rows;
  }

  // ------------------------------------------------------------------
  // DATOS DEL ALUMNO (para contexto del chatbot)
  // ------------------------------------------------------------------

  async obtenerBoletaPorUsuario(idUsuario: number): Promise<string | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT boleta FROM alumno WHERE id_usuario = ? LIMIT 1`,
      [idUsuario]
    );
    return (rows[0]?.boleta as string) ?? null;
  }

  async obtenerDatosAlumno(idUsuario: number): Promise<Record<string, unknown> | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         a.boleta,
         u.nombre,
         u.apellido_paterno,
         u.apellido_materno,
         u.correo_contacto,
         c.nombre AS carrera,
         a.semestre_actual,
         a.promedio
       FROM alumno a
       JOIN usuario u ON u.id_usuario = a.id_usuario
       JOIN plan_estudios pe ON pe.id_plan = a.id_plan
       JOIN carrera c ON c.id_carrera = pe.id_carrera
       WHERE a.id_usuario = ?`,
      [idUsuario]
    );
    return rows[0] ?? null;
  }
}
