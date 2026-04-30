import { ReenrollmentRepository } from './reenrollment.repository';
import { StudentsRepository } from '../students/students.repository';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubmitReenrollmentDto } from './reenrollment.schema';
import { AppError, NotFoundError, ForbiddenError } from '../../common/errors/AppError';

interface HorarioSlot {
  dia: string;
  inicio: string;
  fin: string;
}

function parseHorarios(raw: string): HorarioSlot[] {
  if (!raw) return [];
  return raw.split(';').map((part) => {
    const [dia, inicio, fin] = part.split('|');
    return { dia, inicio, fin };
  });
}

function horariosChocan(a: HorarioSlot[], b: HorarioSlot[]): boolean {
  for (const slotA of a) {
    for (const slotB of b) {
      if (slotA.dia !== slotB.dia) continue;
      if (slotA.inicio < slotB.fin && slotA.fin > slotB.inicio) return true;
    }
  }
  return false;
}

export class ReenrollmentService {
  private readonly repo = new ReenrollmentRepository();
  private readonly studentRepo = new StudentsRepository();
  private readonly audit = new AuditService();
  private readonly notifications = new NotificationsService();

  async getStatus(idUsuario: number) {
    const student = await this.studentRepo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const cita = await this.repo.getActiveCita(student.id_alumno);

    if (!cita) {
      return { estado: 'sin_periodo', mensaje: 'No hay periodo de reinscripción activo.' };
    }

    const now = new Date();
    const citaInicio = new Date(`${cita.fecha_cita}T${cita.hora_inicio}`);
    const citaFin = new Date(`${cita.fecha_cita}T${cita.hora_fin}`);

    const enrolled = await this.repo.getAlreadyEnrolledGroupIds(
      student.id_alumno,
      cita.id_periodo
    );

    if (enrolled.length > 0) {
      return { estado: 'inscrito', mensaje: 'Ya estás inscrito en este periodo.' };
    }

    const window = await this.repo.getReinscripcionWindow(cita.id_periodo);

    if (!window || !window.activo || now < new Date(window.fecha_inicio) || now > new Date(window.fecha_fin)) {
      if (cita && now < citaInicio && window && window.activo && now >= new Date(window.fecha_inicio) && now <= new Date(window.fecha_fin)) {
        return {
          estado: 'cita_pendiente',
          mensaje: 'Tu cita aún no ha iniciado.',
          cita: {
            fecha: cita.fecha_cita,
            horaInicio: cita.hora_inicio,
            horaFin: cita.hora_fin,
            periodo: cita.nombre_periodo,
          },
        };
      }
      return { estado: 'fuera_ventana', mensaje: 'El periodo de reinscripción no está activo.' };
    }

    if (now >= citaInicio && now <= citaFin) {
      return {
        estado: 'en_cita',
        mensaje: 'Tu cita está activa. Puedes reinscribirte.',
        cita: {
          fecha: cita.fecha_cita,
          horaInicio: cita.hora_inicio,
          horaFin: cita.hora_fin,
          periodo: cita.nombre_periodo,
        },
      };
    }

    if (now > citaFin) {
      return { estado: 'cita_expirada', mensaje: 'Tu cita ya pasó. Contacta a la administración.' };
    }

    return { estado: 'desconocido' };
  }

