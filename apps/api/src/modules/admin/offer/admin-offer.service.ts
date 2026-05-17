import { AdminOfferRepository } from './admin-offer.repository';
import { AuditService } from '../../audit/audit.service';
import { NotFoundError, ConflictError } from '../../../common/errors/AppError';
import {
  CreateCarreraDto, UpdateCarreraDto,
  CreatePlanDto, UpdatePlanDto, AddMateriaAlPlanDto,
  CreateMateriaDto, UpdateMateriaDto, AddPrerrequistoDto,
  CreateGrupoDto, UpdateGrupoDto,
  CreateHorarioDto, UpdateHorarioDto,
} from './admin-offer.types';

export class AdminOfferService {
  private readonly repo = new AdminOfferRepository();
  private readonly audit = new AuditService();

  // ─── Departamentos ────────────────────────────────────────────────────────

  async getDepartamentos() {
    return this.repo.getDepartamentos();
  }

  // ─── Carreras ─────────────────────────────────────────────────────────────

  async getCarreras() {
    return this.repo.getCarreras();
  }

  async createCarrera(dto: CreateCarreraDto, idUsuario: number, ip: string) {
    const id = await this.repo.createCarrera(dto);
    await this.audit.log({
      idUsuario, accion: 'CREAR_CARRERA', modulo: 'admin-offer',
      descripcion: `Carrera creada: ${dto.nombre} (${dto.clave})`,
      ipOrigen: ip, metadata: { id, nombre: dto.nombre },
    });
    return this.repo.getCarreraById(id);
  }

  async updateCarrera(id: number, dto: UpdateCarreraDto, idUsuario: number, ip: string) {
    const existing = await this.repo.getCarreraById(id);
    if (!existing) throw new NotFoundError('Carrera no encontrada');

    await this.repo.updateCarrera(id, dto);
    await this.audit.log({
      idUsuario, accion: 'ACTUALIZAR_CARRERA', modulo: 'admin-offer',
      descripcion: `Carrera actualizada: id ${id}`,
      ipOrigen: ip, metadata: { id, cambios: dto },
    });
    return this.repo.getCarreraById(id);
  }

  async deleteCarrera(id: number, idUsuario: number, ip: string) {
    const existing = await this.repo.getCarreraById(id);
    if (!existing) throw new NotFoundError('Carrera no encontrada');

    await this.repo.deleteCarrera(id);
    await this.audit.log({
      idUsuario, accion: 'ELIMINAR_CARRERA', modulo: 'admin-offer',
      descripcion: `Carrera eliminada: ${existing.nombre}`,
      ipOrigen: ip, metadata: { id },
    });
  }

  // ─── Planes de estudio ────────────────────────────────────────────────────

  async getPlanes() {
    return this.repo.getPlanes();
  }

  async getPlanDetalle(id: number) {
    const plan = await this.repo.getPlanById(id);
    if (!plan) throw new NotFoundError('Plan de estudios no encontrado');

    const materias = await this.repo.getPlanMaterias(id);
    return { ...plan, materias };
  }

  async createPlan(dto: CreatePlanDto, idUsuario: number, ip: string) {
    const id = await this.repo.createPlan(dto);
    await this.audit.log({
      idUsuario, accion: 'CREAR_PLAN', modulo: 'admin-offer',
      descripcion: `Plan de estudios creado: ${dto.nombre}`,
      ipOrigen: ip, metadata: { id, nombre: dto.nombre },
    });
    return this.repo.getPlanById(id);
  }

  async updatePlan(id: number, dto: UpdatePlanDto, idUsuario: number, ip: string) {
    const existing = await this.repo.getPlanById(id);
    if (!existing) throw new NotFoundError('Plan de estudios no encontrado');

    await this.repo.updatePlan(id, dto);
    await this.audit.log({
      idUsuario, accion: 'ACTUALIZAR_PLAN', modulo: 'admin-offer',
      descripcion: `Plan de estudios actualizado: id ${id}`,
      ipOrigen: ip, metadata: { id, cambios: dto },
    });
    return this.repo.getPlanById(id);
  }

  async deletePlan(id: number, idUsuario: number, ip: string) {
    const existing = await this.repo.getPlanById(id);
    if (!existing) throw new NotFoundError('Plan de estudios no encontrado');

    await this.repo.deletePlan(id);
    await this.audit.log({
      idUsuario, accion: 'ELIMINAR_PLAN', modulo: 'admin-offer',
      descripcion: `Plan de estudios eliminado: ${existing.nombre}`,
      ipOrigen: ip, metadata: { id },
    });
  }

