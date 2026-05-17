import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';
import { authService } from '../services/auth.service';

const adminNavItems = [
  { to: '/admin/periods', label: 'Periodos' },
  { to: '/admin/users', label: 'Usuarios' },
  { to: '/admin/offer', label: 'Oferta Académica' },
  { to: '/admin/exceptions', label: 'Excepciones' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
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
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg tracking-wide">SAES 2.0</span>
            <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded">
              ADMINISTRADOR
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>
              {user?.nombre} {user?.apellidoPaterno}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-red-200 bg-red-900/40 hover:bg-red-900/60 rounded transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-56 bg-gray-900 text-gray-100 flex flex-col py-4">
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Panel Admin
          </p>
          {adminNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-2.5 text-sm transition-colors ${
                location.pathname.startsWith(item.to)
                  ? 'bg-ipn-guinda text-white font-semibold border-l-4 border-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-6 bg-gray-50 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
