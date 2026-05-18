import { Router } from 'express';
import {
  getTeacherProfile,
  getTeacherSchedule,
  getGroupStudents,
  getGroupGrades,
  recordAttendance,
  updateGrade,
  createAnnouncement,
  getGroupAnnouncements,
} from './teachers.controller';
import { authMiddleware, requireRole } from '../../common/middlewares/auth.middleware';

export const teachersRoutes = Router();

// Middleware para todas las rutas
teachersRoutes.use(authMiddleware, requireRole('profesor'));

// Perfil del profesor
teachersRoutes.get('/me', getTeacherProfile);

// Horario del profesor
teachersRoutes.get('/me/schedule', getTeacherSchedule);

// Estudiantes del grupo
teachersRoutes.get('/groups/:groupId/students', getGroupStudents);

// Calificaciones del grupo
teachersRoutes.get('/groups/:groupId/grades', getGroupGrades);

// Registrar asistencia
teachersRoutes.post('/attendance', recordAttendance);

// Actualizar calificación
teachersRoutes.put('/grades', updateGrade);

// Anuncios
teachersRoutes.post('/announcements', createAnnouncement);
teachersRoutes.get('/groups/:groupId/announcements', getGroupAnnouncements);
