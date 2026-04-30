import { pool } from '../../config/database';
import { RowDataPacket } from 'mysql2/promise';

export interface UserRow extends RowDataPacket {
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

export class AuthRepository {
  async findByIdentificador(identificador: string): Promise<UserRow | null> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT u.id_usuario, u.identificador, u.nombre, u.apellido_paterno,
              u.apellido_materno, u.correo_contacto, u.password_hash, u.activo,
              GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ',') AS roles
       FROM usuario u
       LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       LEFT JOIN rol r ON r.id_rol = ur.id_rol
       WHERE u.identificador = ?
       GROUP BY u.id_usuario`,
      [identificador]
    );
    return rows[0] ?? null;
  }

  async findByCorreo(correo: string): Promise<UserRow | null> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT u.id_usuario, u.identificador, u.nombre, u.apellido_paterno,
              u.apellido_materno, u.correo_contacto, u.password_hash, u.activo,
              GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ',') AS roles
       FROM usuario u
       LEFT JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       LEFT JOIN rol r ON r.id_rol = ur.id_rol
       WHERE u.correo_contacto = ?
       GROUP BY u.id_usuario`,
      [correo]
    );
    return rows[0] ?? null;
  }

  async saveResetToken(idUsuario: number, token: string, expiry: Date): Promise<void> {
    await pool.query(
      `UPDATE usuario SET reset_token = ?, reset_token_exp = ? WHERE id_usuario = ?`,
      [token, expiry, idUsuario]
    );
  }

  async findByResetToken(token: string): Promise<UserRow | null> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT u.id_usuario, u.identificador, u.nombre, u.apellido_paterno,
              u.apellido_materno, u.correo_contacto, u.password_hash, u.activo,
              '' AS roles
       FROM usuario u
       WHERE u.reset_token = ? AND u.reset_token_exp > NOW()`,
      [token]
    );
    return rows[0] ?? null;
  }

  async updatePassword(idUsuario: number, passwordHash: string): Promise<void> {
    await pool.query(
      `UPDATE usuario
       SET password_hash = ?, reset_token = NULL, reset_token_exp = NULL
       WHERE id_usuario = ?`,
      [passwordHash, idUsuario]
    );
  }
}
