import { Router } from 'express';
import { getStatus, getEligibility, submit } from './reenrollment.controller';
import { authMiddleware, requireRole } from '../../common/middlewares/auth.middleware';

export const reenrollmentRoutes = Router();

reenrollmentRoutes.use(authMiddleware, requireRole('alumno'));

reenrollmentRoutes.get('/status', getStatus);
reenrollmentRoutes.get('/eligibility', getEligibility);
reenrollmentRoutes.post('/submit', submit);