  async addMateriaAlPlan(idPlan: number, dto: AddMateriaAlPlanDto, idUsuario: number, ip: string) {
    const plan = await this.repo.getPlanById(idPlan);
    if (!plan) throw new NotFoundError('Plan de estudios no encontrado');

    const existe = await this.repo.planMateriaExists(idPlan, dto.idMateria);
    if (existe) throw new ConflictError('La materia ya está en el plan de estudios');

    await this.repo.addMateriaAlPlan(idPlan, dto);
    await this.audit.log({
      idUsuario, accion: 'AGREGAR_MATERIA_PLAN', modulo: 'admin-offer',
      descripcion: `Materia ${dto.idMateria} agregada al plan ${idPlan}`,
      ipOrigen: ip, metadata: { idPlan, idMateria: dto.idMateria },
    });
    return this.repo.getPlanMaterias(idPlan);
  }

  async removeMateriaDelPlan(idPlan: number, idMateria: number, idUsuario: number, ip: string) {
    const plan = await this.repo.getPlanById(idPlan);
    if (!plan) throw new NotFoundError('Plan de estudios no encontrado');

    await this.repo.removeMateriaDelPlan(idPlan, idMateria);
    await this.audit.log({
      idUsuario, accion: 'QUITAR_MATERIA_PLAN', modulo: 'admin-offer',
      descripcion: `Materia ${idMateria} quitada del plan ${idPlan}`,
      ipOrigen: ip, metadata: { idPlan, idMateria },
    });
  }

  // ─── Materias ─────────────────────────────────────────────────────────────

  async getMaterias(search?: string) {
    return this.repo.getMaterias(search);
  }

  async getMateriasList() {
    return this.repo.getMateriasList();
  }

  async createMateria(dto: CreateMateriaDto, idUsuario: number, ip: string) {
    const id = await this.repo.createMateria(dto);
    await this.audit.log({
      idUsuario, accion: 'CREAR_MATERIA', modulo: 'admin-offer',
      descripcion: `Materia creada: ${dto.nombre} (${dto.clave})`,
      ipOrigen: ip, metadata: { id, clave: dto.clave },
    });
    return this.repo.getMateriaById(id);
  }

  async updateMateria(id: number, dto: UpdateMateriaDto, idUsuario: number, ip: string) {
    const existing = await this.repo.getMateriaById(id);
    if (!existing) throw new NotFoundError('Materia no encontrada');

    await this.repo.updateMateria(id, dto);
    await this.audit.log({
      idUsuario, accion: 'ACTUALIZAR_MATERIA', modulo: 'admin-offer',
      descripcion: `Materia actualizada: id ${id}`,
      ipOrigen: ip, metadata: { id, cambios: dto },
    });
    return this.repo.getMateriaById(id);
  }

  async deleteMateria(id: number, idUsuario: number, ip: string) {
    const existing = await this.repo.getMateriaById(id);
    if (!existing) throw new NotFoundError('Materia no encontrada');

    await this.repo.deleteMateria(id);
    await this.audit.log({
      idUsuario, accion: 'ELIMINAR_MATERIA', modulo: 'admin-offer',
      descripcion: `Materia eliminada: ${existing.nombre}`,
      ipOrigen: ip, metadata: { id },
    });
  }

  async getPrerrequisitos(idMateria: number) {
    const existing = await this.repo.getMateriaById(idMateria);
    if (!existing) throw new NotFoundError('Materia no encontrada');
    return this.repo.getPrerrequisitos(idMateria);
  }

  async addPrerrequisito(idMateria: number, dto: AddPrerrequistoDto, idUsuario: number, ip: string) {
    const materia = await this.repo.getMateriaById(idMateria);
    if (!materia) throw new NotFoundError('Materia no encontrada');

    if (idMateria === dto.idPrerrequisito) {
      throw new ConflictError('Una materia no puede ser prerrequisito de sí misma');
    }

    const pre = await this.repo.getMateriaById(dto.idPrerrequisito);
    if (!pre) throw new NotFoundError('Materia prerrequisito no encontrada');

    const existe = await this.repo.prerrequistoExists(idMateria, dto.idPrerrequisito);
    if (existe) throw new ConflictError('El prerrequisito ya existe');

    await this.repo.addPrerrequisito(idMateria, dto);
    await this.audit.log({
      idUsuario, accion: 'AGREGAR_PRERREQUISITO', modulo: 'admin-offer',
      descripcion: `Prerrequisito ${dto.idPrerrequisito} agregado a materia ${idMateria}`,
      ipOrigen: ip, metadata: { idMateria, idPrerrequisito: dto.idPrerrequisito },
    });
    return this.repo.getPrerrequisitos(idMateria);
  }

  async removePrerrequisito(idMateria: number, idPrerrequisito: number, idUsuario: number, ip: string) {
    const materia = await this.repo.getMateriaById(idMateria);
    if (!materia) throw new NotFoundError('Materia no encontrada');

    await this.repo.removePrerrequisito(idMateria, idPrerrequisito);
    await this.audit.log({
      idUsuario, accion: 'QUITAR_PRERREQUISITO', modulo: 'admin-offer',
      descripcion: `Prerrequisito ${idPrerrequisito} quitado de materia ${idMateria}`,
      ipOrigen: ip, metadata: { idMateria, idPrerrequisito },
    });
  }

