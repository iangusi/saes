import { useEffect, useState } from 'react';
import { teachersService } from '../services/teachers.service';
import { TeacherSchedule, StudentFromGroup } from '../types/api.types';

export function TeacherAttendancePage() {
  const [schedule, setSchedule] = useState<TeacherSchedule | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentFromGroup[]>([]);
  const [attendance, setAttendance] = useState<Map<number, { presente: boolean; justificada: boolean }>>(new Map());
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
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

  // Cargar estudiantes cuando se selecciona un grupo
  useEffect(() => {
    if (!selectedGroupId) return;

    const loadStudents = async () => {
      try {
        const data = await teachersService.getGroupStudents(selectedGroupId);
        setStudents(data);
        // Inicializar asistencia
        const newAttendance = new Map();
        data.forEach((student) => {
          newAttendance.set(student.idAlumno, { presente: true, justificada: false });
        });
        setAttendance(newAttendance);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };

    loadStudents();
  }, [selectedGroupId]);

  const handleAttendanceChange = (idAlumno: number, field: 'presente' | 'justificada', value: boolean) => {
    const current = attendance.get(idAlumno) || { presente: true, justificada: false };
    setAttendance(new Map(attendance).set(idAlumno, { ...current, [field]: value }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedGroupId) return;

    setSaving(true);
    try {
      const asistencias = Array.from(attendance.entries()).map(([idAlumno, data]) => ({
        idAlumno,
        presente: data.presente,
        justificada: data.justificada,
      }));

      await teachersService.recordAttendance(selectedGroupId, fecha, asistencias);
      alert('Asistencia registrada correctamente');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error al guardar asistencia');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (present: boolean) => {
    const newAttendance = new Map(attendance);
    students.forEach((student) => {
      newAttendance.set(student.idAlumno, { presente: present, justificada: false });
    });
    setAttendance(newAttendance);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!schedule || schedule.grupos.length === 0) {
    return <div className="text-center py-8 text-gray-500">No tienes grupos asignados</div>;
  }

  const selectedGroup = schedule.grupos.find((g) => g.idGrupo === selectedGroupId);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Registro de Asistencia</h2>

      {/* Selectores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grupo</label>
          <select
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ipn-guinda focus:border-transparent"
          >
            {schedule.grupos.map((grupo) => (
              <option key={grupo.idGrupo} value={grupo.idGrupo}>
                {grupo.claveGrupo} - {grupo.nombreMateria}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ipn-guinda focus:border-transparent"
          />
        </div>
      </div>

      {/* Información del grupo */}
      {selectedGroup && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-800">
            <strong>{selectedGroup.nombreMateria}</strong> ({selectedGroup.claveGrupo}) • {students.length} estudiantes
          </p>
        </div>
      )}

      {/* Botones de acciones rápidas */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => handleSelectAll(true)}
          className="px-4 py-2 bg-green-100 text-green-800 border border-green-300 rounded-lg hover:bg-green-200 text-sm font-medium"
        >
          Marcar Todos Presentes
        </button>
        <button
          onClick={() => handleSelectAll(false)}
          className="px-4 py-2 bg-red-100 text-red-800 border border-red-300 rounded-lg hover:bg-red-200 text-sm font-medium"
        >
          Marcar Todos Ausentes
        </button>
      </div>

      {/* Tabla de estudiantes */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Boleta</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Nombre</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-800">Presente</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-800">Justificada</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const att = attendance.get(student.idAlumno) || { presente: true, justificada: false };
                return (
                  <tr key={student.idAlumno} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700 font-medium">{student.boleta}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {student.nombre} {student.apellidoPaterno} {student.apellidoMaterno || ''}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={att.presente}
                        onChange={(e) => handleAttendanceChange(student.idAlumno, 'presente', e.target.checked)}
                        className="w-4 h-4 text-green-600"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={att.justificada}
                        onChange={(e) => handleAttendanceChange(student.idAlumno, 'justificada', e.target.checked)}
                        disabled={att.presente}
                        className="w-4 h-4 text-blue-600 disabled:opacity-50"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={handleSaveAttendance}
          disabled={saving}
          className="px-6 py-2 bg-ipn-guinda text-white rounded-lg hover:bg-ipn-guinda/90 disabled:opacity-50 font-medium"
        >
          {saving ? 'Guardando...' : 'Guardar Asistencia'}
        </button>
      </div>
    </div>
  );
}
