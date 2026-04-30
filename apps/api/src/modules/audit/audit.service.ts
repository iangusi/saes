import { pool } from '../../config/database';

export interface AuditLogParams {
  idUsuario?: number;
  accion: string;
  modulo: string;
  descripcion?: string;
  ipOrigen?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  async log(params: AuditLogParams): Promise<void> {
    await pool.query(
      `INSERT INTO bitacora_auditoria
         (id_usuario, accion, modulo, descripcion, ip_origen, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.idUsuario ?? null,
        params.accion,
        params.modulo,
        params.descripcion ?? null,
        params.ipOrigen ?? null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    );
  }
}
