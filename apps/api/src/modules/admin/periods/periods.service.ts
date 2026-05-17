import { PeriodsRepository } from './periods.repository';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuditService } from '../../audit/audit.service';
import { NotFoundError, ConflictError, ValidationError } from '../../../common/errors/AppError';
import {
  CreatePeriodDto,
  UpdatePeriodDto,
  CreateProcessWindowDto,
  UpdateProcessWindowDto,
  GenerateAppointmentsDto,
  ManualAppointmentDto,
  CreateProcessTypeDto,
  UpdateProcessTypeDto,
} from './periods.types';

export class PeriodsService {
  private readonly repo = new PeriodsRepository();
  private readonly notif = new NotificationsService();
  private readonly audit = new AuditService();

  async getAllPeriods() {
    return this.repo.getAllPeriods();
  }

  async getPeriodWithProcesses(id: number) {
    const period = await this.repo.getPeriodById(id);
    if (!period) throw new NotFoundError('Periodo no encontrado');

    const processes = await this.repo.getProcessWindowsByPeriod(id);
    const appointmentCount = await this.repo.countAppointments(id);

    return { ...period, processes, appointmentCount };
  }

  async getAllProcessTypes() {
    return this.repo.getAllProcessTypes();
  }

  // ─── Process Types CRUD ───────────────────────────────────────────────────────

  async createProcessType(dto: CreateProcessTypeDto, idUsuario: number, ip: string) {
    const id = await this.repo.createProcessType(dto);
    await this.audit.log({
      idUsuario,
      accion: 'CREAR_TIPO_PROCESO',
      modulo: 'admin/periods',
      descripcion: `Tipo de proceso creado: ${dto.nombre}`,
      ipOrigen: ip,
      metadata: { idProceso: id, nombre: dto.nombre },
    });
    return this.repo.getProcessTypeById(id);
  }

  async updateProcessType(id: number, dto: UpdateProcessTypeDto, idUsuario: number, ip: string) {
    const existing = await this.repo.getProcessTypeById(id);
    if (!existing) throw new NotFoundError('Tipo de proceso no encontrado');

    await this.repo.updateProcessType(id, dto);
    await this.audit.log({
      idUsuario,
      accion: 'ACTUALIZAR_TIPO_PROCESO',
      modulo: 'admin/periods',
      descripcion: `Tipo de proceso actualizado: ${existing.nombre}`,
      ipOrigen: ip,
      metadata: { idProceso: id, cambios: dto as Record<string, unknown> },
    });
    return this.repo.getProcessTypeById(id);
  }

  async deleteProcessType(id: number, idUsuario: number, ip: string) {
    const existing = await this.repo.getProcessTypeById(id);
    if (!existing) throw new NotFoundError('Tipo de proceso no encontrado');

    const hasDeps = await this.repo.processTypeHasDependencies(id);
    if (hasDeps) {
      throw new ConflictError(
        'No se puede eliminar el tipo de proceso porque tiene ventanas de proceso asociadas'
      );
    }

    await this.repo.deleteProcessType(id);
    await this.audit.log({
      idUsuario,
      accion: 'ELIMINAR_TIPO_PROCESO',
      modulo: 'admin/periods',
      descripcion: `Tipo de proceso eliminado: ${existing.nombre}`,
      ipOrigen: ip,
      metadata: { idProceso: id },
    });
  }

  // ─── Periods CRUD ─────────────────────────────────────────────────────────────

  async createPeriod(dto: CreatePeriodDto, idUsuario: number, ip: string) {
    const id = await this.repo.createPeriod(dto);
    await this.audit.log({
      idUsuario,
      accion: 'CREAR_PERIODO',
      modulo: 'admin/periods',
      descripcion: `Periodo creado: ${dto.nombre}`,
      ipOrigen: ip,
      metadata: { idPeriodo: id, nombre: dto.nombre },
    });
    return this.repo.getPeriodById(id);
  }

  async updatePeriod(id: number, dto: UpdatePeriodDto, idUsuario: number, ip: string) {
    const existing = await this.repo.getPeriodById(id);
    if (!existing) throw new NotFoundError('Periodo no encontrado');

    await this.repo.updatePeriod(id, dto);
    await this.audit.log({
      idUsuario,
      accion: 'ACTUALIZAR_PERIODO',
      modulo: 'admin/periods',
      descripcion: `Periodo actualizado: ${existing.nombre}`,
      ipOrigen: ip,
      metadata: { idPeriodo: id, cambios: dto as Record<string, unknown> },
    });
    return this.repo.getPeriodById(id);
  }

  async deletePeriod(id: number, idUsuario: number, ip: string) {
    const existing = await this.repo.getPeriodById(id);
    if (!existing) throw new NotFoundError('Periodo no encontrado');

    const hasDeps = await this.repo.hasDependencies(id);
    if (hasDeps) {
      throw new ConflictError(
        'No se puede eliminar el periodo porque tiene grupos o inscripciones asociadas'
      );
    }

    await this.repo.deletePeriod(id);
    await this.audit.log({
      idUsuario,
      accion: 'ELIMINAR_PERIODO',
      modulo: 'admin/periods',
      descripcion: `Periodo eliminado: ${existing.nombre}`,
      ipOrigen: ip,
      metadata: { idPeriodo: id },
    });
  }

