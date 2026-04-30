import { Router } from 'express';
import { getKardex } from '../students/students.controller';
import { authMiddleware, requireRole } from '../../common/middlewares/auth.middleware';

export const kardexRoutes = Router();

kardexRoutes.get('/me/kardex', authMiddleware, requireRole('alumno'), getKardex);
