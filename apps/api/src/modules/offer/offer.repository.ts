import { pool } from '../../config/database';
import { RowDataPacket } from 'mysql2/promise';

export interface OfferRow extends RowDataPacket {
  id_grupo: number;
  clave_grupo: string;
  id_materia: number;
  clave_materia: string;
  nombre_materia: string;
  creditos: number;
  cupo_max: number;
  cupo_actual: number;
  cupo_disponible: number;
  estatus_grupo: string;
  nombre_profesor: string;
  apellido_paterno_profesor: string;
  horarios: string;
}

export class OfferRepository {
  async getOffer(idPeriodo?: number): Promise<OfferRow[]> {
    const params: unknown[] = [];
    let periodoCondition = 'pa.activo = 1';

    if (idPeriodo) {
      periodoCondition = 'g.id_periodo = ?';
      params.push(idPeriodo);
    }

    params.push(params.length > 0 ? idPeriodo ?? null : null);

    const [rows] = await pool.query<OfferRow[]>(
      `SELECT g.id_grupo, g.clave_grupo, m.id_materia, m.clave AS clave_materia,
              m.nombre AS nombre_materia, m.creditos, g.cupo_max, g.cupo_actual,
              (g.cupo_max - g.cupo_actual) AS cupo_disponible, g.estatus AS estatus_grupo,
              u.nombre AS nombre_profesor, u.apellido_paterno AS apellido_paterno_profesor,
              GROUP_CONCAT(
                CONCAT(hg.dia_semana,'|',TIME_FORMAT(hg.hora_inicio,'%H:%i'),'|',
                       TIME_FORMAT(hg.hora_fin,'%H:%i'),'|',a.nombre)
                ORDER BY hg.dia_semana SEPARATOR ';'
              ) AS horarios
       FROM grupo g
       JOIN materia m ON m.id_materia = g.id_materia
       JOIN profesor p ON p.id_profesor = g.id_profesor
       JOIN usuario u ON u.id_usuario = p.id_usuario
       JOIN periodo_academico pa ON pa.id_periodo = g.id_periodo
       LEFT JOIN horario_grupo hg ON hg.id_grupo = g.id_grupo
       LEFT JOIN aula a ON a.id_aula = hg.id_aula
       WHERE ${periodoCondition}
         AND g.estatus != 'cancelado'
       GROUP BY g.id_grupo
       ORDER BY m.nombre ASC, g.clave_grupo ASC`,
      idPeriodo ? [idPeriodo] : []
    );
    return rows;
  }
}
