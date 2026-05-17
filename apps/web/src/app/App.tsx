import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from '../components/PrivateRoute';
import { AdminPrivateRoute } from '../components/AdminPrivateRoute';
import { Layout } from '../components/Layout';
import { AdminLayout } from '../components/AdminLayout';
import { LoginPage } from '../pages/LoginPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Rutas de alumno */}
      <Route element={<PrivateRoute />}>
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
      </Route>

      {/* Rutas de administrador */}
      <Route element={<AdminPrivateRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/periods" replace />} />
        <Route path="/admin/periods" element={<AdminLayout><PeriodsPage /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout><UsersPage /></AdminLayout>} />
        <Route path="/admin/offer" element={<AdminLayout><OfferAdminPage /></AdminLayout>} />
        <Route path="/admin/notifications" element={<AdminLayout><NotificationsPage /></AdminLayout>} />
        <Route path="/admin/exceptions" element={<AdminLayout><ExceptionsPage /></AdminLayout>} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
