import { useEffect, useState } from 'react';
import { teachersService } from '../services/teachers.service';
import { TeacherSchedule, TeacherGroup } from '../types/api.types';
import { ScheduleBoard } from '../components/ScheduleBoard';
import { ScheduleSlot } from '../utils/schedule';

const GROUP_COLORS = [
  'bg-blue-100 border-blue-400 text-blue-800',
  'bg-green-100 border-green-400 text-green-800',
  'bg-purple-100 border-purple-400 text-purple-800',
  'bg-orange-100 border-orange-400 text-orange-800',
  'bg-teal-100 border-teal-400 text-teal-800',
  'bg-pink-100 border-pink-400 text-pink-800',
  'bg-yellow-100 border-yellow-400 text-yellow-800',
  'bg-indigo-100 border-indigo-400 text-indigo-800',
];

export function TeacherSchedulePage() {
  const [schedule, setSchedule] = useState<TeacherSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<TeacherGroup | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const data = await teachersService.getSchedule();
        setSchedule(data);
        if (data.grupos.length > 0) {
          setSelectedGroup(data.grupos[0]);
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSchedule();
  }, []);

  const buildSlots = (s: TeacherSchedule): ScheduleSlot[] =>
    s.horarios.map((h) => {
      const groupIndex = s.grupos.findIndex((g) => g.claveGrupo === h.claveGrupo);
      return {
        day: h.diaGrupo,
        start: h.horaInicio,
        end: h.horaFin,
        materiaName: `${h.claveGrupo} – ${h.nombreMateria}`,
        room: h.nombreAula + (h.edificio ? ` (${h.edificio})` : ''),
        color: GROUP_COLORS[groupIndex >= 0 ? groupIndex % GROUP_COLORS.length : 0],
      };
    });

  if (loading) {
    return <div className="text-center py-8">Cargando horario...</div>;
  }

  if (!schedule || schedule.grupos.length === 0) {
    return <div className="text-center py-8 text-gray-500">No tienes grupos asignados</div>;
  }

  const diasOrden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Mi Horario</h2>

      {/* Vista semanal tipo tablero */}
      <div className="mb-8">
        <ScheduleBoard slots={buildSlots(schedule)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listado de grupos */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Mis Grupos ({schedule.grupos.length})</h3>
            <div className="space-y-2">
              {schedule.grupos.map((grupo, idx) => (
                <button
                  key={grupo.idGrupo}
                  onClick={() => setSelectedGroup(grupo)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedGroup?.idGrupo === grupo.idGrupo
                      ? 'border-ipn-guinda bg-ipn-guinda/10'
                      : 'border-gray-200 hover:border-ipn-guinda/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full border-2 ${GROUP_COLORS[idx % GROUP_COLORS.length]}`}
                    />
                    <span className="font-semibold text-sm">{grupo.claveGrupo}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{grupo.nombreMateria}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {grupo.cupoActual}/{grupo.cupoMax} estudiantes
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detalles del grupo seleccionado */}
        {selectedGroup && (
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800">{selectedGroup.nombreMateria}</h3>
                <p className="text-gray-600 mt-1">{selectedGroup.claveGrupo}</p>
                <p className="text-sm text-gray-500 mt-2">{selectedGroup.creditosMateria} créditos</p>
                <p className="text-sm text-gray-500">
                  Capacidad: {selectedGroup.cupoActual}/{selectedGroup.cupoMax} estudiantes
                </p>
              </div>

              {selectedGroup.horarios && selectedGroup.horarios.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Horarios</h4>
                  <div className="space-y-3">
                    {selectedGroup.horarios
                      .sort((a, b) => diasOrden.indexOf(a.dia) - diasOrden.indexOf(b.dia))
                      .map((horario, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-gray-800 capitalize">{horario.dia}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {horario.horaInicio} - {horario.horaFin}
                              </div>
                              <div className="text-sm text-gray-700 mt-2">
                                <strong>Aula:</strong> {horario.nombreAula}
                              </div>
                              {horario.edificio && (
                                <div className="text-sm text-gray-600">
                                  <strong>Edificio:</strong> {horario.edificio}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
