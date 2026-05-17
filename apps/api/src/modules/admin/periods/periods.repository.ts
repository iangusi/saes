import { pool } from '../../../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import {
  PeriodoRow,
  ProcesoAcademicoRow,
  PeriodoProcesoRow,
  CitaAdminRow,
  AlumnoParaCitaRow,
  CreatePeriodDto,
  UpdatePeriodDto,
  CreateProcessWindowDto,
  UpdateProcessWindowDto,
  CreateProcessTypeDto,
  UpdateProcessTypeDto,
} from './periods.types';

export class PeriodsRepository {
  async getAllPeriods(): Promise<PeriodoRow[]> {
    const [rows] = await pool.query<PeriodoRow[]>(
      `SELECT id_periodo, nombre, DATE_FORMAT(fecha_inicio,'%Y-%m-%d') AS fecha_inicio,
              DATE_FORMAT(fecha_fin,'%Y-%m-%d') AS fecha_fin, activo
       FROM periodo_academico ORDER BY fecha_inicio DESC`
    );
    return rows;
  }

  async getPeriodById(id: number): Promise<PeriodoRow | null> {
    const [rows] = await pool.query<PeriodoRow[]>(
      `SELECT id_periodo, nombre, DATE_FORMAT(fecha_inicio,'%Y-%m-%d') AS fecha_inicio,
              DATE_FORMAT(fecha_fin,'%Y-%m-%d') AS fecha_fin, activo
       FROM periodo_academico WHERE id_periodo = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async createPeriod(dto: CreatePeriodDto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO periodo_academico (nombre, fecha_inicio, fecha_fin, activo)
       VALUES (?, ?, ?, ?)`,
      [dto.nombre, dto.fechaInicio, dto.fechaFin, dto.activo ? 1 : 0]
    );
    return result.insertId;
  }

  async updatePeriod(id: number, dto: UpdatePeriodDto): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (dto.nombre !== undefined) { fields.push('nombre = ?'); values.push(dto.nombre); }
    if (dto.fechaInicio !== undefined) { fields.push('fecha_inicio = ?'); values.push(dto.fechaInicio); }
    if (dto.fechaFin !== undefined) { fields.push('fecha_fin = ?'); values.push(dto.fechaFin); }
    if (dto.activo !== undefined) { fields.push('activo = ?'); values.push(dto.activo ? 1 : 0); }

    if (fields.length === 0) return;
    values.push(id);

