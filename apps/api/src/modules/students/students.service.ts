import { StudentsRepository } from './students.repository';
import { NotFoundError } from '../../common/errors/AppError';

export class StudentsService {
  private readonly repo = new StudentsRepository();

  async getProfile(idUsuario: number) {
    const student = await this.repo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Perfil de alumno no encontrado');

    return {
      idAlumno: student.id_alumno,
      boleta: student.boleta,
      semestre: student.semestre_actual,
      estatus: student.estatus,
      nombre: student.nombre,
      apellidoPaterno: student.apellido_paterno,
      apellidoMaterno: student.apellido_materno,
      correo: student.correo_contacto,
      carrera: student.nombre_carrera,
      plan: student.nombre_plan,
      totalCreditos: student.total_creditos,
      totalMaterias: student.total_materias,
    };
  }

  async getKardex(idUsuario: number) {
    const student = await this.repo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const [materias, stats, porPeriodo] = await Promise.all([
      this.repo.getKardex(student.id_alumno),
      this.repo.getKardexStats(student.id_alumno),
      this.repo.getKardexByPeriod(student.id_alumno),
    ]);

    const avancePorcentaje =
      student.total_materias > 0
        ? Math.round((stats.aprobadas / student.total_materias) * 100)
        : 0;

    return {
      materias,
      promedio: stats.promedio,
      materiasAprobadas: stats.aprobadas,
      totalMaterias: student.total_materias,
      avancePorcentaje,
      porPeriodo,
    };
  }

  async getSchedule(idUsuario: number) {
    const student = await this.repo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const horario = await this.repo.getSchedule(student.id_alumno);

    // Agrupa por día para facilitar el consumo en frontend
    const porDia: Record<string, typeof horario> = {};
    for (const slot of horario) {
      if (!porDia[slot.dia_semana]) porDia[slot.dia_semana] = [];
      porDia[slot.dia_semana].push(slot);
    }

    return { horario, porDia };
  }

  async getGrades(idUsuario: number) {
    const student = await this.repo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    return this.repo.getGrades(student.id_alumno);
  }

  async getAnnouncements(idUsuario: number) {
    const student = await this.repo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const rows = await this.repo.getAnnouncements(student.id_alumno);
    return rows.map((r) => ({
      idAnuncio: r.id_anuncio,
      idGrupo: r.id_grupo,
      titulo: r.titulo,
      contenido: r.contenido,
      fechaCreacion: r.fecha_creacion,
      nombreMateria: r.nombre_materia,
      claveGrupo: r.clave_grupo,
      nombreProfesor: r.nombre_profesor,
      apellidoPaternoProfesor: r.apellido_paterno_profesor,
    }));
  }
}
