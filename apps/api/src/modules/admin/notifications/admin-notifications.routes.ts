import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../common/middlewares/auth.middleware';
import { getCatalogs, previewDestinatarios, sendNotification } from './admin-notifications.controller';

export const adminNotificationsRoutes = Router();

adminNotificationsRoutes.use(authMiddleware, requireRole('admin'));

adminNotificationsRoutes.get('/catalogs', getCatalogs);
adminNotificationsRoutes.post('/preview', previewDestinatarios);
adminNotificationsRoutes.post('/send', sendNotification);
