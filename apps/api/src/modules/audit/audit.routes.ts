import { Router } from 'express';
import { getBitacora } from './audit.controller';
import { authMiddleware, requireRole } from '../../common/middlewares/auth.middleware';

export const auditRoutes = Router();

auditRoutes.get('/bitacora', authMiddleware, requireRole('admin', 'coordinador'), getBitacora);
