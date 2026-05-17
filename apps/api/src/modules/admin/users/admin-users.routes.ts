import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, requireRole } from '../../../common/middlewares/auth.middleware';
import {
  listUsers,
  getPlanes,
  getDepartamentos,
  createUser,
  importUsers,
  deactivateUser,
  blockUser,
  activateUser,
} from './admin-users.controller';

export const adminUsersRoutes = Router();

const upload = multer({ storage: multer.memoryStorage() });

adminUsersRoutes.use(authMiddleware, requireRole('admin'));

adminUsersRoutes.get('/', listUsers);
adminUsersRoutes.get('/planes', getPlanes);
adminUsersRoutes.get('/departamentos', getDepartamentos);
adminUsersRoutes.post('/', createUser);
adminUsersRoutes.post('/import', upload.single('archivo'), importUsers);
adminUsersRoutes.patch('/:id/deactivate', deactivateUser);
adminUsersRoutes.patch('/:id/block', blockUser);
adminUsersRoutes.patch('/:id/activate', activateUser);
