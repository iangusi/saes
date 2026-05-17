import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../common/middlewares/auth.middleware';
import { getEligibility, submitException } from './admin-exceptions.controller';

export const adminExceptionsRoutes = Router();

adminExceptionsRoutes.use(authMiddleware, requireRole('admin'));

adminExceptionsRoutes.get('/eligibility/:idUsuario', getEligibility);
adminExceptionsRoutes.post('/submit', submitException);
