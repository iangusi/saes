import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';
import { authService } from '../services/auth.service';

const studentNavItems = [
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
  { to: '/announcements', label: 'Anuncios' },
  { to: '/chatbot', label: 'Chat Bot' },
];

const teacherNavItems = [
  { to: '/teacher/dashboard', label: 'Inicio' },
  { to: '/teacher/schedule', label: 'Mi Horario' },
  { to: '/teacher/attendance', label: 'Asistencia' },
  { to: '/teacher/grades', label: 'Calificaciones' },
  { to: '/teacher/announcements', label: 'Anuncios' },
  { to: '/profile', label: 'Mi Perfil' },
  //{ to: '/chatbot', label: 'Chat Bot' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  const isTeacher = user?.roles?.includes('profesor');
  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-ipn-guinda text-white shadow-md sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded hover:bg-white/10 transition-colors"
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-lg tracking-wide">SAES 2.0</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:block truncate max-w-[180px]">
              {user?.nombre} {user?.apellidoPaterno}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-red-200 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 min-h-0">
        <nav
          className={`
            fixed top-0 left-0 h-full z-50 w-64 bg-white border-r border-gray-200 flex flex-col py-4 shadow-xl
            transition-transform duration-300 ease-in-out
            md:static md:z-auto md:w-56 md:shadow-none md:translate-x-0 md:transition-none md:py-4
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex items-center justify-between px-4 mb-4 md:hidden">
            <span className="font-bold text-ipn-guinda">SAES 2.0</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded hover:bg-gray-100"
              aria-label="Cerrar menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${location.pathname === item.to
                ? 'bg-ipn-guinda/10 text-ipn-guinda font-semibold border-r-4 border-ipn-guinda'
                : 'text-gray-700'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 sm:p-6 overflow-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
