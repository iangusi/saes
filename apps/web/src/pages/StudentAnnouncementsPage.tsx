import { useEffect, useState } from 'react';
import { studentsService } from '../services/students.service';
import { StudentAnnouncement } from '../types/api.types';

export function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentsService.getAnnouncements();
        setAnnouncements(data);
      } catch (error) {
        console.error('Error loading announcements:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Grupos únicos para el filtro
  const groups = Array.from(
    new Map(announcements.map((a) => [a.idGrupo, { id: a.idGrupo, clave: a.claveGrupo, materia: a.nombreMateria }])).values()
  );

  const filtered = filterGroup
    ? announcements.filter((a) => a.idGrupo === parseInt(filterGroup))
    : announcements;

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Anuncios de Profesores</h2>

      {announcements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
          No hay anuncios disponibles en tus materias actuales
        </div>
      ) : (
        <>
          {/* Filtro por materia */}
          {groups.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por materia</label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ipn-guinda focus:border-transparent"
              >
                <option value="">Todas las materias ({announcements.length})</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.clave} - {g.materia}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-4">
            {filtered.map((announcement) => (
              <div
                key={announcement.idAnuncio}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-lg font-semibold text-gray-800">{announcement.titulo}</h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {new Date(announcement.fechaCreacion).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-sm text-ipn-guinda font-medium mb-3">
                  {announcement.claveGrupo} · {announcement.nombreMateria} —{' '}
                  {announcement.nombreProfesor} {announcement.apellidoPaternoProfesor}
                </p>

                <p className="text-gray-700 whitespace-pre-wrap break-words">{announcement.contenido}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
