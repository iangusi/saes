import { pool } from '../../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import {
  CreateCarreraDto, UpdateCarreraDto,
  CreatePlanDto, UpdatePlanDto, AddMateriaAlPlanDto,
  CreateMateriaDto, UpdateMateriaDto, AddPrerrequistoDto,
  CreateGrupoDto, UpdateGrupoDto,
  CreateHorarioDto, UpdateHorarioDto,
} from './admin-offer.types';

export class AdminOfferRepository {

  // ─── Departamentos ────────────────────────────────────────────────────────

  async getDepartamentos() {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_departamento, nombre, clave FROM departamento WHERE activo = 1 ORDER BY nombre ASC'
    );
    return rows;
  }

  // ─── Carreras ─────────────────────────────────────────────────────────────

  async getCarreras() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id_carrera, c.id_departamento, c.nombre, c.clave, c.activo,
              d.nombre AS nombre_departamento
       FROM carrera c
       JOIN departamento d ON d.id_departamento = c.id_departamento
       ORDER BY c.nombre ASC`
    );
    return rows;
  }

  async getCarreraById(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id_carrera, c.id_departamento, c.nombre, c.clave, c.activo,
              d.nombre AS nombre_departamento
       FROM carrera c
       JOIN departamento d ON d.id_departamento = c.id_departamento
       WHERE c.id_carrera = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async createCarrera(dto: CreateCarreraDto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO carrera (id_departamento, nombre, clave, activo) VALUES (?, ?, ?, 1)',
      [dto.idDepartamento, dto.nombre, dto.clave]
    );
    return result.insertId;
  }

  async updateCarrera(id: number, dto: UpdateCarreraDto): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (dto.nombre !== undefined) { fields.push('nombre = ?'); params.push(dto.nombre); }
    if (dto.clave !== undefined) { fields.push('clave = ?'); params.push(dto.clave); }
    if (dto.idDepartamento !== undefined) { fields.push('id_departamento = ?'); params.push(dto.idDepartamento); }
    if (dto.activo !== undefined) { fields.push('activo = ?'); params.push(dto.activo ? 1 : 0); }

    if (fields.length === 0) return;
    params.push(id);
    await pool.query(`UPDATE carrera SET ${fields.join(', ')} WHERE id_carrera = ?`, params);
  }

  async deleteCarrera(id: number): Promise<void> {
    await pool.query('DELETE FROM carrera WHERE id_carrera = ?', [id]);
  }

  // ─── Planes de estudio ────────────────────────────────────────────────────

  async getPlanes() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id_plan, p.id_carrera, p.nombre, p.total_creditos, p.total_materias, p.activo,
              c.nombre AS nombre_carrera
       FROM plan_estudios p
       JOIN carrera c ON c.id_carrera = p.id_carrera
       ORDER BY c.nombre ASC, p.nombre ASC`
    );
    return rows;
  }

  async getPlanById(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id_plan, p.id_carrera, p.nombre, p.total_creditos, p.total_materias, p.activo,
              c.nombre AS nombre_carrera
       FROM plan_estudios p
       JOIN carrera c ON c.id_carrera = p.id_carrera
       WHERE p.id_plan = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async getPlanMaterias(idPlan: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.id_materia, m.clave, m.nombre, m.creditos, pm.semestre, pm.tipo
       FROM plan_materia pm
       JOIN materia m ON m.id_materia = pm.id_materia
       WHERE pm.id_plan = ?
       ORDER BY pm.semestre ASC, m.nombre ASC`,
      [idPlan]
    );
    return rows;
  }

  async createPlan(dto: CreatePlanDto): Promise<number> {
    const anioActual = new Date().getFullYear();
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO plan_estudios (id_carrera, nombre, anio_inicio, total_creditos, total_materias, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [dto.idCarrera, dto.nombre, anioActual, dto.totalCreditos, dto.totalMaterias]
    );
    return result.insertId;
  }

  async updatePlan(id: number, dto: UpdatePlanDto): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (dto.nombre !== undefined) { fields.push('nombre = ?'); params.push(dto.nombre); }
    if (dto.idCarrera !== undefined) { fields.push('id_carrera = ?'); params.push(dto.idCarrera); }
    if (dto.totalCreditos !== undefined) { fields.push('total_creditos = ?'); params.push(dto.totalCreditos); }
    if (dto.totalMaterias !== undefined) { fields.push('total_materias = ?'); params.push(dto.totalMaterias); }
    if (dto.activo !== undefined) { fields.push('activo = ?'); params.push(dto.activo ? 1 : 0); }

    if (fields.length === 0) return;
    params.push(id);
    await pool.query(`UPDATE plan_estudios SET ${fields.join(', ')} WHERE id_plan = ?`, params);
  }

  async deletePlan(id: number): Promise<void> {
    await pool.query('DELETE FROM plan_estudios WHERE id_plan = ?', [id]);
  }

  async planMateriaExists(idPlan: number, idMateria: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM plan_materia WHERE id_plan = ? AND id_materia = ?',
      [idPlan, idMateria]
    );
    return rows.length > 0;
  }

  async addMateriaAlPlan(idPlan: number, dto: AddMateriaAlPlanDto): Promise<void> {
    await pool.query(
      'INSERT INTO plan_materia (id_plan, id_materia, semestre, tipo) VALUES (?, ?, ?, ?)',
      [idPlan, dto.idMateria, dto.semestre, dto.tipo]
    );
  }

  async removeMateriaDelPlan(idPlan: number, idMateria: number): Promise<void> {
    await pool.query(
      'DELETE FROM plan_materia WHERE id_plan = ? AND id_materia = ?',
      [idPlan, idMateria]
    );
  }

  // ─── Materias ─────────────────────────────────────────────────────────────

  async getMaterias(search?: string) {
    let sql = 'SELECT id_materia, clave, nombre, creditos, horas_teoria, horas_practica, activo FROM materia';
    const params: unknown[] = [];

    if (search) {
      sql += ' WHERE (nombre LIKE ? OR clave LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY nombre ASC';

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows;
  }

  async getMateriaById(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_materia, clave, nombre, creditos, horas_teoria, horas_practica, activo FROM materia WHERE id_materia = ?',
      [id]
    );
    return rows[0] ?? null;
  }

  async getMateriasList() {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_materia, clave, nombre FROM materia WHERE activo = 1 ORDER BY nombre ASC'
    );
    return rows;
  }

  async createMateria(dto: CreateMateriaDto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO materia (clave, nombre, creditos, horas_teoria, horas_practica, activo) VALUES (?, ?, ?, ?, ?, 1)',
      [dto.clave, dto.nombre, dto.creditos, dto.horasTeoria, dto.horasPractica]
    );
    return result.insertId;
  }

  async updateMateria(id: number, dto: UpdateMateriaDto): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (dto.clave !== undefined) { fields.push('clave = ?'); params.push(dto.clave); }
    if (dto.nombre !== undefined) { fields.push('nombre = ?'); params.push(dto.nombre); }
    if (dto.creditos !== undefined) { fields.push('creditos = ?'); params.push(dto.creditos); }
    if (dto.horasTeoria !== undefined) { fields.push('horas_teoria = ?'); params.push(dto.horasTeoria); }
    if (dto.horasPractica !== undefined) { fields.push('horas_practica = ?'); params.push(dto.horasPractica); }
    if (dto.activo !== undefined) { fields.push('activo = ?'); params.push(dto.activo ? 1 : 0); }

    if (fields.length === 0) return;
    params.push(id);
    await pool.query(`UPDATE materia SET ${fields.join(', ')} WHERE id_materia = ?`, params);
  }

  async deleteMateria(id: number): Promise<void> {
    await pool.query('DELETE FROM materia WHERE id_materia = ?', [id]);
  }

  async getPrerrequisitos(idMateria: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT m.id_materia, m.clave, m.nombre
       FROM materia_prerrequisito mp
       JOIN materia m ON m.id_materia = mp.id_prerrequisito_materia
       WHERE mp.id_materia = ?
       ORDER BY m.nombre ASC`,
      [idMateria]
    );
    return rows;
  }

  async prerrequistoExists(idMateria: number, idPrerrequisito: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM materia_prerrequisito WHERE id_materia = ? AND id_prerrequisito_materia = ?',
      [idMateria, idPrerrequisito]
    );
    return rows.length > 0;
  }

  async addPrerrequisito(idMateria: number, dto: AddPrerrequistoDto): Promise<void> {
    await pool.query(
      'INSERT INTO materia_prerrequisito (id_materia, id_prerrequisito_materia) VALUES (?, ?)',
      [idMateria, dto.idPrerrequisito]
    );
  }

  async removePrerrequisito(idMateria: number, idPrerrequisito: number): Promise<void> {
    await pool.query(
      'DELETE FROM materia_prerrequisito WHERE id_materia = ? AND id_prerrequisito_materia = ?',
      [idMateria, idPrerrequisito]
    );
  }

  // ─── Aulas y Profesores ───────────────────────────────────────────────────

  async getAulas() {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_aula, nombre, edificio, capacidad FROM aula WHERE activo = 1 ORDER BY edificio ASC, nombre ASC'
    );
    return rows;
  }

  async getProfesores() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id_profesor, p.id_usuario, p.numero_empleado,
              CONCAT(u.nombre, ' ', u.apellido_paterno, IFNULL(CONCAT(' ', u.apellido_materno), '')) AS nombre_completo,
              d.nombre AS departamento
       FROM profesor p
       JOIN usuario u ON u.id_usuario = p.id_usuario
       JOIN departamento d ON d.id_departamento = p.id_departamento
       WHERE p.estatus = 'activo'
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`
    );
    return rows;
  }

  // ─── Grupos ───────────────────────────────────────────────────────────────

  async getGrupos(idPeriodo?: number) {
    const params: unknown[] = [];
    let where = '';

    if (idPeriodo) {
      where = 'WHERE g.id_periodo = ?';
      params.push(idPeriodo);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT g.id_grupo, g.id_periodo, g.id_materia, g.id_profesor, g.clave_grupo,
              g.cupo_max, g.cupo_actual, g.estatus,
              m.nombre AS nombre_materia, m.clave AS clave_materia,
              CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_profesor,
              p.numero_empleado
       FROM grupo g
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN profesor p ON p.id_profesor = g.id_profesor
       JOIN usuario u ON u.id_usuario = p.id_usuario
       ${where}
       ORDER BY m.nombre ASC, g.clave_grupo ASC`,
      params
    );
    return rows;
  }

  async getGrupoById(id: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT g.id_grupo, g.id_periodo, g.id_materia, g.id_profesor, g.clave_grupo,
              g.cupo_max, g.cupo_actual, g.estatus,
              m.nombre AS nombre_materia, m.clave AS clave_materia,
              CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_profesor,
              p.numero_empleado
       FROM grupo g
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN profesor p ON p.id_profesor = g.id_profesor
       JOIN usuario u ON u.id_usuario = p.id_usuario
       WHERE g.id_grupo = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async countInscripcionesActivas(idGrupo: number): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM inscripcion WHERE id_grupo = ? AND estatus = 'activa'",
      [idGrupo]
    );
    return rows[0]?.total ?? 0;
  }

  async createGrupo(dto: CreateGrupoDto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO grupo (id_periodo, id_materia, id_profesor, clave_grupo, cupo_max, cupo_actual, estatus) VALUES (?, ?, ?, ?, ?, 0, ?)',
      [dto.idPeriodo, dto.idMateria, dto.idProfesor, dto.claveGrupo, dto.cupoMax, dto.estatus ?? 'abierto']
    );
    return result.insertId;
  }

  async updateGrupo(id: number, dto: UpdateGrupoDto): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (dto.idProfesor !== undefined) { fields.push('id_profesor = ?'); params.push(dto.idProfesor); }
    if (dto.claveGrupo !== undefined) { fields.push('clave_grupo = ?'); params.push(dto.claveGrupo); }
    if (dto.cupoMax !== undefined) { fields.push('cupo_max = ?'); params.push(dto.cupoMax); }
    if (dto.estatus !== undefined) { fields.push('estatus = ?'); params.push(dto.estatus); }

    if (fields.length === 0) return;
    params.push(id);
    await pool.query(`UPDATE grupo SET ${fields.join(', ')} WHERE id_grupo = ?`, params);
  }

  async deleteGrupo(id: number): Promise<void> {
    await pool.query('DELETE FROM grupo WHERE id_grupo = ?', [id]);
  }

  // ─── Horarios ─────────────────────────────────────────────────────────────

  async getHorarios(idGrupo: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT hg.id_horario_grupo AS id_horario, hg.id_grupo, hg.id_aula,
              hg.dia_semana, TIME_FORMAT(hg.hora_inicio,'%H:%i') AS hora_inicio,
              TIME_FORMAT(hg.hora_fin,'%H:%i') AS hora_fin,
              a.nombre AS nombre_aula, a.edificio
       FROM horario_grupo hg
       JOIN aula a ON a.id_aula = hg.id_aula
       WHERE hg.id_grupo = ?
       ORDER BY FIELD(hg.dia_semana,'lunes','martes','miercoles','jueves','viernes','sabado'), hg.hora_inicio`,
      [idGrupo]
    );
    return rows;
  }

  async getHorarioById(idHorario: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_horario_grupo AS id_horario, id_grupo, id_aula, dia_semana, hora_inicio, hora_fin FROM horario_grupo WHERE id_horario_grupo = ?',
      [idHorario]
    );
    return rows[0] ?? null;
  }

  async createHorario(idGrupo: number, dto: CreateHorarioDto): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO horario_grupo (id_grupo, id_aula, dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?)',
      [idGrupo, dto.idAula, dto.diaSemana, dto.horaInicio, dto.horaFin]
    );
    return result.insertId; // This is id_horario_grupo
  }

  async updateHorario(idHorario: number, dto: UpdateHorarioDto): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (dto.idAula !== undefined) { fields.push('id_aula = ?'); params.push(dto.idAula); }
    if (dto.diaSemana !== undefined) { fields.push('dia_semana = ?'); params.push(dto.diaSemana); }
    if (dto.horaInicio !== undefined) { fields.push('hora_inicio = ?'); params.push(dto.horaInicio); }
    if (dto.horaFin !== undefined) { fields.push('hora_fin = ?'); params.push(dto.horaFin); }

    if (fields.length === 0) return;
    params.push(idHorario);
    await pool.query(`UPDATE horario_grupo SET ${fields.join(', ')} WHERE id_horario_grupo = ?`, params);
  }

  async deleteHorario(idHorario: number): Promise<void> {
    await pool.query('DELETE FROM horario_grupo WHERE id_horario_grupo = ?', [idHorario]);
  }
}