  // ─── Finalizar ciclo ──────────────────────────────────────────────────────────

  async finalizePeriod(id: number, idUsuario: number, ip: string) {
    const existing = await this.repo.getPeriodById(id);
    if (!existing) throw new NotFoundError('Periodo no encontrado');

    if (!existing.activo) {
      throw new ConflictError('El periodo ya está finalizado');
    }

    const result = await this.repo.finalizePeriod(id);

    await this.audit.log({
      idUsuario,
      accion: 'FINALIZAR_PERIODO',
      modulo: 'admin/periods',
      descripcion: `Ciclo finalizado: ${existing.nombre}. ${result.alumnosAvanzados} alumnos avanzaron de semestre.`,
      ipOrigen: ip,
      metadata: { idPeriodo: id, alumnosAvanzados: result.alumnosAvanzados },
    });

    return result;
  }

  // ─── Process Windows ──────────────────────────────────────────────────────────

  async getProcessWindows(idPeriodo: number) {
    const period = await this.repo.getPeriodById(idPeriodo);
    if (!period) throw new NotFoundError('Periodo no encontrado');
    return this.repo.getProcessWindowsByPeriod(idPeriodo);
  }

  async createProcessWindow(
    idPeriodo: number,
    dto: CreateProcessWindowDto,
    idUsuario: number,
    ip: string
  ) {
    const period = await this.repo.getPeriodById(idPeriodo);
    if (!period) throw new NotFoundError('Periodo no encontrado');

    const id = await this.repo.createProcessWindow(idPeriodo, dto);
    await this.audit.log({
      idUsuario,
      accion: 'CREAR_VENTANA_PROCESO',
      modulo: 'admin/periods',
      descripcion: `Ventana de proceso creada para periodo ${period.nombre}`,
      ipOrigen: ip,
      metadata: { idPeriodo, idProceso: dto.idProceso },
    });
    return this.repo.getProcessWindowById(id);
  }

  async updateProcessWindow(
    idPeriodo: number,
    idPeriodoProceso: number,
    dto: UpdateProcessWindowDto,
    idUsuario: number,
    ip: string
  ) {
    const pw = await this.repo.getProcessWindowById(idPeriodoProceso);
    if (!pw || pw.id_periodo !== idPeriodo) throw new NotFoundError('Ventana de proceso no encontrada');

    await this.repo.updateProcessWindow(idPeriodoProceso, dto);
    await this.audit.log({
      idUsuario,
      accion: 'ACTUALIZAR_VENTANA_PROCESO',
      modulo: 'admin/periods',
      descripcion: `Ventana de proceso ${idPeriodoProceso} actualizada`,
      ipOrigen: ip,
      metadata: { idPeriodoProceso, cambios: dto as Record<string, unknown> },
    });
    return this.repo.getProcessWindowById(idPeriodoProceso);
  }

  async deleteProcessWindow(idPeriodo: number, idPeriodoProceso: number, idUsuario: number, ip: string) {
    const pw = await this.repo.getProcessWindowById(idPeriodoProceso);
    if (!pw || pw.id_periodo !== idPeriodo) throw new NotFoundError('Ventana de proceso no encontrada');

    await this.repo.deleteProcessWindow(idPeriodoProceso);
    await this.audit.log({
      idUsuario,
      accion: 'ELIMINAR_VENTANA_PROCESO',
      modulo: 'admin/periods',
      descripcion: `Ventana de proceso ${idPeriodoProceso} eliminada`,
      ipOrigen: ip,
      metadata: { idPeriodoProceso },
    });
  }

  // ─── Appointments ─────────────────────────────────────────────────────────────

  async getAppointments(idPeriodo: number) {
    const period = await this.repo.getPeriodById(idPeriodo);
    if (!period) throw new NotFoundError('Periodo no encontrado');
    return this.repo.getAppointmentsByPeriod(idPeriodo);
  }

