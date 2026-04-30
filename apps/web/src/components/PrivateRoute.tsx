import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';

export function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
