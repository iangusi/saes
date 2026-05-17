import { pool } from '../../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { ListUsersFilters, CreateUserDto } from './admin-users.types';

export interface AdminUserRow extends RowDataPacket {
  id_usuario: number;
  identificador: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo_contacto: string;
  activo: number;
  bloqueado: number;
  roles: string;
}

export class AdminUsersRepository {
  async listUsers(filters: ListUsersFilters): Promise<AdminUserRow[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.search) {
      conditions.push(
        `(u.nombre LIKE ? OR u.apellido_paterno LIKE ? OR u.identificador LIKE ? OR u.correo_contacto LIKE ?)`
      );
      const like = `%${filters.search}%`;
      params.push(like, like, like, like);
    }

    if (filters.rol) {
      conditions.push(`EXISTS (SELECT 1 FROM usuario_rol ur2 JOIN rol r2 ON r2.id_rol = ur2.id_rol WHERE ur2.id_usuario = u.id_usuario AND r2.nombre = ?)`);
      params.push(filters.rol);
    }

    if (filters.estado && filters.estado !== 'todos') {
      if (filters.estado === 'activo') {
        conditions.push(`u.activo = 1 AND u.bloqueado = 0`);
      } else if (filters.estado === 'bloqueado') {
        conditions.push(`u.bloqueado = 1`);
      } else if (filters.estado === 'inactivo') {
        conditions.push(`u.activo = 0 AND u.bloqueado = 0`);
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query<AdminUserRow[]>(
      `SELECT u.id_usuario, u.identificador, u.nombre, u.apellido_paterno,
              u.apellido_materno, u.correo_contacto, u.activo, u.bloqueado,
              GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ',') AS roles
       FROM usuario u
       LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       LEFT JOIN rol r ON r.id_rol = ur.id_rol
       ${where}
       GROUP BY u.id_usuario
       ORDER BY u.nombre, u.apellido_paterno`,
      params
    );
    return rows;
  }

  async findById(idUsuario: number): Promise<AdminUserRow | null> {
    const [rows] = await pool.query<AdminUserRow[]>(
      `SELECT u.id_usuario, u.identificador, u.nombre, u.apellido_paterno,
              u.apellido_materno, u.correo_contacto, u.activo, u.bloqueado,
              GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ',') AS roles
       FROM usuario u
       LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       LEFT JOIN rol r ON r.id_rol = ur.id_rol
       WHERE u.id_usuario = ?
       GROUP BY u.id_usuario`,
      [idUsuario]
    );
    return rows[0] ?? null;
  }

  async identifierExists(identificador: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM usuario WHERE identificador = ?`,
      [identificador]
    );
    return rows.length > 0;
  }

  async emailExists(correo: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM usuario WHERE correo_contacto = ?`,
      [correo]
    );
    return rows.length > 0;
  }

