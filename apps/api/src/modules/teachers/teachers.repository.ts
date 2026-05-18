import { query } from '../../config/database';
import { pool } from '../../config/database';
import {
  TeacherProfile,
  TeacherGroup,
  TeacherSchedule,
  StudentFromGroup,
  GradeRecord,
} from './teachers.types';

export class TeachersRepository {
  async getProfile(idUsuario: number): Promise<TeacherProfile> {
    const sql = `
      SELECT
        p.id_profesor as idProfesor,
        p.numero_empleado as numeroEmpleado,
        u.nombre,
        u.apellido_paterno as apellidoPaterno,
        u.apellido_materno as apellidoMaterno,
        u.correo_contacto as correo,
        d.nombre as departamento,
        p.estatus
      FROM profesor p
      JOIN usuario u ON p.id_usuario = u.id_usuario
      JOIN departamento d ON p.id_departamento = d.id_departamento
      WHERE p.id_usuario = ?
    `;
    const rows = await query(sql, [idUsuario]);
    return (rows as TeacherProfile[])[0];
  }

  async getTeacherGroups(idProfesor: number, periodoId?: number): Promise<TeacherGroup[]> {
    const sql = `
      SELECT
        g.id_grupo as idGrupo,
        g.clave_grupo as claveGrupo,
        m.nombre as nombreMateria,
        m.creditos as creditosMateria,
        g.cupo_max as cupoMax,
        g.cupo_actual as cupoActual,
        g.estatus,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'dia', hg.dia_semana,
            'horaInicio', TIME_FORMAT(hg.hora_inicio, '%H:%i'),
            'horaFin', TIME_FORMAT(hg.hora_fin, '%H:%i'),
            'nombreAula', a.nombre,
            'edificio', a.edificio
          )
        ) as horarios
      FROM grupo g
      JOIN materia m ON g.id_materia = m.id_materia
      LEFT JOIN horario_grupo hg ON g.id_grupo = hg.id_grupo
      LEFT JOIN aula a ON hg.id_aula = a.id_aula
      WHERE g.id_profesor = ? AND g.estatus != 'cancelado'
        ${periodoId ? 'AND g.id_periodo = ?' : 'AND (SELECT activo FROM periodo_academico WHERE id_periodo = g.id_periodo) = 1'}
      GROUP BY g.id_grupo
      ORDER BY m.nombre ASC
    `;
    const params: any[] = [idProfesor];
    if (periodoId) params.push(periodoId);

    const rows = await query(sql, params);
    return (rows as any[]).map((row) => ({
      ...row,
      horarios: row.horarios || [],
    }));
  }

  async getProfesorIdByUsuarioId(idUsuario: number): Promise<number | null> {
  const rows = await query('SELECT id_profesor FROM profesor WHERE id_usuario = ?', [idUsuario]);
  return (rows as any[])[0]?.id_profesor || null;
}

  async getTeacherSchedule(idProfesor: number): Promise<TeacherSchedule> {
    const grupos = await this.getTeacherGroups(idProfesor);

    const sql = `
      SELECT
        g.id_grupo as idGrupo,
        g.clave_grupo as claveGrupo,
        m.nombre as nombreMateria,
        hg.dia_semana as diaGrupo,
        TIME_FORMAT(hg.hora_inicio, '%H:%i') as horaInicio,
        TIME_FORMAT(hg.hora_fin, '%H:%i') as horaFin,
        a.nombre as nombreAula,
        a.edificio
      FROM grupo g
      JOIN materia m ON g.id_materia = m.id_materia
      JOIN horario_grupo hg ON g.id_grupo = hg.id_grupo
      JOIN aula a ON hg.id_aula = a.id_aula
      WHERE g.id_profesor = ? AND g.estatus != 'cancelado'
        AND (SELECT activo FROM periodo_academico WHERE id_periodo = g.id_periodo) = 1
      ORDER BY 
        FIELD(hg.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'),
        hg.hora_inicio ASC
    `;
    const rows = await query(sql, [idProfesor]);

    return {
      grupos,
      horarios: rows as any[],
    };
  }

  async getGroupStudents(idGrupo: number): Promise<StudentFromGroup[]> {
    const sql = `
      SELECT
        a.id_alumno as idAlumno,
        a.boleta,
        u.nombre,
        u.apellido_paterno as apellidoPaterno,
        u.apellido_materno as apellidoMaterno,
        u.correo_contacto as correo
      FROM inscripcion i
      JOIN alumno a ON i.id_alumno = a.id_alumno
      JOIN usuario u ON a.id_usuario = u.id_usuario
      WHERE i.id_grupo = ? AND i.estatus = 'activa'
      ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre ASC
    `;
    const rows = await query(sql, [idGrupo]);
    return rows as StudentFromGroup[];
  }

  async getGroupEvaluations(idGrupo: number): Promise<any[]> {
    const sql = `
      SELECT
        ge.id_grupo_evaluacion as idGrupoEvaluacion,
        te.id_tipo_evaluacion as idTipoEvaluacion,
        te.nombre as nombreTipo,
        te.ponderacion,
        DATE_FORMAT(ge.fecha_apertura, '%Y-%m-%d %H:%i') as fechaApertura,
        DATE_FORMAT(ge.fecha_cierre, '%Y-%m-%d %H:%i') as fechaCierre,
        ge.cerrada
      FROM grupo_evaluacion ge
      JOIN tipo_evaluacion te ON ge.id_tipo_evaluacion = te.id_tipo_evaluacion
      WHERE ge.id_grupo = ?
      ORDER BY te.id_tipo_evaluacion ASC
    `;
    const rows = await query(sql, [idGrupo]);
    return rows as any[];
  }

