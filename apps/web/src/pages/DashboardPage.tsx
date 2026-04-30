import { Link } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';

const accesos = [
  { to: '/profile', titulo: 'Datos Personales', desc: 'Consulta y edita tu información', color: 'bg-blue-50 border-blue-200' },
  { to: '/kardex', titulo: 'Kardex', desc: 'Historial académico y promedio', color: 'bg-green-50 border-green-200' },
  { to: '/schedule', titulo: 'Horario', desc: 'Tu horario del semestre actual', color: 'bg-purple-50 border-purple-200' },
  { to: '/grades', titulo: 'Calificaciones', desc: 'Calificaciones del periodo activo', color: 'bg-yellow-50 border-yellow-200' },
  { to: '/reenrollment', titulo: 'Reinscripción', desc: 'Inscripción al próximo semestre', color: 'bg-ipn-guinda/5 border-ipn-guinda/20' },
  { to: '/withdrawals', titulo: 'Bajas', desc: 'Baja de materias del semestre', color: 'bg-red-50 border-red-200' },
  { to: '/teaching-evaluation', titulo: 'Evaluación Docente', desc: 'Evalúa a tus profesores', color: 'bg-orange-50 border-orange-200' },
  { to: '/offer', titulo: 'Oferta Académica', desc: 'Materias y grupos disponibles', color: 'bg-teal-50 border-teal-200' },
];

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-1">
        Bienvenido, {user?.nombre}
      </h2>
      <p className="text-gray-500 mb-6">Selecciona una opción para continuar</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {accesos.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`border rounded-xl p-5 hover:shadow-md transition-shadow ${item.color}`}
          >
            <h3 className="font-semibold text-gray-800 mb-1">{item.titulo}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
