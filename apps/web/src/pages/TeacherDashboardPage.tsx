import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../state/auth.store';
import { teachersService } from '../services/teachers.service';
import { TeacherProfile } from '../types/api.types';

export function TeacherDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await teachersService.getProfile();
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  const accesos = [
    {
      to: '/teacher/schedule',
      titulo: 'Mi Horario',
      desc: 'Consulta tus grupos y horarios',
      color: 'bg-purple-50 border-purple-200',
      icon: '📅',
    },
    {
      to: '/teacher/attendance',
      titulo: 'Asistencia',
      desc: 'Registra asistencia de estudiantes',
      color: 'bg-blue-50 border-blue-200',
      icon: '✓',
    },
    {
      to: '/teacher/grades',
      titulo: 'Calificaciones',
      desc: 'Captura y modifica calificaciones',
      color: 'bg-yellow-50 border-yellow-200',
      icon: '📊',
    },
    {
      to: '/teacher/announcements',
      titulo: 'Anuncios',
      desc: 'Envía avisos a tus grupos',
      color: 'bg-green-50 border-green-200',
      icon: '📢',
    },
    {
      to: '/profile',
      titulo: 'Mi Perfil',
      desc: 'Información personal',
      color: 'bg-ipn-guinda/5 border-ipn-guinda/20',
      icon: '👤',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          Bienvenido, {user?.nombre} {user?.apellidoPaterno}
        </h2>
        {profile && (
          <p className="text-gray-500 text-sm">
            {profile.numeroEmpleado} • {profile.departamento}
          </p>
        )}
        <p className="text-gray-500 mt-2">Selecciona una opción para continuar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accesos.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`border rounded-xl p-5 hover:shadow-md transition-shadow flex items-start gap-3 ${item.color}`}
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">{item.titulo}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