  async getGroupGrades(idGrupo: number): Promise<GradeRecord[]> {
    const sql = `
      SELECT
        a.id_alumno as idAlumno,
        a.boleta,
        u.nombre,
        u.apellido_paterno as apellidoPaterno,
        u.apellido_materno as apellidoMaterno,
        te.nombre as tipoEvaluacion,
        c.calificacion,
        ge.cerrada,
        DATE_FORMAT(c.fecha_captura, '%Y-%m-%d %H:%i') as fechaCaptura
      FROM inscripcion i
      JOIN alumno a ON i.id_alumno = a.id_alumno
      JOIN usuario u ON a.id_usuario = u.id_usuario
      JOIN grupo_evaluacion ge ON i.id_grupo = ge.id_grupo
      JOIN tipo_evaluacion te ON ge.id_tipo_evaluacion = te.id_tipo_evaluacion
      LEFT JOIN calificacion c ON i.id_inscripcion = c.id_inscripcion
        AND c.id_grupo_evaluacion = ge.id_grupo_evaluacion
      WHERE i.id_grupo = ? AND i.estatus = 'activa'
      ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre, te.id_tipo_evaluacion ASC
    `;
    const rows = await query(sql, [idGrupo]);
    return rows as GradeRecord[];
  }

  async recordAttendance(idGrupo: number, fecha: string, asistencias: any[], idUsuario: number): Promise<void> {
  const inscripcionSql = `SELECT id_inscripcion, id_alumno FROM inscripcion WHERE id_grupo = ?`;
  const inscripciones = await query(inscripcionSql, [idGrupo]) as any[];

  const values = asistencias.map((asist) => {
    const inscripcion = inscripciones.find(i => i.id_alumno === asist.idAlumno);
    if (!inscripcion) throw new Error(`Alumno ${asist.idAlumno} no inscrito`);
    return [
      inscripcion.id_inscripcion,
      idGrupo,
      fecha,
      asist.presente ? 1 : 0,
      asist.justificada ? 1 : 0,
      idUsuario  // ← registrada_por
    ];
  });

  const sql = `
    INSERT INTO asistencia (id_inscripcion, id_grupo, fecha, presente, justificada, registrada_por)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      presente = VALUES(presente),
      justificada = VALUES(justificada),
      updated_at = CURRENT_TIMESTAMP
  `;
  await pool.query(sql, [values]);
}

  async updateGrade(idInscripcion: number, idGrupoEvaluacion: number, calificacion: number): Promise<void> {
    const sql = `
      INSERT INTO calificacion (id_inscripcion, id_grupo_evaluacion, calificacion, capturada_por, fecha_captura)
      VALUES (?, ?, ?, (SELECT id_usuario FROM profesor WHERE id_profesor = ?), CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        calificacion = ?,
        updated_at = CURRENT_TIMESTAMP
    `;
    await query(sql, [idInscripcion, idGrupoEvaluacion, calificacion, 1, calificacion]);
  }

  async createAnnouncement(
  idGrupo: number,
  idUsuario: number,      // ← nuevo parámetro
  titulo: string,
  contenido: string
): Promise<number> {
  const sql = `
    INSERT INTO anuncio (id_grupo, titulo, contenido, enviado_por, fecha_creacion)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  const result = await query(sql, [idGrupo, titulo, contenido, idUsuario]);
  return (result as any).insertId;
}

  async getGroupAnnouncements(idGrupo: number): Promise<any[]> {
    const sql = `
      SELECT
        id_anuncio as idAnuncio,
        id_grupo as idGrupo,
        titulo,
        contenido,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d %H:%i') as fechaCreacion
      FROM anuncio
      WHERE id_grupo = ?
      ORDER BY fecha_creacion DESC
      LIMIT 20
    `;
    const rows = await query(sql, [idGrupo]);
    return rows as any[];
  }

  async getGroupAttendanceHistory(idGrupo: number, fecha?: string): Promise<any[]> {
    let sql = `
      SELECT
        a.id_asistencia as idAsistencia,
        ast.id_alumno as idAlumno,
        ast.boleta,
        u.nombre,
        u.apellido_paterno as apellidoPaterno,
        u.apellido_materno as apellidoMaterno,
        a.fecha,
        a.presente,
        a.justificada,
        ur.nombre as registradoPor
      FROM asistencia a
      JOIN inscripcion i ON a.id_inscripcion = i.id_inscripcion
      JOIN alumno ast ON i.id_alumno = ast.id_alumno
      JOIN usuario u ON ast.id_usuario = u.id_usuario
      JOIN usuario ur ON a.registrada_por = ur.id_usuario
      WHERE a.id_grupo = ?
    `;
    
    const params: any[] = [idGrupo];
    
    if (fecha) {
      sql += ` AND DATE(a.fecha) = ?`;
      params.push(fecha);
    }
    
    sql += ` ORDER BY a.fecha DESC, u.apellido_paterno, u.apellido_materno, u.nombre ASC`;
    
    const rows = await query(sql, params);
    return rows as any[];
  }
}
