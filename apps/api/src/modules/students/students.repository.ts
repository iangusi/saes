import { pool } from '../../config/database';
import { RowDataPacket } from 'mysql2/promise';

export interface StudentProfileRow extends RowDataPacket {
  id_alumno: number;
  id_plan: number;
  boleta: string;
  semestre_actual: number;
  estatus: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo_contacto: string;
  nombre_carrera: string;
  nombre_plan: string;
  total_creditos: number;
  total_materias: number;
}

export interface KardexRow extends RowDataPacket {
  id_materia: number;
  clave_materia: string;
  nombre_materia: string;
  creditos: number;
  semestre_plan: number;
  nombre_periodo: string;
  calificacion_final: number | null;
  tipo_acreditacion: string;
  resultado: string;
}

export interface ScheduleRow extends RowDataPacket {
  id_grupo: number;
  clave_grupo: string;
  nombre_materia: string;
  nombre_profesor: string;
  apellido_paterno_profesor: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  nombre_aula: string;
  edificio: string | null;
}

export interface GradeRow extends RowDataPacket {
  id_materia: number;
  nombre_materia: string;
  clave_grupo: string;
  nombre_profesor: string;
  apellido_paterno_profesor: string;
  tipo_evaluacion: string;
  calificacion: number | null;
  cerrada: number;
}

export class StudentsRepository {
  async findByUserId(idUsuario: number): Promise<StudentProfileRow | null> {
    const [rows] = await pool.query<StudentProfileRow[]>(
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

  async getKardex(idAlumno: number): Promise<KardexRow[]> {
    const [rows] = await pool.query<KardexRow[]>(
      `SELECT m.id_materia, m.clave AS clave_materia, m.nombre AS nombre_materia,
              m.creditos, pm.semestre AS semestre_plan, pa.nombre AS nombre_periodo,
              ha.calificacion_final, ha.tipo_acreditacion, ha.resultado
       FROM historial_academico ha
       JOIN materia m ON m.id_materia = ha.id_materia
       JOIN plan_materia pm ON pm.id_materia = ha.id_materia
       JOIN alumno a ON a.id_alumno = ha.id_alumno AND a.id_plan = pm.id_plan
       JOIN periodo_academico pa ON pa.id_periodo = ha.id_periodo
       WHERE ha.id_alumno = ?
       ORDER BY pm.semestre ASC, m.nombre ASC`,
      [idAlumno]
    );
    return rows;
  }

  async getSchedule(idAlumno: number): Promise<ScheduleRow[]> {
    const [rows] = await pool.query<ScheduleRow[]>(
      `SELECT g.id_grupo, g.clave_grupo, m.nombre AS nombre_materia,
              u.nombre AS nombre_profesor, u.apellido_paterno AS apellido_paterno_profesor,
              hg.dia_semana, TIME_FORMAT(hg.hora_inicio, '%H:%i') AS hora_inicio,
              TIME_FORMAT(hg.hora_fin, '%H:%i') AS hora_fin,
              a.nombre AS nombre_aula, a.edificio
       FROM inscripcion i
       JOIN grupo g ON g.id_grupo = i.id_grupo
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN profesor p ON p.id_profesor = g.id_profesor
       JOIN usuario u ON u.id_usuario = p.id_usuario
       JOIN horario_grupo hg ON hg.id_grupo = g.id_grupo
       JOIN aula a ON a.id_aula = hg.id_aula
       JOIN periodo_academico pa ON pa.id_periodo = g.id_periodo AND pa.activo = 1
       WHERE i.id_alumno = ? AND i.estatus = 'activa'
       ORDER BY FIELD(hg.dia_semana,'lunes','martes','miercoles','jueves','viernes','sabado'),
                hg.hora_inicio`,
      [idAlumno]
    );
    return rows;
  }

  async getGrades(idAlumno: number): Promise<GradeRow[]> {
    const [rows] = await pool.query<GradeRow[]>(
      `SELECT m.id_materia, m.nombre AS nombre_materia, g.clave_grupo,
              u.nombre AS nombre_profesor, u.apellido_paterno AS apellido_paterno_profesor,
              te.nombre AS tipo_evaluacion, cal.calificacion, ge.cerrada
       FROM inscripcion i
       JOIN grupo g ON g.id_grupo = i.id_grupo
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN profesor p ON p.id_profesor = g.id_profesor
       JOIN usuario u ON u.id_usuario = p.id_usuario
       JOIN periodo_academico pa ON pa.id_periodo = g.id_periodo AND pa.activo = 1
       LEFT JOIN grupo_evaluacion ge ON ge.id_grupo = g.id_grupo
       LEFT JOIN tipo_evaluacion te ON te.id_tipo_evaluacion = ge.id_tipo_evaluacion
       LEFT JOIN calificacion cal ON cal.id_inscripcion = i.id_inscripcion
                                 AND cal.id_grupo_evaluacion = ge.id_grupo_evaluacion
       WHERE i.id_alumno = ? AND i.estatus = 'activa'
       ORDER BY m.nombre ASC, te.nombre ASC`,
      [idAlumno]
    );
    return rows;
  }

  async getKardexStats(idAlumno: number): Promise<{ promedio: number; aprobadas: number }> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         ROUND(AVG(CASE WHEN ha.resultado = 'aprobado' THEN ha.calificacion_final END), 2) AS promedio,
         COUNT(CASE WHEN ha.resultado = 'aprobado' THEN 1 END) AS aprobadas
       FROM historial_academico ha
       WHERE ha.id_alumno = ?`,
      [idAlumno]
    );
    return {
      promedio: rows[0]?.promedio ?? 0,
      aprobadas: rows[0]?.aprobadas ?? 0,
    };
  }

  async getKardexByPeriod(idAlumno: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pa.nombre AS periodo, pa.fecha_inicio,
              ROUND(AVG(ha.calificacion_final), 2) AS promedio_periodo,
              COUNT(*) AS total_materias,
              SUM(CASE WHEN ha.resultado = 'aprobado' THEN 1 ELSE 0 END) AS aprobadas
       FROM historial_academico ha
       JOIN periodo_academico pa ON pa.id_periodo = ha.id_periodo
       WHERE ha.id_alumno = ?
       GROUP BY ha.id_periodo, pa.nombre, pa.fecha_inicio
       ORDER BY pa.fecha_inicio ASC`,
      [idAlumno]
    );
    return rows;
  }
}
