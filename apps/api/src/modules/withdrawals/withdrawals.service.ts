import { WithdrawalsRepository } from './withdrawals.repository';
import { StudentsRepository } from '../students/students.repository';
import { AuditService } from '../audit/audit.service';
import { WithdrawalRequestDto } from './withdrawals.schema';
import { AppError, NotFoundError, ForbiddenError } from '../../common/errors/AppError';

const MIN_CREDITS = 28;

export class WithdrawalsService {
  private readonly repo = new WithdrawalsRepository();
  private readonly studentRepo = new StudentsRepository();
  private readonly audit = new AuditService();

  async getStatus(idUsuario: number) {
    const student = await this.studentRepo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const window = await this.repo.getWindowForActivePeriod();
    const now = new Date();

    if (
      !window ||
      !window.activo ||
      now < new Date(window.fecha_inicio) ||
      now > new Date(window.fecha_fin)
    ) {
      return { abierto: false, mensaje: 'El periodo de bajas no está activo.' };
    }

    const inscritas = await this.repo.getActiveInscripciones(student.id_alumno);
    const totalCreditos = inscritas.reduce((s, i) => s + i.creditos, 0);

    return {
      abierto: true,
      inscritas,
      totalCreditos,
      creditosMinimos: MIN_CREDITS,
    };
  }

  async requestWithdrawal(
    idUsuario: number,
    dto: WithdrawalRequestDto,
    ip: string
  ): Promise<void> {
    const student = await this.studentRepo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const window = await this.repo.getWindowForActivePeriod();
    const now = new Date();

    if (
      !window ||
      !window.activo ||
      now < new Date(window.fecha_inicio) ||
      now > new Date(window.fecha_fin)
    ) {
      throw new ForbiddenError('El periodo de bajas no está activo');
    }

    const inscritas = await this.repo.getActiveInscripciones(student.id_alumno);

    const inscripcion = inscritas.find((i) => i.id_inscripcion === dto.idInscripcion);
    if (!inscripcion) {
      throw new NotFoundError('Inscripción no encontrada o no pertenece al alumno');
    }

    const otrasCreditos = inscritas
      .filter((i) => i.id_inscripcion !== dto.idInscripcion)
      .reduce((s, i) => s + i.creditos, 0);

    if (otrasCreditos < MIN_CREDITS) {
      throw new AppError(
        `No puedes dar de baja esta materia: quedarías con ${otrasCreditos} créditos, el mínimo es ${MIN_CREDITS}`,
        422
      );
    }

    await this.repo.dropInscripcion(
      dto.idInscripcion,
      student.id_alumno,
      idUsuario,
      dto.motivo
    );

    await this.audit.log({
      idUsuario,
      accion: 'baja_materia',
      modulo: 'withdrawals',
      descripcion: `Baja de inscripción ${dto.idInscripcion}: ${inscripcion.nombre_materia}. Motivo: ${dto.motivo}`,
      ipOrigen: ip,
      metadata: { idInscripcion: dto.idInscripcion },
    });
  }
}