    await pool.query(`UPDATE periodo_academico SET ${fields.join(', ')} WHERE id_periodo = ?`, values);
  }

  async hasDependencies(idPeriodo: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM grupo WHERE id_periodo = ?`,
      [idPeriodo]
    );
    return rows[0].cnt > 0;
  }

  async deletePeriod(id: number): Promise<void> {
    await pool.query(`DELETE FROM periodo_academico WHERE id_periodo = ?`, [id]);
  }

  // ─── Process Types CRUD ───────────────────────────────────────────────────────

  async getAllProcessTypes(): Promise<ProcesoAcademicoRow[]> {
    const [rows] = await pool.query<ProcesoAcademicoRow[]>(
      `SELECT id_proceso, nombre, descripcion FROM proceso_academico ORDER BY id_proceso`
    );
    return rows;
  }

  async getProcessTypeById(id: number): Promise<ProcesoAcademicoRow | null> {
    const [rows] = await pool.query<ProcesoAcademicoRow[]>(
      `SELECT id_proceso, nombre, descripcion FROM proceso_academico WHERE id_proceso = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async createProcessType(dto: CreateProcessTypeDto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO proceso_academico (nombre, descripcion) VALUES (?, ?)`,
      [dto.nombre, dto.descripcion ?? null]
    );
    return result.insertId;
  }

  async updateProcessType(id: number, dto: UpdateProcessTypeDto): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (dto.nombre !== undefined) { fields.push('nombre = ?'); values.push(dto.nombre); }
    if (dto.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(dto.descripcion); }

    if (fields.length === 0) return;
    values.push(id);

    await pool.query(`UPDATE proceso_academico SET ${fields.join(', ')} WHERE id_proceso = ?`, values);
  }

  async deleteProcessType(id: number): Promise<void> {
    await pool.query(`DELETE FROM proceso_academico WHERE id_proceso = ?`, [id]);
  }

  async processTypeHasDependencies(id: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM periodo_proceso WHERE id_proceso = ?`,
      [id]
    );
    return rows[0].cnt > 0;
  }

  // ─── Process Windows ──────────────────────────────────────────────────────────

  async getProcessWindowsByPeriod(idPeriodo: number): Promise<PeriodoProcesoRow[]> {
    const [rows] = await pool.query<PeriodoProcesoRow[]>(
      `SELECT pp.id_periodo_proceso, pp.id_periodo, pp.id_proceso,
              pa.nombre AS nombre_proceso,
              DATE_FORMAT(pp.fecha_inicio,'%Y-%m-%dT%H:%i') AS fecha_inicio,
              DATE_FORMAT(pp.fecha_fin,'%Y-%m-%dT%H:%i') AS fecha_fin,
              pp.activo
       FROM periodo_proceso pp
       JOIN proceso_academico pa ON pa.id_proceso = pp.id_proceso
       WHERE pp.id_periodo = ?
       ORDER BY pp.fecha_inicio`,
      [idPeriodo]
    );
    return rows;
  }

  async createProcessWindow(idPeriodo: number, dto: CreateProcessWindowDto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO periodo_proceso (id_periodo, id_proceso, fecha_inicio, fecha_fin, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [idPeriodo, dto.idProceso, dto.fechaInicio, dto.fechaFin, dto.activo ? 1 : 0]
    );
    return result.insertId;
  }

  async updateProcessWindow(id: number, dto: UpdateProcessWindowDto): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (dto.fechaInicio !== undefined) { fields.push('fecha_inicio = ?'); values.push(dto.fechaInicio); }
    if (dto.fechaFin !== undefined) { fields.push('fecha_fin = ?'); values.push(dto.fechaFin); }
    if (dto.activo !== undefined) { fields.push('activo = ?'); values.push(dto.activo ? 1 : 0); }

    if (fields.length === 0) return;
    values.push(id);

    await pool.query(`UPDATE periodo_proceso SET ${fields.join(', ')} WHERE id_periodo_proceso = ?`, values);
  }

  async deleteProcessWindow(id: number): Promise<void> {
    await pool.query(`DELETE FROM periodo_proceso WHERE id_periodo_proceso = ?`, [id]);
  }

  async getProcessWindowById(id: number): Promise<PeriodoProcesoRow | null> {
    const [rows] = await pool.query<PeriodoProcesoRow[]>(
      `SELECT pp.id_periodo_proceso, pp.id_periodo, pp.id_proceso,
              pa.nombre AS nombre_proceso,
              DATE_FORMAT(pp.fecha_inicio,'%Y-%m-%dT%H:%i') AS fecha_inicio,
              DATE_FORMAT(pp.fecha_fin,'%Y-%m-%dT%H:%i') AS fecha_fin,
              pp.activo
       FROM periodo_proceso pp
       JOIN proceso_academico pa ON pa.id_proceso = pp.id_proceso
       WHERE pp.id_periodo_proceso = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async getReinscripcionWindow(idPeriodo: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pp.fecha_inicio, pp.fecha_fin
       FROM periodo_proceso pp
       JOIN proceso_academico pa ON pa.id_proceso = pp.id_proceso
       WHERE pa.nombre = 'reinscripcion' AND pp.id_periodo = ?`,
      [idPeriodo]
    );
    return rows[0] ?? null;
  }

  // ─── Appointments ─────────────────────────────────────────────────────────────

  async getAppointmentsByPeriod(idPeriodo: number): Promise<CitaAdminRow[]> {
    const [rows] = await pool.query<CitaAdminRow[]>(
      `SELECT cr.id_cita, cr.id_alumno, a.boleta,
              CONCAT(u.nombre,' ',u.apellido_paterno) AS nombre_alumno,
              u.correo_contacto,
              DATE_FORMAT(cr.fecha_cita,'%Y-%m-%d') AS fecha_cita,
              TIME_FORMAT(cr.hora_inicio,'%H:%i') AS hora_inicio,
              TIME_FORMAT(cr.hora_fin,'%H:%i') AS hora_fin,
              cr.estatus
       FROM cita_reinscripcion cr
       JOIN alumno a ON a.id_alumno = cr.id_alumno
       JOIN usuario u ON u.id_usuario = a.id_usuario
       WHERE cr.id_periodo = ?
       ORDER BY cr.fecha_cita, cr.hora_inicio`,
      [idPeriodo]
    );
    return rows;
  }

  async countAppointments(idPeriodo: number): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM cita_reinscripcion WHERE id_periodo = ?`,
      [idPeriodo]
    );
    return rows[0].cnt;
  }

  /**
   * Alumnos regulares (activos, sin materias reprobadas) que NO están inscritos
   * en el periodo indicado. Ordenados por promedio DESC, semestre DESC.
   */
  async getAlumnosParaCitas(idPeriodo: number): Promise<AlumnoParaCitaRow[]> {
    const [rows] = await pool.query<AlumnoParaCitaRow[]>(
      `SELECT DISTINCT a.id_alumno, a.boleta, a.semestre_actual,
              CONCAT(u.nombre,' ',u.apellido_paterno) AS nombre,
              u.correo_contacto AS correo,
              COALESCE(
                (SELECT AVG(ha.calificacion_final)
                 FROM historial_academico ha
                 WHERE ha.id_alumno = a.id_alumno AND ha.resultado = 'aprobado'),
                0
              ) AS promedio
       FROM alumno a
       JOIN usuario u ON u.id_usuario = a.id_usuario
       WHERE a.estatus = 'activo'
         AND u.activo = 1
         AND NOT EXISTS (
           SELECT 1 FROM historial_academico ha2
           WHERE ha2.id_alumno = a.id_alumno AND ha2.resultado = 'reprobado'
         )
         AND NOT EXISTS (
           SELECT 1 FROM inscripcion i
           JOIN grupo g ON g.id_grupo = i.id_grupo
           WHERE g.id_periodo = ?
             AND i.id_alumno = a.id_alumno
             AND i.estatus = 'activa'
         )
       ORDER BY promedio DESC, a.semestre_actual DESC`,
      [idPeriodo]
    );
    return rows;
  }

  async deleteAppointmentsByPeriod(idPeriodo: number): Promise<void> {
    await pool.query(
      `DELETE FROM cita_reinscripcion WHERE id_periodo = ?`,
      [idPeriodo]
    );
  }

  async insertAppointmentsBatch(
    citas: Array<{ idAlumno: number; idPeriodo: number; fechaCita: string; horaInicio: string; horaFin: string }>
  ): Promise<void> {
    if (citas.length === 0) return;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `DELETE FROM cita_reinscripcion WHERE id_periodo = ?`,
        [citas[0].idPeriodo]
      );

      const values = citas.map((c) => [c.idAlumno, c.idPeriodo, c.fechaCita, c.horaInicio, c.horaFin, 'pendiente']);
      await conn.query(
        `INSERT INTO cita_reinscripcion (id_alumno, id_periodo, fecha_cita, hora_inicio, hora_fin, estatus)
         VALUES ?`,
        [values]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getAlumnoByBoleta(boleta: string): Promise<{ id_alumno: number; nombre: string; correo: string } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.id_alumno,
              CONCAT(u.nombre,' ',u.apellido_paterno) AS nombre,
              u.correo_contacto AS correo
       FROM alumno a
       JOIN usuario u ON u.id_usuario = a.id_usuario
       WHERE a.boleta = ?`,
      [boleta]
    );
    return rows[0]
      ? { id_alumno: rows[0].id_alumno, nombre: rows[0].nombre, correo: rows[0].correo }
      : null;
  }

  async upsertManualAppointment(dto: { idAlumno: number; idPeriodo: number; fechaCita: string; horaInicio: string; horaFin: string }): Promise<void> {
    await pool.query(
      `INSERT INTO cita_reinscripcion (id_alumno, id_periodo, fecha_cita, hora_inicio, hora_fin, estatus)
       VALUES (?, ?, ?, ?, ?, 'pendiente')
       ON DUPLICATE KEY UPDATE fecha_cita = VALUES(fecha_cita),
         hora_inicio = VALUES(hora_inicio), hora_fin = VALUES(hora_fin), estatus = 'pendiente'`,
      [dto.idAlumno, dto.idPeriodo, dto.fechaCita, dto.horaInicio, dto.horaFin]
    );
  }

  async getAlumnoEmailById(idAlumno: number): Promise<{ nombre: string; correo: string } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT CONCAT(u.nombre,' ',u.apellido_paterno) AS nombre, u.correo_contacto AS correo
       FROM alumno a JOIN usuario u ON u.id_usuario = a.id_usuario
       WHERE a.id_alumno = ?`,
      [idAlumno]
    );
    return rows[0] ? { nombre: rows[0].nombre, correo: rows[0].correo } : null;
  }

  // ─── Finalizar ciclo ──────────────────────────────────────────────────────────

  async finalizePeriod(id: number): Promise<{ alumnosAvanzados: number }> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE periodo_academico SET activo = 0 WHERE id_periodo = ?`,
        [id]
      );

      await conn.query(
        `UPDATE cita_reinscripcion SET estatus = 'expirada'
         WHERE id_periodo = ? AND estatus = 'pendiente'`,
        [id]
      );

      const [result] = await conn.query<ResultSetHeader>(
        `UPDATE alumno SET semestre_actual = semestre_actual + 1
         WHERE id_alumno IN (
           SELECT DISTINCT i.id_alumno
           FROM inscripcion i
           JOIN grupo g ON g.id_grupo = i.id_grupo
           WHERE g.id_periodo = ? AND i.estatus = 'activa'
         )`,
        [id]
      );

      await conn.commit();
      return { alumnosAvanzados: result.affectedRows };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
