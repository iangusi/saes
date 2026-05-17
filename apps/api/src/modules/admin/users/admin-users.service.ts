import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { AdminUsersRepository } from './admin-users.repository';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuditService } from '../../audit/audit.service';
import { ConflictError, NotFoundError, ValidationError } from '../../../common/errors/AppError';
import { CreateUserDto, ListUsersFilters, ImportResult } from './admin-users.types';
import { createUserSchema } from './admin-users.schema';
// AdminUserRow is defined in repository and returned by repo methods

export class AdminUsersService {
  private readonly repo = new AdminUsersRepository();
  private readonly notif = new NotificationsService();
  private readonly audit = new AuditService();

  async listUsers(filters: ListUsersFilters) {
    return this.repo.listUsers(filters);
  }

  async getPlanes() {
    return this.repo.getPlanes();
  }

  async getDepartamentos() {
    return this.repo.getDepartamentos();
  }

  async createUser(dto: CreateUserDto, idAdmin: number, ip: string) {
    if (await this.repo.identifierExists(dto.identificador)) {
      throw new ConflictError(`El identificador '${dto.identificador}' ya está en uso`);
    }
    if (await this.repo.emailExists(dto.correo_contacto)) {
      throw new ConflictError(`El correo '${dto.correo_contacto}' ya está en uso`);
    }

    const rolId = await this.repo.getRolIdByName(dto.rol);
    if (!rolId) throw new ValidationError(`Rol '${dto.rol}' no encontrado`);

    const password = generatePassword();
    const hash = await bcrypt.hash(password, 12);

    const idUsuario = await this.repo.createUsuario({
      identificador: dto.identificador,
      nombre: dto.nombre,
      apellido_paterno: dto.apellido_paterno,
      apellido_materno: dto.apellido_materno,
      correo_contacto: dto.correo_contacto,
      password_hash: hash,
    });

    await this.repo.assignRol(idUsuario, rolId);

    if (dto.rol === 'alumno') {
      await this.repo.createAlumno(idUsuario, dto.identificador, dto.id_plan!, dto.semestre_actual!);
    } else if (dto.rol === 'profesor') {
      await this.repo.createProfesor(idUsuario, dto.identificador, dto.id_departamento!);
    }

    await this.audit.log({
      idUsuario: idAdmin,
      accion: 'CREAR_USUARIO',
      modulo: 'admin/users',
      descripcion: `Usuario creado: ${dto.identificador} (${dto.rol})`,
      ipOrigen: ip,
      metadata: { idUsuario, rol: dto.rol, identificador: dto.identificador },
    });

    this.notif
      .sendWelcomeWithPassword(dto.correo_contacto, dto.nombre, dto.identificador, password)
      .catch(() => {});

    return this.repo.findById(idUsuario);
  }

  async importUsersFromExcel(buffer: Buffer, idAdmin: number, ip: string): Promise<ImportResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    let creados = 0;
    const errores: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      try {
        const raw = rows[i];
        const dto: CreateUserDto = {
          rol: String(raw['rol'] ?? '').trim().toLowerCase() as CreateUserDto['rol'],
          identificador: String(raw['identificador'] ?? '').trim(),
          nombre: String(raw['nombre'] ?? '').trim(),
          apellido_paterno: String(raw['apellido_paterno'] ?? '').trim(),
          apellido_materno: raw['apellido_materno'] ? String(raw['apellido_materno']).trim() : undefined,
          correo_contacto: String(raw['correo_contacto'] ?? '').trim(),
          id_plan: raw['id_plan'] ? Number(raw['id_plan']) : undefined,
          semestre_actual: raw['semestre_actual'] ? Number(raw['semestre_actual']) : undefined,
          id_departamento: raw['id_departamento'] ? Number(raw['id_departamento']) : undefined,
        };

        const parsed = createUserSchema.safeParse(dto);
        if (!parsed.success) {
          errores.push(`Fila ${rowNum}: ${parsed.error.errors.map(e => e.message).join(', ')}`);
          continue;
        }

        await this.createUser(parsed.data, idAdmin, ip);
        creados++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        errores.push(`Fila ${rowNum}: ${msg}`);
      }
    }

    return { creados, errores };
  }

  async deactivateUser(idUsuario: number, idAdmin: number, ip: string) {
    const user = await this.repo.findById(idUsuario);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    await this.repo.setActivo(idUsuario, 0);

    await this.audit.log({
      idUsuario: idAdmin,
      accion: 'BAJA_USUARIO',
      modulo: 'admin/users',
      descripcion: `Usuario dado de baja: ${user.identificador}`,
      ipOrigen: ip,
      metadata: { idUsuario },
    });
  }

  async blockUser(idUsuario: number, idAdmin: number, ip: string) {
    const user = await this.repo.findById(idUsuario);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    await this.repo.setBloqueado(idUsuario, 1);

    await this.audit.log({
      idUsuario: idAdmin,
      accion: 'BLOQUEAR_USUARIO',
      modulo: 'admin/users',
      descripcion: `Usuario bloqueado: ${user.identificador}`,
      ipOrigen: ip,
      metadata: { idUsuario },
    });
  }

  async activateUser(idUsuario: number, idAdmin: number, ip: string) {
    const user = await this.repo.findById(idUsuario);
    if (!user) throw new NotFoundError('Usuario no encontrado');

    await this.repo.activate(idUsuario);

    await this.audit.log({
      idUsuario: idAdmin,
      accion: 'REACTIVAR_USUARIO',
      modulo: 'admin/users',
      descripcion: `Usuario reactivado: ${user.identificador}`,
      ipOrigen: ip,
      metadata: { idUsuario },
    });
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}
