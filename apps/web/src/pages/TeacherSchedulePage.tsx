import { useEffect, useState } from 'react';
import { teachersService } from '../services/teachers.service';
import { TeacherSchedule, TeacherGroup } from '../types/api.types';

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Listado de grupos */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Mis Grupos ({schedule.grupos.length})</h3>
            <div className="space-y-2">
              {schedule.grupos.map((grupo) => (
                <button
                  key={grupo.idGrupo}
                  onClick={() => setSelectedGroup(grupo)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedGroup?.idGrupo === grupo.idGrupo
                      ? 'border-ipn-guinda bg-ipn-guinda/10'
                      : 'border-gray-200 hover:border-ipn-guinda/50'
                  }`}
                >
                  <div className="font-semibold text-sm">{grupo.claveGrupo}</div>
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

      {/* Tabla de vista semanal */}
      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Vista por Día</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Día</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Hora</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Grupo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Materia</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Aula</th>
              </tr>
            </thead>
            <tbody>
              {schedule.horarios
                .sort((a, b) => diasOrden.indexOf(a.diaGrupo) - diasOrden.indexOf(b.diaGrupo))
                .map((horario, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 capitalize font-medium text-gray-800">{horario.diaGrupo}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {horario.horaInicio} - {horario.horaFin}
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{horario.claveGrupo}</td>
                    <td className="py-3 px-4 text-gray-600">{horario.nombreMateria}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {horario.nombreAula}
                      {horario.edificio && ` (${horario.edificio})`}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
