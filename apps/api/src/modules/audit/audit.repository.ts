import { pool } from '../../config/database';
import { RowDataPacket } from 'mysql2/promise';

export interface BitacoraRow extends RowDataPacket {
  id_bitacora: number;
  id_usuario: number | null;
  accion: string;
  modulo: string;
  descripcion: string | null;
  ip_origen: string | null;
  metadata: string | null;
  created_at: Date;
  nombre_usuario: string | null;
  identificador: string | null;
}

export class AuditRepository {
  async findAll(limit: number, offset: number, modulo?: string): Promise<BitacoraRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (modulo) {
      conditions.push('ba.modulo = ?');
      params.push(modulo);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit, offset);

    const [rows] = await pool.query<BitacoraRow[]>(
      `SELECT ba.*, u.nombre AS nombre_usuario, u.identificador
       FROM bitacora_auditoria ba
       LEFT JOIN usuario u ON u.id_usuario = ba.id_usuario
       ${where}
       ORDER BY ba.created_at DESC
       LIMIT ? OFFSET ?`,
      params
    );
    return rows;
  }
}
