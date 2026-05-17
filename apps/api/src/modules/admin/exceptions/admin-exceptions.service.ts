import { AdminExceptionsRepository, ExceptionGroupRow } from './admin-exceptions.repository';
import { AdminUsersRepository } from '../users/admin-users.repository';
import { AuditService } from '../../audit/audit.service';
import { NotFoundError, AppError } from '../../../common/errors/AppError';
import { SubmitExceptionDto } from './admin-exceptions.schema';

export interface ExceptionEligibilityResult {
  alumno: {
    id_alumno: number;
    id_usuario: number;
    boleta: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    semestre_actual: number;
    nombre_plan: string;
    nombre_carrera: string;
  };
  grupos: ExceptionGroupRow[];
  creditosInscritos: number;
  idPeriodo: number;
}

export class AdminExceptionsService {
  private readonly repo = new AdminExceptionsRepository();
  private readonly usersRepo = new AdminUsersRepository();
  private readonly audit = new AuditService();

  async getEligibility(idUsuario: number): Promise<ExceptionEligibilityResult> {
    const alumnoRow = await this.usersRepo.getStudentByUserId(idUsuario);
    if (!alumnoRow) throw new NotFoundError('Alumno no encontrado');

    const periodo = await this.repo.getActivePeriodo();
    if (!periodo) throw new NotFoundError('No hay periodo académico activo');

    const grupos = await this.repo.getAllGroupsForException(
      alumnoRow.id_alumno,
      periodo.id_periodo,
      alumnoRow.id_plan
    );

    const inscritos = await this.repo.getInscritos(alumnoRow.id_alumno, periodo.id_periodo);
    const creditosInscritos = inscritos.reduce((sum, r) => sum + Number(r.creditos), 0);

    return {
      alumno: {
        id_alumno: alumnoRow.id_alumno,
        id_usuario: idUsuario,
        boleta: alumnoRow.boleta,
        nombre: alumnoRow.nombre,
        apellido_paterno: alumnoRow.apellido_paterno,
        apellido_materno: alumnoRow.apellido_materno ?? null,
        semestre_actual: alumnoRow.semestre_actual,
        nombre_plan: alumnoRow.nombre_plan,
        nombre_carrera: alumnoRow.nombre_carrera,
      },
      grupos,
      creditosInscritos,
      idPeriodo: periodo.id_periodo,
    };
  }

  async submit(
    dto: SubmitExceptionDto,
    idAdmin: number,
    ip: string
  ): Promise<{ gruposInscritos: number }> {
    const alumnoRow = await this.usersRepo.getStudentByUserId(dto.idUsuario);
    if (!alumnoRow) throw new NotFoundError('Alumno no encontrado');

    const periodo = await this.repo.getActivePeriodo();
    if (!periodo) throw new NotFoundError('No hay periodo académico activo');

    const yaInscritos = await this.repo.getAlreadyEnrolledGroupIds(
      alumnoRow.id_alumno,
      periodo.id_periodo
    );

    for (const idGrupo of dto.grupos) {
      if (yaInscritos.includes(idGrupo)) {
        throw new AppError(`El alumno ya está inscrito en el grupo ${idGrupo}`, 422);
      }
    }

    for (const idGrupo of dto.grupos) {
      await this.repo.enrollGroupByAdmin(alumnoRow.id_alumno, idGrupo, idAdmin);
    }

    await this.audit.log({
      idUsuario: idAdmin,
      accion: 'EXCEPCION_REINSCRIPCION',
      modulo: 'admin/exceptions',
      descripcion: `Excepción: reinscripción de alumno ${alumnoRow.boleta} por admin ${idAdmin}. Grupos: ${dto.grupos.join(',')}`,
      ipOrigen: ip,
      metadata: {
        idAlumnoTarget: alumnoRow.id_alumno,
        boletaTarget: alumnoRow.boleta,
        grupos: dto.grupos,
        idAdmin,
      },
    });

    return { gruposInscritos: dto.grupos.length };
  }
}
