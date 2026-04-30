import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface InscripcionActivaRow extends RowDataPacket {
  id_inscripcion: number;
  id_grupo: number;
  nombre_materia: string;
  creditos: number;
  clave_grupo: string;
}

export class WithdrawalsRepository {
  async getWindowForActivePeriod(): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pp.fecha_inicio, pp.fecha_fin, pp.activo, pp.id_periodo
       FROM periodo_proceso pp
       JOIN proceso_academico pa ON pa.id_proceso = pp.id_proceso
       JOIN periodo_academico per ON per.id_periodo = pp.id_periodo AND per.activo = 1
       WHERE pa.nombre = 'baja_materia'`,
      []
    );
    return rows[0] ?? null;
  }

  async getActiveInscripciones(idAlumno: number): Promise<InscripcionActivaRow[]> {
    const [rows] = await pool.query<InscripcionActivaRow[]>(
      `SELECT i.id_inscripcion, g.id_grupo, m.nombre AS nombre_materia,
              m.creditos, g.clave_grupo
       FROM inscripcion i
       JOIN grupo g ON g.id_grupo = i.id_grupo
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN periodo_academico pa ON pa.id_periodo = g.id_periodo AND pa.activo = 1
       WHERE i.id_alumno = ? AND i.estatus = 'activa'`,
      [idAlumno]
    );
    return rows;
  }

  async dropInscripcion(
    idInscripcion: number,
    idAlumno: number,
    idUsuarioOp: number,
    motivo: string
  ): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query<ResultSetHeader>(
        `UPDATE inscripcion SET estatus = 'baja' WHERE id_inscripcion = ? AND id_alumno = ?`,
        [idInscripcion, idAlumno]
      );

      await conn.query(
        `INSERT INTO inscripcion_historial (id_inscripcion, id_usuario_op, accion, motivo)
         VALUES (?, ?, 'baja', ?)`,
        [idInscripcion, idUsuarioOp, motivo]
      );

      // Liberar cupo del grupo
      await conn.query(
        `UPDATE grupo g
         JOIN inscripcion i ON i.id_inscripcion = ?
         SET g.cupo_actual = g.cupo_actual - 1
         WHERE g.id_grupo = i.id_grupo AND g.cupo_actual > 0`,
        [idInscripcion]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
