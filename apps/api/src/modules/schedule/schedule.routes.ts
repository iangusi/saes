import { Router } from 'express';
import { getSchedule } from '../students/students.controller';
import { authMiddleware, requireRole } from '../../common/middlewares/auth.middleware';

export const scheduleRoutes = Router();

scheduleRoutes.get('/me/schedule', authMiddleware, requireRole('alumno'), getSchedule);