  // ─── Aulas y Profesores ───────────────────────────────────────────────────

  async getAulas() {
    return this.repo.getAulas();
  }

  async getProfesores() {
    return this.repo.getProfesores();
  }

  // ─── Grupos ───────────────────────────────────────────────────────────────

  async getGrupos(idPeriodo?: number) {
    return this.repo.getGrupos(idPeriodo);
  }

  async createGrupo(dto: CreateGrupoDto, idUsuario: number, ip: string) {
    const id = await this.repo.createGrupo(dto);
    await this.audit.log({
      idUsuario, accion: 'CREAR_GRUPO', modulo: 'admin-offer',
      descripcion: `Grupo creado: ${dto.claveGrupo} (periodo ${dto.idPeriodo}, materia ${dto.idMateria})`,
      ipOrigen: ip, metadata: { id, claveGrupo: dto.claveGrupo },
    });
    return this.repo.getGrupoById(id);
  }

  async updateGrupo(id: number, dto: UpdateGrupoDto, idUsuario: number, ip: string) {
    const existing = await this.repo.getGrupoById(id);
    if (!existing) throw new NotFoundError('Grupo no encontrado');

    await this.repo.updateGrupo(id, dto);
    await this.audit.log({
      idUsuario, accion: 'ACTUALIZAR_GRUPO', modulo: 'admin-offer',
      descripcion: `Grupo actualizado: id ${id}`,
      ipOrigen: ip, metadata: { id, cambios: dto },
    });
    return this.repo.getGrupoById(id);
  }

  async deleteGrupo(id: number, idUsuario: number, ip: string) {
    const existing = await this.repo.getGrupoById(id);
    if (!existing) throw new NotFoundError('Grupo no encontrado');

    const inscripciones = await this.repo.countInscripcionesActivas(id);
    if (inscripciones > 0) {
      throw new ConflictError(`No se puede eliminar el grupo: tiene ${inscripciones} inscripción(es) activa(s)`);
    }

    await this.repo.deleteGrupo(id);
    await this.audit.log({
      idUsuario, accion: 'ELIMINAR_GRUPO', modulo: 'admin-offer',
      descripcion: `Grupo eliminado: ${existing.clave_grupo}`,
      ipOrigen: ip, metadata: { id },
    });
  }

  // ─── Horarios ─────────────────────────────────────────────────────────────

  async getHorarios(idGrupo: number) {
    const grupo = await this.repo.getGrupoById(idGrupo);
    if (!grupo) throw new NotFoundError('Grupo no encontrado');
    return this.repo.getHorarios(idGrupo);
  }

  async createHorario(idGrupo: number, dto: CreateHorarioDto, idUsuario: number, ip: string) {
    const grupo = await this.repo.getGrupoById(idGrupo);
    if (!grupo) throw new NotFoundError('Grupo no encontrado');

    let id: number;
    try {
      id = await this.repo.createHorario(idGrupo, dto);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('El aula ya tiene un horario en ese día y hora');
      }
      throw err;
    }

    await this.audit.log({
      idUsuario, accion: 'CREAR_HORARIO', modulo: 'admin-offer',
      descripcion: `Horario creado para grupo ${idGrupo}: ${dto.diaSemana} ${dto.horaInicio}-${dto.horaFin}`,
      ipOrigen: ip, metadata: { id, idGrupo },
    });
    return this.repo.getHorarios(idGrupo);
  }

  async updateHorario(idGrupo: number, idHorario: number, dto: UpdateHorarioDto, idUsuario: number, ip: string) {
    const horario = await this.repo.getHorarioById(idHorario);
    if (!horario || horario.id_grupo !== idGrupo) throw new NotFoundError('Horario no encontrado');

    try {
      await this.repo.updateHorario(idHorario, dto);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('El aula ya tiene un horario en ese día y hora');
      }
      throw err;
    }

    await this.audit.log({
      idUsuario, accion: 'ACTUALIZAR_HORARIO', modulo: 'admin-offer',
      descripcion: `Horario ${idHorario} actualizado en grupo ${idGrupo}`,
      ipOrigen: ip, metadata: { idHorario, idGrupo, cambios: dto },
    });
    return this.repo.getHorarios(idGrupo);
  }

  async deleteHorario(idGrupo: number, idHorario: number, idUsuario: number, ip: string) {
    const horario = await this.repo.getHorarioById(idHorario);
    if (!horario || horario.id_grupo !== idGrupo) throw new NotFoundError('Horario no encontrado');

    await this.repo.deleteHorario(idHorario);
    await this.audit.log({
      idUsuario, accion: 'ELIMINAR_HORARIO', modulo: 'admin-offer',
      descripcion: `Horario ${idHorario} eliminado del grupo ${idGrupo}`,
      ipOrigen: ip, metadata: { idHorario, idGrupo },
    });
  }
}
