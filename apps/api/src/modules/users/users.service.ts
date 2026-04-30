import bcrypt from 'bcryptjs';
import { UsersRepository } from './users.repository';
import { UpdateEmailDto, UpdatePasswordDto } from './users.schema';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, ConflictError, UnauthorizedError } from '../../common/errors/AppError';

export class UsersService {
  private readonly repo = new UsersRepository();
  private readonly audit = new AuditService();

  async getMe(idUsuario: number) {
    const user = await this.repo.findById(idUsuario);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    return {
      id: user.id_usuario,
      identificador: user.identificador,
      nombre: user.nombre,
      apellidoPaterno: user.apellido_paterno,
      apellidoMaterno: user.apellido_materno,
      correo: user.correo_contacto,
      roles: user.roles ? user.roles.split(',') : [],
    };
  }

  async updateEmail(idUsuario: number, dto: UpdateEmailDto, ip: string): Promise<void> {
    const exists = await this.repo.emailExists(dto.correo, idUsuario);
    if (exists) throw new ConflictError('El correo ya está en uso');

    await this.repo.updateEmail(idUsuario, dto.correo);

    await this.audit.log({
      idUsuario,
      accion: 'cambio_correo',
      modulo: 'users',
      descripcion: `Correo actualizado a: ${dto.correo}`,
      ipOrigen: ip,
    });
  }

  async updatePassword(idUsuario: number, dto: UpdatePasswordDto, ip: string): Promise<void> {
    const user = await this.repo.findById(idUsuario);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    const passwordOk = await bcrypt.compare(dto.passwordActual, user.password_hash);
    if (!passwordOk) throw new UnauthorizedError('Contraseña actual incorrecta');

    const hash = await bcrypt.hash(dto.passwordNueva, 12);
    await this.repo.updatePasswordHash(idUsuario, hash);

    await this.audit.log({
      idUsuario,
      accion: 'cambio_password',
      modulo: 'users',
      descripcion: 'Contraseña actualizada',
      ipOrigen: ip,
    });
  }
}
