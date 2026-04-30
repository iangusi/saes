import { Router } from 'express';
import { getStudentProfile } from './students.controller';
import { authMiddleware, requireRole } from '../../common/middlewares/auth.middleware';

export const studentsRoutes = Router();

studentsRoutes.use(authMiddleware, requireRole('alumno'));

studentsRoutes.get('/me', getStudentProfile);
