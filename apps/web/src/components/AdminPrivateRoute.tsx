import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';

export function AdminPrivateRoute() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.roles.includes('admin')) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
