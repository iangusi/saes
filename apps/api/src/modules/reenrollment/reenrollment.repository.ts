import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface CitaRow extends RowDataPacket {
  id_cita: number;
  fecha_cita: string;
  hora_inicio: string;
  hora_fin: string;
  estatus: string;
  id_periodo: number;
  nombre_periodo: string;
}

export interface EligibleGroupRow extends RowDataPacket {
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

export class ReenrollmentRepository {
  async getActiveCita(idAlumno: number): Promise<CitaRow | null> {
    const [rows] = await pool.query<CitaRow[]>(
      `SELECT cr.id_cita, DATE_FORMAT(cr.fecha_cita,'%Y-%m-%d') AS fecha_cita,
              TIME_FORMAT(cr.hora_inicio,'%H:%i') AS hora_inicio,
              TIME_FORMAT(cr.hora_fin,'%H:%i') AS hora_fin,
              cr.estatus, cr.id_periodo, pa.nombre AS nombre_periodo
       FROM cita_reinscripcion cr
       JOIN periodo_academico pa ON pa.id_periodo = cr.id_periodo
       WHERE cr.id_alumno = ?
         AND pa.activo = 1
       ORDER BY cr.id_cita DESC LIMIT 1`,
      [idAlumno]
    );
    return rows[0] ?? null;
  }

  async getReinscripcionWindow(idPeriodo: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pp.fecha_inicio, pp.fecha_fin, pp.activo
       FROM periodo_proceso pp
       JOIN proceso_academico pa ON pa.id_proceso = pp.id_proceso
       WHERE pa.nombre = 'reinscripcion' AND pp.id_periodo = ?`,
      [idPeriodo]
    );
    return rows[0] ?? null;
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

  async getApprovedMateriaIds(idAlumno: number): Promise<number[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id_materia FROM historial_academico
       WHERE id_alumno = ? AND resultado = 'aprobado'`,
      [idAlumno]
    );
    return rows.map((r) => r.id_materia);
  }

  async getEligibleGroups(
    idAlumno: number,
    idPeriodo: number,
    semestre: number,
    idPlan: number
  ): Promise<EligibleGroupRow[]> {
    const [rows] = await pool.query<EligibleGroupRow[]>(
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
         AND pm.semestre BETWEEN ? AND ?
         AND m.id_materia NOT IN (
           SELECT id_materia FROM historial_academico
           WHERE id_alumno = ? AND resultado = 'aprobado'
         )
         AND m.id_materia NOT IN (
           SELECT g2.id_materia FROM inscripcion i2
           JOIN grupo g2 ON g2.id_grupo = i2.id_grupo
           WHERE i2.id_alumno = ? AND g2.id_periodo = ? AND i2.estatus = 'activa'
         )
       GROUP BY g.id_grupo`,
      [idPlan, idPeriodo, semestre - 2, semestre + 2, idAlumno, idAlumno, idPeriodo]
    );
    return rows;
  }

  async getPrerequisitesForMateria(idMateria: number): Promise<number[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id_prerrequisito_materia FROM materia_prerrequisito WHERE id_materia = ?`,
      [idMateria]
    );
    return rows.map((r) => r.id_prerrequisito_materia);
  }

  async getInscritos(idAlumno: number, idPeriodo: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT g.id_grupo, m.creditos,
              GROUP_CONCAT(CONCAT(hg.dia_semana,'|',hg.hora_inicio,'|',hg.hora_fin)
                           ORDER BY hg.dia_semana SEPARATOR ';') AS horarios_raw
       FROM inscripcion i
       JOIN grupo g ON g.id_grupo = i.id_grupo
       JOIN materia m ON m.id_materia = g.id_materia
       LEFT JOIN horario_grupo hg ON hg.id_grupo = g.id_grupo
       WHERE i.id_alumno = ? AND g.id_periodo = ? AND i.estatus = 'activa'
       GROUP BY g.id_grupo`,
      [idAlumno, idPeriodo]
    );
    return rows;
  }

  async getPlanCreditLimits(idPlan: number): Promise<{ minCredits: number; maxCredits: number }> {
    // Límites institucionales para ESCOM: mínimo 28 créditos, máximo 55.5
    // Se podrían guardar en tabla de configuración; aquí son constantes del plan
    void idPlan;
    return { minCredits: 28, maxCredits: 55.5 };
  }

  async enrollGroup(idAlumno: number, idGrupo: number): Promise<void> {
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
        [(insResult as unknown as RowDataPacket[])[0]?.id_inscripcion, idAlumno]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async markCitaUsed(idCita: number): Promise<void> {
    await pool.query(
      `UPDATE cita_reinscripcion SET estatus = 'usada' WHERE id_cita = ?`,
      [idCita]
    );
  }
}
