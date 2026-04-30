import { Router } from 'express';
import { login, forgotPassword, resetPassword, logout } from './auth.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/forgot-password', forgotPassword);
authRoutes.post('/reset-password', resetPassword);
authRoutes.post('/logout', authMiddleware, logout);
