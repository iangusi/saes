import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../common/middlewares/auth.middleware';
import {
  getAllPeriods,
  getPeriodDetail,
  getAllProcessTypes,
  createProcessType,
  updateProcessType,
  deleteProcessType,
  createPeriod,
  updatePeriod,
  deletePeriod,
  finalizePeriod,
  getProcessWindows,
  createProcessWindow,
  updateProcessWindow,
  deleteProcessWindow,
  getAppointments,
  generateAppointments,
  createManualAppointment,
  deleteAllAppointments,
} from './periods.controller';

export const periodsRoutes = Router();

periodsRoutes.use(authMiddleware, requireRole('admin'));

periodsRoutes.get('/', getAllPeriods);
periodsRoutes.post('/', createPeriod);

periodsRoutes.get('/process-types', getAllProcessTypes);
periodsRoutes.post('/process-types', createProcessType);
periodsRoutes.put('/process-types/:tid', updateProcessType);
periodsRoutes.delete('/process-types/:tid', deleteProcessType);

periodsRoutes.get('/:id', getPeriodDetail);
periodsRoutes.put('/:id', updatePeriod);
periodsRoutes.delete('/:id', deletePeriod);
periodsRoutes.post('/:id/finalize', finalizePeriod);

periodsRoutes.get('/:id/processes', getProcessWindows);
periodsRoutes.post('/:id/processes', createProcessWindow);
periodsRoutes.put('/:id/processes/:pid', updateProcessWindow);
periodsRoutes.delete('/:id/processes/:pid', deleteProcessWindow);

periodsRoutes.get('/:id/appointments', getAppointments);
periodsRoutes.post('/:id/appointments/generate', generateAppointments);
periodsRoutes.post('/:id/appointments/manual', createManualAppointment);
periodsRoutes.delete('/:id/appointments', deleteAllAppointments);
