import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandlerMiddleware } from './common/middlewares/error-handler.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { studentsRoutes } from './modules/students/students.routes';
import { kardexRoutes } from './modules/kardex/kardex.routes';
import { scheduleRoutes } from './modules/schedule/schedule.routes';
import { gradesRoutes } from './modules/grades/grades.routes';
import { reenrollmentRoutes } from './modules/reenrollment/reenrollment.routes';
import { withdrawalsRoutes } from './modules/withdrawals/withdrawals.routes';
import { teachingEvaluationRoutes } from './modules/teaching-evaluation/teaching-evaluation.routes';
import { offerRoutes } from './modules/offer/offer.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { periodsRoutes } from './modules/admin/periods/periods.routes';
import { adminUsersRoutes } from './modules/admin/users/admin-users.routes';
import { adminOfferRoutes } from './modules/admin/offer/admin-offer.routes';
import { adminNotificationsRoutes } from './modules/admin/notifications/admin-notifications.routes';
import { adminExceptionsRoutes } from './modules/admin/exceptions/admin-exceptions.routes';
import { chatbotRoutes } from './modules/chatbot/chatbot.routes';
import { teachersRoutes } from './modules/teachers/teachers.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/students', kardexRoutes);
app.use('/api/students', scheduleRoutes);
app.use('/api/students', gradesRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/reenrollment', reenrollmentRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);
app.use('/api/teaching-evaluation', teachingEvaluationRoutes);
app.use('/api/offer', offerRoutes);
app.use('/api/admin', auditRoutes);
app.use('/api/admin/periods', periodsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/offer', adminOfferRoutes);
app.use('/api/admin/notifications', adminNotificationsRoutes);
app.use('/api/admin/exceptions', adminExceptionsRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.use(errorHandlerMiddleware);

export { app };