  async generateAppointments(idPeriodo: number, dto: GenerateAppointmentsDto, idUsuario: number, ip: string) {
    const period = await this.repo.getPeriodById(idPeriodo);
    if (!period) throw new NotFoundError('Periodo no encontrado');

    let fechaInicio = dto.fechaInicio;
    let fechaFin = dto.fechaFin;

    if (!fechaInicio || !fechaFin) {
      const windowRow = await this.repo.getReinscripcionWindow(idPeriodo);
      if (!windowRow) {
        throw new ValidationError(
          'No hay ventana de reinscripción configurada para este periodo. ' +
          'Proporciona fechaInicio y fechaFin manualmente, o crea una ventana de proceso "reinscripcion".'
        );
      }
      fechaInicio = fechaInicio ?? (windowRow.fecha_inicio as string).split('T')[0];
      fechaFin = fechaFin ?? (windowRow.fecha_fin as string).split('T')[0];
    }

    const alumnos = await this.repo.getAlumnosParaCitas(idPeriodo);
    if (alumnos.length === 0) {
      throw new ValidationError(
        'No hay alumnos regulares sin inscripciones en el periodo seleccionado para asignar citas'
      );
    }

    const [hiH, hiM] = dto.horaInicioDia.split(':').map(Number);
    const [hfH, hfM] = dto.horaFinDia.split(':').map(Number);
    const minutosPorDia = (hfH * 60 + hfM) - (hiH * 60 + hiM);

    if (minutosPorDia <= 0) {
      throw new ValidationError('La hora de fin debe ser posterior a la hora de inicio del día');
    }

    const start = new Date(`${fechaInicio}T00:00:00`);
    const end = new Date(`${fechaFin}T00:00:00`);
    const dias = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

    if (dias <= 0) throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio');

    const totalMinutos = dias * minutosPorDia;
    const minutosPorAlumno = Math.max(Math.floor(totalMinutos / alumnos.length), 5);

    const citas: Array<{ idAlumno: number; idPeriodo: number; fechaCita: string; horaInicio: string; horaFin: string }> = [];

    let currentDate = new Date(`${fechaInicio}T00:00:00`);
    let minutosEnDia = hiH * 60 + hiM;

    for (const alumno of alumnos) {
      if (minutosEnDia + minutosPorAlumno > hfH * 60 + hfM) {
        currentDate = new Date(currentDate.getTime() + 86_400_000);
        minutosEnDia = hiH * 60 + hiM;
      }

      const fechaCita = currentDate.toISOString().split('T')[0];
      const horaInicio = toHHMM(minutosEnDia);
      const fin = Math.min(minutosEnDia + minutosPorAlumno, hfH * 60 + hfM);
      const horaFin = toHHMM(fin);

      citas.push({ idAlumno: alumno.id_alumno, idPeriodo, fechaCita, horaInicio, horaFin });
      minutosEnDia += minutosPorAlumno;
    }

    await this.repo.insertAppointmentsBatch(citas);

    await this.audit.log({
      idUsuario,
      accion: 'GENERAR_CITAS',
      modulo: 'admin/periods',
      descripcion: `${citas.length} citas generadas para periodo ${period.nombre}`,
      ipOrigen: ip,
      metadata: { idPeriodo, cantidad: citas.length, fechaInicio, fechaFin },
    });

    this.sendAppointmentEmails(citas).catch(() => {});

    return { generadas: citas.length, minutosPorAlumno };
  }

  private async sendAppointmentEmails(
    citas: Array<{ idAlumno: number; idPeriodo: number; fechaCita: string; horaInicio: string; horaFin: string }>
  ) {
    for (const cita of citas) {
      const alumno = await this.repo.getAlumnoEmailById(cita.idAlumno);
      if (!alumno) continue;
      await this.notif
        .sendAppointmentNotification(alumno.correo, alumno.nombre, cita.fechaCita, cita.horaInicio, cita.horaFin)
        .catch(() => {});
    }
  }

  async createManualAppointment(idPeriodo: number, dto: ManualAppointmentDto, idUsuario: number, ip: string) {
    const period = await this.repo.getPeriodById(idPeriodo);
    if (!period) throw new NotFoundError('Periodo no encontrado');

    const alumno = await this.repo.getAlumnoByBoleta(dto.boleta);
    if (!alumno) throw new NotFoundError(`No se encontró ningún alumno con boleta ${dto.boleta}`);

    await this.repo.upsertManualAppointment({
      idAlumno: alumno.id_alumno,
      idPeriodo,
      fechaCita: dto.fechaCita,
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
    });

    await this.audit.log({
      idUsuario,
      accion: 'CITA_MANUAL',
      modulo: 'admin/periods',
      descripcion: `Cita manual asignada al alumno ${dto.boleta} en periodo ${period.nombre}`,
      ipOrigen: ip,
      metadata: { idPeriodo, boleta: dto.boleta, ...dto } as Record<string, unknown>,
    });

    this.notif
      .sendAppointmentNotification(alumno.correo, alumno.nombre, dto.fechaCita, dto.horaInicio, dto.horaFin)
      .catch(() => {});
  }

  async deleteAllAppointments(idPeriodo: number, idUsuario: number, ip: string) {
    const period = await this.repo.getPeriodById(idPeriodo);
    if (!period) throw new NotFoundError('Periodo no encontrado');

    await this.repo.deleteAppointmentsByPeriod(idPeriodo);

    await this.audit.log({
      idUsuario,
      accion: 'ELIMINAR_CITAS',
      modulo: 'admin/periods',
      descripcion: `Todas las citas del periodo ${period.nombre} fueron eliminadas`,
      ipOrigen: ip,
      metadata: { idPeriodo },
    });
  }
}

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
