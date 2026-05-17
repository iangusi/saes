import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../../../config/database';
import { DestinatarioPreview, FiltroNotificacion } from './admin-notifications.types';

export class AdminNotificationsRepository {
  async getCatalogs() {
    const [carreras, planes, periodos, grupos, profesores] = await Promise.all([
      this.getCarreras(),
      this.getPlanes(),
      this.getPeriodos(),
      this.getGrupos(),
      this.getProfesores(),
    ]);
    return { carreras, planes, periodos, grupos, profesores };
  }

  private async getCarreras() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id_carrera, nombre, clave FROM carrera WHERE activo = 1 ORDER BY nombre ASC`
    );
    return rows;
  }

  private async getPlanes() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id_plan, p.nombre, c.nombre AS nombre_carrera
       FROM plan_estudios p
       JOIN carrera c ON c.id_carrera = p.id_carrera
       WHERE p.activo = 1
       ORDER BY c.nombre ASC, p.nombre ASC`
    );
    return rows;
  }

  private async getPeriodos() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id_periodo, nombre, activo FROM periodo_academico ORDER BY fecha_inicio DESC`
    );
    return rows;
  }

  private async getGrupos() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT g.id_grupo, g.clave_grupo, g.id_periodo,
              m.nombre AS nombre_materia,
              pa.nombre AS nombre_periodo
       FROM grupo g
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN periodo_academico pa ON pa.id_periodo = g.id_periodo
       WHERE g.estatus != 'cancelado'
       ORDER BY pa.nombre DESC, m.nombre ASC, g.clave_grupo ASC`
    );
    return rows;
  }

  private async getProfesores() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id_profesor, p.numero_empleado,
              CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_completo
       FROM profesor p
       JOIN usuario u ON u.id_usuario = p.id_usuario
       WHERE p.estatus = 'activo' AND u.activo = 1
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`
    );
    return rows;
  }

  async getDestinatarios(filtros: FiltroNotificacion): Promise<DestinatarioPreview[]> {
    switch (filtros.tipo) {
      case 'todos':
        return this.queryTodos();
      case 'rol':
        return this.queryPorRol(filtros.id_rol!);
      case 'carrera':
        return this.queryPorCarrera(filtros.id_carrera!);
      case 'plan':
        return this.queryPorPlan(filtros.id_plan!);
      case 'semestre':
        return this.queryPorSemestre(filtros.semestre!);
      case 'periodo':
        return this.queryPorPeriodo(filtros.id_periodo!);
      case 'grupo':
        return this.queryPorGrupo(filtros.id_grupo!);
      case 'profesor':
        return this.queryPorProfesor(filtros.id_profesor!);
      case 'especificos':
        return this.queryEspecificos(filtros.ids_usuario!);
      default:
        return [];
    }
  }

  private async queryTodos(): Promise<DestinatarioPreview[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.correo_contacto,
              GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ', ') AS roles
       FROM usuario u
       LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       LEFT JOIN rol r ON r.id_rol = ur.id_rol
       WHERE u.activo = 1 AND u.correo_contacto IS NOT NULL AND u.correo_contacto != ''
       GROUP BY u.id_usuario
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`
    );
    return rows as DestinatarioPreview[];
  }

  private async queryPorRol(rol: string): Promise<DestinatarioPreview[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id_usuario, u.nombre, u.apellido_paterno, u.correo_contacto,
              ? AS roles
       FROM usuario u
       JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       JOIN rol r ON r.id_rol = ur.id_rol
       WHERE r.nombre = ? AND u.activo = 1
         AND u.correo_contacto IS NOT NULL AND u.correo_contacto != ''
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`,
      [rol, rol]
    );
    return rows as DestinatarioPreview[];
  }

  private async queryPorCarrera(idCarrera: number): Promise<DestinatarioPreview[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id_usuario, u.nombre, u.apellido_paterno, u.correo_contacto,
              'alumno' AS roles
       FROM usuario u
       JOIN alumno a ON a.id_usuario = u.id_usuario
       JOIN plan_estudios pe ON pe.id_plan = a.id_plan
       WHERE pe.id_carrera = ? AND u.activo = 1 AND a.estatus = 'activo'
         AND u.correo_contacto IS NOT NULL AND u.correo_contacto != ''
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`,
      [idCarrera]
    );
    return rows as DestinatarioPreview[];
  }

  private async queryPorPlan(idPlan: number): Promise<DestinatarioPreview[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id_usuario, u.nombre, u.apellido_paterno, u.correo_contacto,
              'alumno' AS roles
       FROM usuario u
       JOIN alumno a ON a.id_usuario = u.id_usuario
       WHERE a.id_plan = ? AND u.activo = 1 AND a.estatus = 'activo'
         AND u.correo_contacto IS NOT NULL AND u.correo_contacto != ''
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`,
      [idPlan]
    );
    return rows as DestinatarioPreview[];
  }

  private async queryPorSemestre(semestre: number): Promise<DestinatarioPreview[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id_usuario, u.nombre, u.apellido_paterno, u.correo_contacto,
              'alumno' AS roles
       FROM usuario u
       JOIN alumno a ON a.id_usuario = u.id_usuario
       WHERE a.semestre_actual = ? AND u.activo = 1 AND a.estatus = 'activo'
         AND u.correo_contacto IS NOT NULL AND u.correo_contacto != ''
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`,
      [semestre]
    );
    return rows as DestinatarioPreview[];
  }

  private async queryPorPeriodo(idPeriodo: number): Promise<DestinatarioPreview[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id_usuario, u.nombre, u.apellido_paterno, u.correo_contacto,
              'alumno' AS roles
       FROM usuario u
       JOIN alumno a ON a.id_usuario = u.id_usuario
       JOIN inscripcion i ON i.id_alumno = a.id_alumno
       JOIN grupo g ON g.id_grupo = i.id_grupo
       WHERE g.id_periodo = ? AND i.estatus = 'activa' AND u.activo = 1
         AND u.correo_contacto IS NOT NULL AND u.correo_contacto != ''
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`,
      [idPeriodo]
    );
    return rows as DestinatarioPreview[];
  }

  private async queryPorGrupo(idGrupo: number): Promise<DestinatarioPreview[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id_usuario, u.nombre, u.apellido_paterno, u.correo_contacto,
              'alumno' AS roles
       FROM usuario u
       JOIN alumno a ON a.id_usuario = u.id_usuario
       JOIN inscripcion i ON i.id_alumno = a.id_alumno
       WHERE i.id_grupo = ? AND i.estatus = 'activa' AND u.activo = 1
         AND u.correo_contacto IS NOT NULL AND u.correo_contacto != ''
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`,
      [idGrupo]
    );
    return rows as DestinatarioPreview[];
  }

  private async queryPorProfesor(idProfesor: number): Promise<DestinatarioPreview[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.id_usuario, u.nombre, u.apellido_paterno, u.correo_contacto,
              'alumno' AS roles
       FROM usuario u
       JOIN alumno a ON a.id_usuario = u.id_usuario
       JOIN inscripcion i ON i.id_alumno = a.id_alumno
       JOIN grupo g ON g.id_grupo = i.id_grupo
       WHERE g.id_profesor = ? AND i.estatus = 'activa' AND u.activo = 1
         AND u.correo_contacto IS NOT NULL AND u.correo_contacto != ''
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`,
      [idProfesor]
    );
    return rows as DestinatarioPreview[];
  }

  private async queryEspecificos(ids: number[]): Promise<DestinatarioPreview[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.correo_contacto,
              GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ', ') AS roles
       FROM usuario u
       LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       LEFT JOIN rol r ON r.id_rol = ur.id_rol
       WHERE u.id_usuario IN (${placeholders}) AND u.activo = 1
         AND u.correo_contacto IS NOT NULL AND u.correo_contacto != ''
       GROUP BY u.id_usuario
       ORDER BY u.apellido_paterno ASC, u.nombre ASC`,
      ids
    );
    return rows as DestinatarioPreview[];
  }
}
