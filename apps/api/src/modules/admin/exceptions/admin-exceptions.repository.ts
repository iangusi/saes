import { pool } from '../../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface ExceptionGroupRow extends RowDataPacket {
  id_grupo: number;
  clave_grupo: string;
  id_materia: number;
  nombre_materia: string;
  creditos: number;
  semestre_plan: number;
  cupo_disponible: number;
  nombre_profesor: string;
  apellido_paterno_profesor: string;
  horarios: string;
}

export class AdminExceptionsRepository {
  async getActivePeriodo(): Promise<{ id_periodo: number; nombre: string } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id_periodo, nombre FROM periodo_academico WHERE activo = 1 LIMIT 1`
    );
    return (rows[0] as { id_periodo: number; nombre: string }) ?? null;
  }

  async getAllGroupsForException(
    idAlumno: number,
    idPeriodo: number,
    idPlan: number
  ): Promise<ExceptionGroupRow[]> {
    const [rows] = await pool.query<ExceptionGroupRow[]>(
      `SELECT g.id_grupo, g.clave_grupo, m.id_materia, m.nombre AS nombre_materia,
              m.creditos, pm.semestre AS semestre_plan,
              (g.cupo_max - g.cupo_actual) AS cupo_disponible,
              u.nombre AS nombre_profesor, u.apellido_paterno AS apellido_paterno_profesor,
              GROUP_CONCAT(CONCAT(hg.dia_semana,'|',TIME_FORMAT(hg.hora_inicio,'%H:%i'),'|',
                                  TIME_FORMAT(hg.hora_fin,'%H:%i'),'|',a.nombre)
                           ORDER BY hg.dia_semana SEPARATOR ';') AS horarios
       FROM grupo g
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN plan_materia pm ON pm.id_materia = m.id_materia AND pm.id_plan = ?
       JOIN profesor p ON p.id_profesor = g.id_profesor
       JOIN usuario u ON u.id_usuario = p.id_usuario
       LEFT JOIN horario_grupo hg ON hg.id_grupo = g.id_grupo
       LEFT JOIN aula a ON a.id_aula = hg.id_aula
       WHERE g.id_periodo = ?
         AND g.estatus = 'abierto'
         AND (g.cupo_max - g.cupo_actual) > 0
         AND m.id_materia NOT IN (
           SELECT id_materia FROM historial_academico
           WHERE id_alumno = ? AND resultado = 'aprobado'
         )
         AND m.id_materia NOT IN (
           SELECT g2.id_materia FROM inscripcion i2
           JOIN grupo g2 ON g2.id_grupo = i2.id_grupo
           WHERE i2.id_alumno = ? AND g2.id_periodo = ? AND i2.estatus = 'activa'
         )
       GROUP BY g.id_grupo
       ORDER BY pm.semestre, m.nombre`,
      [idPlan, idPeriodo, idAlumno, idAlumno, idPeriodo]
    );
    return rows;
  }

  async getAlreadyEnrolledGroupIds(idAlumno: number, idPeriodo: number): Promise<number[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT g.id_grupo
       FROM inscripcion i
       JOIN grupo g ON g.id_grupo = i.id_grupo
       WHERE i.id_alumno = ? AND g.id_periodo = ? AND i.estatus = 'activa'`,
      [idAlumno, idPeriodo]
    );
    return rows.map((r) => r.id_grupo);
  }

  async getInscritos(idAlumno: number, idPeriodo: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT g.id_grupo, m.creditos
       FROM inscripcion i
       JOIN grupo g ON g.id_grupo = i.id_grupo
       JOIN materia m ON m.id_materia = g.id_materia
       WHERE i.id_alumno = ? AND g.id_periodo = ? AND i.estatus = 'activa'`,
      [idAlumno, idPeriodo]
    );
    return rows;
  }

  async enrollGroupByAdmin(idAlumno: number, idGrupo: number, idAdminUsuario: number): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `INSERT INTO inscripcion (id_alumno, id_grupo) VALUES (?, ?)`,
        [idAlumno, idGrupo]
      );

      const [insResult] = await conn.query<ResultSetHeader>(
        `SELECT id_inscripcion FROM inscripcion WHERE id_alumno = ? AND id_grupo = ?`,
        [idAlumno, idGrupo]
      );

      const [updateResult] = await conn.query<ResultSetHeader>(
        `UPDATE grupo SET cupo_actual = cupo_actual + 1 WHERE id_grupo = ? AND cupo_actual < cupo_max`,
        [idGrupo]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error(`El grupo ${idGrupo} ya no tiene cupos disponibles.`);
      }

      await conn.query(
        `INSERT INTO inscripcion_historial (id_inscripcion, id_usuario_op, accion)
         VALUES (?, ?, 'alta')`,
        [(insResult as unknown as RowDataPacket[])[0]?.id_inscripcion, idAdminUsuario]
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
