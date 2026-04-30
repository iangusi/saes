import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface UserDetailRow extends RowDataPacket {
  id_usuario: number;
  identificador: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  correo_contacto: string;
  password_hash: string;
  activo: number;
  roles: string;
}

export class UsersRepository {
  async findById(idUsuario: number): Promise<UserDetailRow | null> {
    const [rows] = await pool.query<UserDetailRow[]>(
      `SELECT u.id_usuario, u.identificador, u.nombre, u.apellido_paterno,
              u.apellido_materno, u.correo_contacto, u.password_hash, u.activo,
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

  async emailExists(correo: string, excludeId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM usuario WHERE correo_contacto = ? AND id_usuario != ?`,
      [correo, excludeId]
    );
    return rows.length > 0;
  }

  async updateEmail(idUsuario: number, correo: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE usuario SET correo_contacto = ? WHERE id_usuario = ?`,
      [correo, idUsuario]
    );
  }

  async updatePasswordHash(idUsuario: number, hash: string): Promise<void> {
    await pool.query<ResultSetHeader>(
      `UPDATE usuario SET password_hash = ? WHERE id_usuario = ?`,
      [hash, idUsuario]
    );
  }
}
