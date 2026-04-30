import { Router } from 'express';
import { getEvaluationStatus, getEvaluationForm, submitEvaluation } from './teaching-evaluation.controller';
import { authMiddleware, requireRole } from '../../common/middlewares/auth.middleware';

export const teachingEvaluationRoutes = Router();

teachingEvaluationRoutes.use(authMiddleware, requireRole('alumno'));

teachingEvaluationRoutes.get('/status', getEvaluationStatus);
teachingEvaluationRoutes.get('/form', getEvaluationForm);
teachingEvaluationRoutes.post('/submit', submitEvaluation);
