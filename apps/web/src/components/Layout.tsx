import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';
import { authService } from '../services/auth.service';

const navItems = [
  { to: '/dashboard', label: 'Inicio' },
  { to: '/profile', label: 'Datos Personales' },
  { to: '/kardex', label: 'Kardex' },
  { to: '/schedule', label: 'Horario' },
  { to: '/grades', label: 'Calificaciones' },
  { to: '/reenrollment', label: 'Reinscripción' },
  { to: '/withdrawals', label: 'Bajas' },
  { to: '/teaching-evaluation', label: 'Evaluación Docente' },
  { to: '/offer', label: 'Oferta' },
  { to: '/documentos', label: 'Documentos' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-ipn-guinda text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg tracking-wide">SAES 2.0</span>
          <div className="text-sm">
            {user?.nombre} {user?.apellidoPaterno}
            <button
              onClick={handleLogout}
              className="mt-auto mx-4 mb-2 px-4 py-2 text-sm text-red-600 bg-red-50 rounded text-left"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-56 bg-white border-r border-gray-200 flex flex-col py-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${location.pathname === item.to
                ? 'bg-ipn-guinda/10 text-ipn-guinda font-semibold border-r-4 border-ipn-guinda'
                : 'text-gray-700'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
