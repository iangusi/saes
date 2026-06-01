import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.schema';
import { LoginResult } from './auth.types';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UnauthorizedError, NotFoundError, AppError } from '../../common/errors/AppError';
import { env } from '../../config/env';

export class AuthService {
  private readonly repo = new AuthRepository();
  private readonly audit = new AuditService();
  private readonly notifications = new NotificationsService();

  async login(dto: LoginDto, ip: string): Promise<LoginResult> {
    const user = await this.repo.findByIdentificador(dto.identificador);

    if (!user || !user.activo) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (user.bloqueado) {
      throw new UnauthorizedError('Cuenta bloqueada. Contacta a control escolar.');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordOk) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const roles = user.roles ? user.roles.split(',') : [];

    const token = jwt.sign(
      { sub: user.id_usuario, roles },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    await this.audit.log({
      idUsuario: user.id_usuario,
      accion: 'login',
      modulo: 'auth',
      descripcion: `Login exitoso: ${user.identificador}`,
      ipOrigen: ip,
    });

    return {
      token,
      user: {
        id: user.id_usuario,
        identificador: user.identificador,
        nombre: user.nombre,
        apellidoPaterno: user.apellido_paterno,
        apellidoMaterno: user.apellido_materno,
        correo: user.correo_contacto,
        roles,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, ip: string): Promise<void> {
    const user = await this.repo.findByCorreo(dto.correo);

    if (!user) {
      // No revelar si el correo existe
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.repo.saveResetToken(user.id_usuario, token, expiry);

    await this.notifications.sendPasswordReset(user.correo_contacto, user.nombre, token);

    await this.audit.log({
      idUsuario: user.id_usuario,
      accion: 'recuperacion_password',
      modulo: 'auth',
      descripcion: `Solicitud de recuperación de contraseña`,
      ipOrigen: ip,
    });
  }

  async resetPassword(dto: ResetPasswordDto, ip: string): Promise<void> {
    const user = await this.repo.findByResetToken(dto.token);

    if (!user) {
      throw new AppError('Token inválido o expirado', 400);
    }

    const hash = await bcrypt.hash(dto.password, 12);
    await this.repo.updatePassword(user.id_usuario, hash);

    await this.audit.log({
      idUsuario: user.id_usuario,
      accion: 'reset_password',
      modulo: 'auth',
      descripcion: `Contraseña restablecida mediante token`,
      ipOrigen: ip,
    });
  }

  async logout(idUsuario: number, ip: string): Promise<void> {
    await this.audit.log({
      idUsuario,
      accion: 'logout',
      modulo: 'auth',
      descripcion: `Cierre de sesión`,
      ipOrigen: ip,
    });
  }
}