  async getEligibility(idUsuario: number) {
    const student = await this.studentRepo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const cita = await this.repo.getActiveCita(student.id_alumno);
    if (!cita) throw new ForbiddenError('No hay cita activa para este periodo');

    const now = new Date();
    const citaInicio = new Date(`${cita.fecha_cita}T${cita.hora_inicio}`);
    const citaFin = new Date(`${cita.fecha_cita}T${cita.hora_fin}`);

    if (now < citaInicio || now > citaFin) {
      throw new ForbiddenError('Tu cita no está activa en este momento');
    }

    const window = await this.repo.getReinscripcionWindow(cita.id_periodo);
    if (!window || !window.activo || now < new Date(window.fecha_inicio) || now > new Date(window.fecha_fin)) {
      throw new ForbiddenError('La ventana de reinscripción no está activa');
    }

    const approvedIds = await this.repo.getApprovedMateriaIds(student.id_alumno);
    const enrolledGroups = (await this.repo.getInscritos(student.id_alumno, cita.id_periodo)) as any[];
    const enrolledCredits = enrolledGroups.reduce(
      (sum: number, g: any) => sum + (g.creditos || 0),
      0
    );

    const candidates = await this.repo.getEligibleGroups(
      student.id_alumno,
      cita.id_periodo,
      student.semestre_actual,
      student.id_plan
    );

    // Filtrar prerrequisitos y choques de horario
    const enrolledHorarios: HorarioSlot[] = [];
    for (const eg of enrolledGroups) {
      const slots = parseHorarios(eg.horarios_raw ?? '');
      enrolledHorarios.push(...slots);
    }

    const eligible = [];
    for (const group of candidates) {
      const prereqs = await this.repo.getPrerequisitesForMateria(group.id_materia);
      const prereqsFulfilled = prereqs.every((pid) => approvedIds.includes(pid));
      if (!prereqsFulfilled) continue;

      const groupHorarios = parseHorarios(group.horarios ?? '');
      if (horariosChocan(enrolledHorarios, groupHorarios)) {
        continue;
      }

      eligible.push(group);
    }

    const { maxCredits } = await this.repo.getPlanCreditLimits(student.id_plan);

    return {
      grupos: eligible,
      creditosInscritos: enrolledCredits,
      creditosMaximos: maxCredits,
      creditosDisponibles: maxCredits - enrolledCredits,
    };
  }

  async submit(idUsuario: number, dto: SubmitReenrollmentDto, ip: string) {
    const student = await this.studentRepo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const cita = await this.repo.getActiveCita(student.id_alumno);
    if (!cita) throw new ForbiddenError('No hay cita activa');

    const now = new Date();
    const citaInicio = new Date(`${cita.fecha_cita}T${cita.hora_inicio}`);
    const citaFin = new Date(`${cita.fecha_cita}T${cita.hora_fin}`);

    if (now < citaInicio || now > citaFin) {
      throw new ForbiddenError('Tu cita no está activa en este momento');
    }

    const window = await this.repo.getReinscripcionWindow(cita.id_periodo);
    if (!window || !window.activo || now < new Date(window.fecha_inicio) || now > new Date(window.fecha_fin)) {
      throw new ForbiddenError('La ventana de reinscripción no está activa');
    }

    const eligibility = await this.getEligibility(idUsuario);
    const { minCredits, maxCredits } = await this.repo.getPlanCreditLimits(student.id_plan);

    const eligibleIds = eligibility.grupos.map((g: { id_grupo: number }) => g.id_grupo);

    // Verificar que todos los grupos enviados son elegibles
    for (const idGrupo of dto.grupos) {
      if (!eligibleIds.includes(idGrupo)) {
        throw new AppError(`El grupo ${idGrupo} no es elegible para inscripción`, 422);
      }
    }

    // Calcular créditos totales
    const selectedGroups = eligibility.grupos.filter((g: { id_grupo: number }) =>
      dto.grupos.includes(g.id_grupo)
    );
    const totalCredits =
      Number(eligibility.creditosInscritos) +
      selectedGroups.reduce((sum: number, g: any) => sum + (g.creditos || 0), 0);

    if (totalCredits < minCredits) {
      throw new AppError(
        `No cumples la carga mínima de ${minCredits} créditos`,
        422
      );
    }

    if (totalCredits > maxCredits) {
      throw new AppError(
        `Excedes la carga máxima de ${maxCredits} créditos`,
        422
      );
    }

    // Inscribir cada grupo
    for (const idGrupo of dto.grupos) {
      await this.repo.enrollGroup(student.id_alumno, idGrupo);
    }

    await this.repo.markCitaUsed(cita.id_cita);

    await this.audit.log({
      idUsuario: student.id_usuario,
      accion: 'reinscripcion',
      modulo: 'reenrollment',
      descripcion: `Reinscripción exitosa. Grupos: ${dto.grupos.join(',')}`,
      ipOrigen: ip,
      metadata: { grupos: dto.grupos, creditos: totalCredits },
    });

    const user = await this.studentRepo.findByUserId(idUsuario);
    if (user) {
      const nombresMaterias = selectedGroups.map(
        (g: { nombre_materia: string }) => g.nombre_materia
      );
      try {
        await this.notifications.sendEnrollmentConfirmation(
          user.correo_contacto,
          user.nombre,
          nombresMaterias
        );
      } catch (emailErr) {
        console.error('Error sending enrollment confirmation email:', emailErr);
      }
    }

    return { gruposInscritos: dto.grupos.length, creditosTotales: totalCredits };
  }
}
