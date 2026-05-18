import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';

export function IndexPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Redirigir según el rol
    if (user.roles?.includes('profesor')) {
      navigate('/teacher/dashboard');
    } else {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return <div className="flex items-center justify-center h-screen">Cargando...</div>;
}
