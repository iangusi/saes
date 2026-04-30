import { Router } from 'express';
import { getMe, updateEmail, updatePassword } from './users.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

export const usersRoutes = Router();

usersRoutes.use(authMiddleware);

usersRoutes.get('/me', getMe);
usersRoutes.patch('/me/email', updateEmail);
usersRoutes.patch('/me/password', updatePassword);
