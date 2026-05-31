import { useEffect, useState } from 'react';
import { teachersService } from '../services/teachers.service';
import { TeacherSchedule, TeacherAnnouncement } from '../types/api.types';

export function TeacherAnnouncementsPage() {
  const [schedule, setSchedule] = useState<TeacherSchedule | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', contenido: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await teachersService.getSchedule();
        setSchedule(data);
        if (data.grupos.length > 0) {
          setSelectedGroupId(data.grupos[0].idGrupo);
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, []);

  // Cargar anuncios cuando se selecciona un grupo
  useEffect(() => {
    if (!selectedGroupId) return;

    const loadAnnouncements = async () => {
      try {
        const data = await teachersService.getGroupAnnouncements(selectedGroupId);
        setAnnouncements(data);
      } catch (error) {
        console.error('Error loading announcements:', error);
      }
    };

    loadAnnouncements();
  }, [selectedGroupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;

    if (!formData.titulo.trim() || !formData.contenido.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSaving(true);
    try {
      await teachersService.createAnnouncement(selectedGroupId, formData.titulo, formData.contenido);
      setFormData({ titulo: '', contenido: '' });
      setShowForm(false);
      // Recargar anuncios
      const data = await teachersService.getGroupAnnouncements(selectedGroupId);
      setAnnouncements(data);
      alert('Anuncio enviado correctamente');
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Error al enviar anuncio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!schedule || schedule.grupos.length === 0) {
    return <div className="text-center py-8 text-gray-500">No tienes grupos asignados</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Anuncios y Avisos</h2>

      {/* Selector de grupo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Grupo</label>
        <select
          value={selectedGroupId || ''}
          onChange={(e) => setSelectedGroupId(parseInt(e.target.value))}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ipn-guinda focus:border-transparent"
        >
          {schedule.grupos.map((grupo) => (
            <option key={grupo.idGrupo} value={grupo.idGrupo}>
              {grupo.claveGrupo} - {grupo.nombreMateria}
            </option>
          ))}
        </select>
      </div>

      {/* Botón de crear anuncio */}
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-ipn-guinda text-white rounded-lg hover:bg-ipn-guinda/90 font-medium"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Anuncio'}
        </button>
      </div>

      {/* Formulario de crear anuncio */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Anuncio</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: Recordatorio de Evaluación Parcial"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ipn-guinda focus:border-transparent"
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.titulo.length}/150</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contenido</label>
              <textarea
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                placeholder="Escribe el contenido del anuncio..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ipn-guinda focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Enviando...' : 'Enviar Anuncio'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ titulo: '', contenido: '' });
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de anuncios */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Anuncios Recientes ({announcements.length})
        </h3>

        {announcements.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
            No hay anuncios para este grupo
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.idAnuncio} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
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
                <p className="text-gray-700 whitespace-pre-wrap break-words">{announcement.contenido}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-gray-700">
        <p className="font-semibold mb-2">Información sobre anuncios:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Los anuncios se envían de inmediato a todos los estudiantes del grupo</li>
          <li>Puedes editar o eliminar anuncios después de crearlos</li>
          <li>Los estudiantes recibirán notificaciones de tus anuncios</li>
          <li>Usa esta función para comunicados importantes, recordatorios y avisos oficiales</li>
        </ul>
      </div>
    </div>
  );
}