  async getRolIdByName(nombre: string): Promise<number | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id_rol FROM rol WHERE nombre = ?`,
      [nombre]
    );
    return rows[0]?.id_rol ?? null;
  }

  async getPlanes(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id_plan, p.nombre, c.nombre AS nombre_carrera
       FROM plan_estudios p JOIN carrera c ON c.id_carrera = p.id_carrera
       WHERE p.activo = 1 ORDER BY c.nombre, p.nombre`
    );
    return rows;
  }

  async getDepartamentos(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id_departamento, nombre FROM departamento WHERE activo = 1 ORDER BY nombre`
    );
    return rows;
  }

  async createUsuario(
    data: Omit<CreateUserDto, 'rol' | 'id_plan' | 'semestre_actual' | 'id_departamento'> & { password_hash: string }
  ): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO usuario (identificador, nombre, apellido_paterno, apellido_materno, correo_contacto, password_hash, activo)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        data.identificador,
        data.nombre,
        data.apellido_paterno,
        data.apellido_materno ?? null,
        data.correo_contacto,
        data.password_hash,
      ]
    );
    return result.insertId;
  }

  async assignRol(idUsuario: number, idRol: number): Promise<void> {
    await pool.query(
      `INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)`,
      [idUsuario, idRol]
    );
  }

  async createAlumno(idUsuario: number, boleta: string, idPlan: number, semestreActual: number): Promise<void> {
    await pool.query(
      `INSERT INTO alumno (id_usuario, id_plan, boleta, semestre_actual, estatus) VALUES (?, ?, ?, ?, 'activo')`,
      [idUsuario, idPlan, boleta, semestreActual]
    );
  }

  async createProfesor(idUsuario: number, numeroEmpleado: string, idDepartamento: number): Promise<void> {
    await pool.query(
      `INSERT INTO profesor (id_usuario, id_departamento, numero_empleado, estatus) VALUES (?, ?, ?, 'activo')`,
      [idUsuario, idDepartamento, numeroEmpleado]
    );
  }

  async setActivo(idUsuario: number, activo: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE usuario SET activo = ? WHERE id_usuario = ?`,
      [activo, idUsuario]
    );
  }

  async setBloqueado(idUsuario: number, bloqueado: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE usuario SET bloqueado = ? WHERE id_usuario = ?`,
      [bloqueado, idUsuario]
    );
  }

  async activate(idUsuario: number): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE usuario SET activo = 1, bloqueado = 0 WHERE id_usuario = ?`,
      [idUsuario]
    );
  }

  // ─── Student profile (admin view) ───────────────────────────────────────────

  async getStudentByUserId(idUsuario: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.id_alumno, a.id_plan, a.boleta, a.semestre_actual, a.estatus,
              u.nombre, u.apellido_paterno, u.apellido_materno, u.correo_contacto,
              c.nombre AS nombre_carrera, pe.nombre AS nombre_plan,
              pe.total_creditos, pe.total_materias
       FROM alumno a
       JOIN usuario u ON u.id_usuario = a.id_usuario
       JOIN plan_estudios pe ON pe.id_plan = a.id_plan
       JOIN carrera c ON c.id_carrera = pe.id_carrera
       WHERE a.id_usuario = ?`,
      [idUsuario]
    );
    return rows[0] ?? null;
  }

  // ─── Professor profile (admin view) ─────────────────────────────────────────

  async getProfessorByUserId(idUsuario: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id_profesor, p.numero_empleado, p.estatus,
              u.nombre, u.apellido_paterno, u.apellido_materno, u.correo_contacto,
              d.id_departamento, d.nombre AS nombre_departamento
       FROM profesor p
       JOIN usuario u ON u.id_usuario = p.id_usuario
       JOIN departamento d ON d.id_departamento = p.id_departamento
       WHERE p.id_usuario = ?`,
      [idUsuario]
    );
    return rows[0] ?? null;
  }

  async getProfessorGroups(idProfesor: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT g.id_grupo, g.clave_grupo, g.cupo_max, g.cupo_actual, g.estatus,
              m.nombre AS nombre_materia, m.clave AS clave_materia, m.creditos,
              pa.id_periodo, pa.nombre AS nombre_periodo, pa.activo AS periodo_activo,
              GROUP_CONCAT(
                CONCAT(hg.dia_semana, ' ', TIME_FORMAT(hg.hora_inicio, '%H:%i'),
                       '-', TIME_FORMAT(hg.hora_fin, '%H:%i'), ' (', a.nombre, ')')
                ORDER BY FIELD(hg.dia_semana,'lunes','martes','miercoles','jueves','viernes','sabado')
                SEPARATOR ' | '
              ) AS horarios_resumen
       FROM grupo g
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN periodo_academico pa ON pa.id_periodo = g.id_periodo
       LEFT JOIN horario_grupo hg ON hg.id_grupo = g.id_grupo
       LEFT JOIN aula a ON a.id_aula = hg.id_aula
       WHERE g.id_profesor = ?
       GROUP BY g.id_grupo, g.clave_grupo, g.cupo_max, g.cupo_actual, g.estatus,
                m.nombre, m.clave, m.creditos,
                pa.id_periodo, pa.nombre, pa.activo
       ORDER BY pa.activo DESC, pa.fecha_inicio DESC, m.nombre ASC`,
      [idProfesor]
    );
    return rows;
  }

  async getProfessorSchedule(idProfesor: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT g.id_grupo, g.clave_grupo, m.nombre AS nombre_materia,
              hg.dia_semana, TIME_FORMAT(hg.hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(hg.hora_fin, '%H:%i') AS hora_fin,
              a.nombre AS nombre_aula, a.edificio
       FROM grupo g
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN horario_grupo hg ON hg.id_grupo = g.id_grupo
       JOIN aula a ON a.id_aula = hg.id_aula
       JOIN periodo_academico pa ON pa.id_periodo = g.id_periodo AND pa.activo = 1
       WHERE g.id_profesor = ?
       ORDER BY FIELD(hg.dia_semana,'lunes','martes','miercoles','jueves','viernes','sabado'),
                hg.hora_inicio`,
      [idProfesor]
    );
    return rows;
  }

  async getProfessorEvaluations(idProfesor: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT edp.id_pregunta, edp.texto, edp.tipo, edp.orden,
              ROUND(AVG(edr.respuesta_numerica), 2) AS promedio,
              COUNT(CASE WHEN edr.respuesta_numerica IS NOT NULL THEN 1 END) AS total_respuestas,
              GROUP_CONCAT(edr.respuesta_texto SEPARATOR '||') AS comentarios
       FROM encuesta_docente_respuesta edr
       JOIN encuesta_docente_pregunta edp ON edp.id_pregunta = edr.id_pregunta
       JOIN inscripcion i ON i.id_inscripcion = edr.id_inscripcion
       JOIN grupo g ON g.id_grupo = i.id_grupo
       WHERE g.id_profesor = ?
       GROUP BY edp.id_pregunta, edp.texto, edp.tipo, edp.orden
       ORDER BY edp.orden ASC`,
      [idProfesor]
    );
    return rows;
  }
}
