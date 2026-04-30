import { pool } from '../../config/database';
import { RowDataPacket } from 'mysql2/promise';

export interface PreguntaRow extends RowDataPacket {
  id_pregunta: number;
  texto: string;
  tipo: string;
  orden: number;
}

export interface InscripcionGrupoRow extends RowDataPacket {
  id_inscripcion: number;
  id_grupo: number;
  nombre_materia: string;
  clave_grupo: string;
  nombre_profesor: string;
  apellido_paterno_profesor: string;
  ya_evaluado: number;
}

export class TeachingEvaluationRepository {
  async getActiveWindow(): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pp.id_periodo_proceso, pp.fecha_inicio, pp.fecha_fin, pp.activo,
              ed.id_encuesta
       FROM periodo_proceso pp
       JOIN proceso_academico pa ON pa.id_proceso = pp.id_proceso
       JOIN periodo_academico per ON per.id_periodo = pp.id_periodo AND per.activo = 1
       JOIN encuesta_docente ed ON ed.id_periodo_proceso = pp.id_periodo_proceso AND ed.activo = 1
       WHERE pa.nombre = 'evaluacion_docente'`,
      []
    );
    return rows[0] ?? null;
  }

  async getInscripcionesAlumno(idAlumno: number, idEncuesta: number): Promise<InscripcionGrupoRow[]> {
    const [rows] = await pool.query<InscripcionGrupoRow[]>(
      `SELECT i.id_inscripcion, g.id_grupo, m.nombre AS nombre_materia,
              g.clave_grupo, u.nombre AS nombre_profesor,
              u.apellido_paterno AS apellido_paterno_profesor,
              (SELECT COUNT(*) FROM encuesta_docente_respuesta edr
               JOIN encuesta_docente_pregunta edp ON edp.id_pregunta = edr.id_pregunta
               WHERE edp.id_encuesta = ? AND edr.id_inscripcion = i.id_inscripcion
               LIMIT 1) AS ya_evaluado
       FROM inscripcion i
       JOIN grupo g ON g.id_grupo = i.id_grupo
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN profesor p ON p.id_profesor = g.id_profesor
       JOIN usuario u ON u.id_usuario = p.id_usuario
       JOIN periodo_academico pa ON pa.id_periodo = g.id_periodo AND pa.activo = 1
       WHERE i.id_alumno = ? AND i.estatus = 'activa'`,
      [idEncuesta, idAlumno]
    );
    return rows;
  }

  async getPreguntas(idEncuesta: number): Promise<PreguntaRow[]> {
    const [rows] = await pool.query<PreguntaRow[]>(
      `SELECT id_pregunta, texto, tipo, orden
       FROM encuesta_docente_pregunta
       WHERE id_encuesta = ?
       ORDER BY orden ASC`,
      [idEncuesta]
    );
    return rows;
  }

  async hasAlreadyEvaluated(idInscripcion: number, idEncuesta: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt
       FROM encuesta_docente_respuesta edr
       JOIN encuesta_docente_pregunta edp ON edp.id_pregunta = edr.id_pregunta
       WHERE edp.id_encuesta = ? AND edr.id_inscripcion = ?`,
      [idEncuesta, idInscripcion]
    );
    return rows[0].cnt > 0;
  }

  async saveRespuestas(
    respuestas: Array<{
      idPregunta: number;
      idInscripcion: number;
      respuestaNumerica?: number;
      respuestaTexto?: string;
    }>
  ): Promise<void> {
    const values = respuestas.map((r) => [
      r.idPregunta,
      r.idInscripcion,
      r.respuestaNumerica ?? null,
      r.respuestaTexto ?? null,
    ]);

    await pool.query(
      `INSERT INTO encuesta_docente_respuesta
         (id_pregunta, id_inscripcion, respuesta_numerica, respuesta_texto)
       VALUES ?`,
      [values]
    );
  }
}
