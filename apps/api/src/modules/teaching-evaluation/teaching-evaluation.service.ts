import { TeachingEvaluationRepository } from './teaching-evaluation.repository';
import { StudentsRepository } from '../students/students.repository';
import { AuditService } from '../audit/audit.service';
import { SubmitEvaluationDto } from './teaching-evaluation.schema';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../../common/errors/AppError';

export class TeachingEvaluationService {
  private readonly repo = new TeachingEvaluationRepository();
  private readonly studentRepo = new StudentsRepository();
  private readonly audit = new AuditService();

  async getStatus(idUsuario: number) {
    const student = await this.studentRepo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const window = await this.repo.getActiveWindow();
    const now = new Date();

    if (
      !window ||
      !window.activo ||
      now < new Date(window.fecha_inicio) ||
      now > new Date(window.fecha_fin)
    ) {
      return { abierto: false, mensaje: 'El periodo de evaluación docente no está activo.' };
    }

    const inscripciones = await this.repo.getInscripcionesAlumno(
      student.id_alumno,
      window.id_encuesta
    );

    return {
      abierto: true,
      inscripciones,
      idEncuesta: window.id_encuesta,
    };
  }

  async getForm(idUsuario: number) {
    const student = await this.studentRepo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const window = await this.repo.getActiveWindow();
    const now = new Date();

    if (!window || !window.activo || now < new Date(window.fecha_inicio) || now > new Date(window.fecha_fin)) {
      throw new ForbiddenError('El periodo de evaluación docente no está activo');
    }

    const [inscripciones, preguntas] = await Promise.all([
      this.repo.getInscripcionesAlumno(student.id_alumno, window.id_encuesta),
      this.repo.getPreguntas(window.id_encuesta),
    ]);

    return { inscripciones, preguntas };
  }

  async submit(idUsuario: number, dto: SubmitEvaluationDto, ip: string): Promise<void> {
    const student = await this.studentRepo.findByUserId(idUsuario);
    if (!student) throw new NotFoundError('Alumno no encontrado');

    const window = await this.repo.getActiveWindow();
    const now = new Date();

    if (!window || !window.activo || now < new Date(window.fecha_inicio) || now > new Date(window.fecha_fin)) {
      throw new ForbiddenError('El periodo de evaluación docente no está activo');
    }

    // Validar que la inscripción pertenece al alumno
    const inscripciones = await this.repo.getInscripcionesAlumno(
      student.id_alumno,
      window.id_encuesta
    );

    const inscripcion = inscripciones.find((i) => i.id_inscripcion === dto.idInscripcion);
    if (!inscripcion) {
      throw new AppError('La inscripción no pertenece a este alumno', 422);
    }

    const yaEvaluado = await this.repo.hasAlreadyEvaluated(dto.idInscripcion, window.id_encuesta);
    if (yaEvaluado) {
      throw new ConflictError('Ya evaluaste a este profesor en este periodo');
    }

    const respuestas = dto.respuestas.map((r) => ({
      idPregunta: r.idPregunta,
      idInscripcion: dto.idInscripcion,
      respuestaNumerica: r.respuestaNumerica,
      respuestaTexto: r.respuestaTexto,
    }));

    await this.repo.saveRespuestas(respuestas);

    await this.audit.log({
      idUsuario,
      accion: 'evaluacion_docente',
      modulo: 'teaching-evaluation',
      descripcion: `Evaluación docente enviada. Inscripción: ${dto.idInscripcion}`,
      ipOrigen: ip,
      metadata: { idInscripcion: dto.idInscripcion, idEncuesta: window.id_encuesta },
    });
  }
}
