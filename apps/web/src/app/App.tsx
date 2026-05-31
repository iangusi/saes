import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from '../components/PrivateRoute';
import { AdminPrivateRoute } from '../components/AdminPrivateRoute';
import { Layout } from '../components/Layout';
import { AdminLayout } from '../components/AdminLayout';
import { LoginPage } from '../pages/LoginPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { IndexPage } from '../pages/IndexPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { KardexPage } from '../pages/KardexPage';
import { SchedulePage } from '../pages/SchedulePage';
import { GradesPage } from '../pages/GradesPage';
import { ReenrollmentPage } from '../pages/ReenrollmentPage';
import { WithdrawalsPage } from '../pages/WithdrawalsPage';
import { TeachingEvaluationPage } from '../pages/TeachingEvaluationPage';
import { OfferPage } from '../pages/OfferPage';
import { DocumentosPage } from '../pages/DocumentosPage';
import { PeriodsPage } from '../pages/admin/PeriodsPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { OfferAdminPage } from '../pages/admin/OfferAdminPage';
import { ExceptionsPage } from '../pages/admin/ExceptionsPage';
import { NotificationsPage } from '../pages/admin/NotificationsPage';
import { TeacherDashboardPage } from '../pages/TeacherDashboardPage';
import { TeacherSchedulePage } from '../pages/TeacherSchedulePage';
import { TeacherAttendancePage } from '../pages/TeacherAttendancePage';
import { TeacherGradesPage } from '../pages/TeacherGradesPage';
import { TeacherAnnouncementsPage } from '../pages/TeacherAnnouncementsPage';
import { StudentAnnouncementsPage } from '../pages/StudentAnnouncementsPage';
import { ChatbotPage } from '../pages/ChatbotPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ── Rutas compartidas: alumno, profesor y admin ── */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard"          element={<Layout><DashboardPage /></Layout>} />
        <Route path="/profile"            element={<Layout><ProfilePage /></Layout>} />
        <Route path="/kardex"             element={<Layout><KardexPage /></Layout>} />
        <Route path="/schedule"           element={<Layout><SchedulePage /></Layout>} />
        <Route path="/grades"             element={<Layout><GradesPage /></Layout>} />
        <Route path="/reenrollment"       element={<Layout><ReenrollmentPage /></Layout>} />
        <Route path="/withdrawals"        element={<Layout><WithdrawalsPage /></Layout>} />
        <Route path="/teaching-evaluation" element={<Layout><TeachingEvaluationPage /></Layout>} />
        <Route path="/offer"              element={<Layout><OfferPage /></Layout>} />
        <Route path="/documentos"         element={<Layout><DocumentosPage /></Layout>} />
        <Route path="/chatbot"            element={<Layout><ChatbotPage /></Layout>} />

        {/* ── Rutas de profesor ── */}
        <Route path="/teacher/dashboard"    element={<Layout><TeacherDashboardPage /></Layout>} />
        <Route path="/teacher/schedule"     element={<Layout><TeacherSchedulePage /></Layout>} />
        <Route path="/teacher/attendance"   element={<Layout><TeacherAttendancePage /></Layout>} />
        <Route path="/teacher/grades"       element={<Layout><TeacherGradesPage /></Layout>} />
        <Route path="/teacher/announcements" element={<Layout><TeacherAnnouncementsPage /></Layout>} />
        <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
        <Route path="/kardex" element={<Layout><KardexPage /></Layout>} />
        <Route path="/schedule" element={<Layout><SchedulePage /></Layout>} />
        <Route path="/grades" element={<Layout><GradesPage /></Layout>} />
        <Route path="/reenrollment" element={<Layout><ReenrollmentPage /></Layout>} />
        <Route path="/withdrawals" element={<Layout><WithdrawalsPage /></Layout>} />
        <Route path="/teaching-evaluation" element={<Layout><TeachingEvaluationPage /></Layout>} />
        <Route path="/offer" element={<Layout><OfferPage /></Layout>} />
        <Route path="/documentos" element={<Layout><DocumentosPage /></Layout>} />
        <Route path="/announcements" element={<Layout><StudentAnnouncementsPage /></Layout>} />

        {/* Rutas para Profesor */}
        <Route path="/teacher/dashboard" element={<Layout><TeacherDashboardPage /></Layout>} />
        <Route path="/teacher/schedule" element={<Layout><TeacherSchedulePage /></Layout>} />
        <Route path="/teacher/attendance" element={<Layout><TeacherAttendancePage /></Layout>} />
        <Route path="/teacher/grades" element={<Layout><TeacherGradesPage /></Layout>} />
        <Route path="/teacher/announcements" element={<Layout><TeacherAnnouncementsPage /></Layout>} />
        <Route path="/chatbot" element={<Layout><ChatbotPage /></Layout>} />
      </Route>

      {/* ── Rutas exclusivas de administrador ── */}
      <Route element={<AdminPrivateRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/periods" replace />} />
        <Route path="/admin/periods"       element={<AdminLayout><PeriodsPage /></AdminLayout>} />
        <Route path="/admin/users"         element={<AdminLayout><UsersPage /></AdminLayout>} />
        <Route path="/admin/offer"         element={<AdminLayout><OfferAdminPage /></AdminLayout>} />
        <Route path="/admin/notifications" element={<AdminLayout><NotificationsPage /></AdminLayout>} />
        <Route path="/admin/exceptions"    element={<AdminLayout><ExceptionsPage /></AdminLayout>} />
        <Route path="/admin/exceptions" element={<AdminLayout><ExceptionsPage /></AdminLayout>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
