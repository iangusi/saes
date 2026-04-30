import { Router } from 'express';
import { getWithdrawalsStatus, requestWithdrawal } from './withdrawals.controller';
import { authMiddleware, requireRole } from '../../common/middlewares/auth.middleware';

export const withdrawalsRoutes = Router();

withdrawalsRoutes.use(authMiddleware, requireRole('alumno'));

withdrawalsRoutes.get('/status', getWithdrawalsStatus);
withdrawalsRoutes.post('/request', requestWithdrawal);
