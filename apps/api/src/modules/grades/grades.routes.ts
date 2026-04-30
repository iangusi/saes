import { Router } from 'express';
import { getGrades } from '../students/students.controller';
import { authMiddleware, requireRole } from '../../common/middlewares/auth.middleware';

export const gradesRoutes = Router();

gradesRoutes.get('/me/grades', authMiddleware, requireRole('alumno'), getGrades);
