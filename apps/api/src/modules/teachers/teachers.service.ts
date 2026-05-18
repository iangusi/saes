import { TeachersRepository } from './teachers.repository';
import {
  TeacherProfile,
  TeacherSchedule,
  StudentFromGroup,
  GradeRecord,
  RecordAttendanceDto,
  UpdateGradeDto,
  CreateAnnouncementDto,
} from './teachers.types';

export class TeachersService {
  private repository = new TeachersRepository();

  async getProfile(idUsuario: number): Promise<TeacherProfile> {
    const profile = await this.repository.getProfile(idUsuario);
    if (!profile) {
      throw new Error('No se encontró el perfil del profesor');
    }
    return profile;
  }

  async getSchedule(idProfesor: number): Promise<TeacherSchedule> {
    return this.repository.getTeacherSchedule(idProfesor);
  }

  async getGroupStudents(idGrupo: number): Promise<StudentFromGroup[]> {
    return this.repository.getGroupStudents(idGrupo);
  }

  async getGroupGrades(idGrupo: number): Promise<GradeRecord[]> {
    return this.repository.getGroupGrades(idGrupo);
  }

  async recordAttendance(idUsuario: number, dto: RecordAttendanceDto): Promise<void> {
  // Validar y formatear la fecha
  if (!dto.fecha) throw new Error('La fecha es requerida');
  const fechaObj = new Date(dto.fecha);
  if (isNaN(fechaObj.getTime())) throw new Error('Fecha inválida');
  const fechaFormateada = fechaObj.toISOString().split('T')[0]; // "YYYY-MM-DD"

  // Validar que haya al menos un registro
  if (!dto.asistencias || dto.asistencias.length === 0) {
    throw new Error('Debe registrar asistencia para al menos un alumno');
  }

  await this.repository.recordAttendance(dto.idGrupo, fechaFormateada, dto.asistencias, idUsuario);
}

  async updateGrade(dto: UpdateGradeDto): Promise<void> {
    // Validar rango de calificación
    if (dto.calificacion < 0 || dto.calificacion > 10) {
      throw new Error('La calificación debe estar entre 0 y 10');
    }

    await this.repository.updateGrade(dto.idInscripcion, dto.idGrupoEvaluacion, dto.calificacion);
  }

  async createAnnouncement(idUsuario: number, dto: CreateAnnouncementDto): Promise<{ id: number }> {
  // Obtener el id_profesor asociado al id_usuario
  const profesorId = await this.repository.getProfesorIdByUsuarioId(idUsuario);
  if (!profesorId) {
    throw new Error('No se encontró un profesor asociado a este usuario');
  }

  // Validar que el profesor sea dueño del grupo
  console.log('Profesor ID:', profesorId);
  const grupos = await this.repository.getTeacherGroups(profesorId);
  if (!grupos.some((g) => g.idGrupo === dto.idGrupo)) {
    throw new Error('No tiene permiso para crear anuncios en este grupo');
  }

  // Validar contenido
  if (!dto.titulo?.trim()) throw new Error('El título es requerido');
  if (!dto.contenido?.trim()) throw new Error('El contenido es requerido');

  // Guardar anuncio (el repositorio recibe idUsuario para enviado_por)
  const id = await this.repository.createAnnouncement(dto.idGrupo, idUsuario, dto.titulo, dto.contenido);
  return { id };
}

  async getGroupAnnouncements(idGrupo: number): Promise<any[]> {
    return this.repository.getGroupAnnouncements(idGrupo);
  }

  async getGroupAttendanceHistory(idGrupo: number, fecha?: string): Promise<any[]> {
    return this.repository.getGroupAttendanceHistory(idGrupo, fecha);
  }
}
