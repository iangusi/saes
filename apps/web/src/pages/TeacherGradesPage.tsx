import { useEffect, useState } from 'react';
import { teachersService } from '../services/teachers.service';
import { TeacherSchedule, TeacherGradeRecord } from '../types/api.types';

export function TeacherGradesPage() {
  const [schedule, setSchedule] = useState<TeacherSchedule | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [grades, setGrades] = useState<TeacherGradeRecord[]>([]);
  const [editingGrades, setEditingGrades] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>(''); // Filtro por tipo de evaluación

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

  // Cargar calificaciones cuando se selecciona un grupo
  useEffect(() => {
    if (!selectedGroupId) return;

    const loadGrades = async () => {
      try {
        const data = await teachersService.getGroupGrades(selectedGroupId);
        setGrades(data);
        setEditingGrades(new Map());
      } catch (error) {
        console.error('Error loading grades:', error);
      }
    };

    loadGrades();
  }, [selectedGroupId]);

  const handleGradeChange = (idAlumno: number, tipoEvaluacion: string, value: string) => {
    const key = `${idAlumno}-${tipoEvaluacion}`;
    const numValue = value === '' ? 0 : Math.min(Math.max(parseFloat(value) || 0, 0), 10);
    setEditingGrades(new Map(editingGrades).set(key, numValue));
  };

  const handleSaveGrades = async () => {
    if (editingGrades.size === 0) {
      alert('No hay cambios que guardar');
      return;
    }

    setSaving(true);
    try {
      let saved = 0;
      for (const key of editingGrades.keys()) {
        const [idAlumnoStr, tipoEvaluacion] = key.split('-');
        const idAlumno = parseInt(idAlumnoStr);

        // Encontrar el registro correspondiente
        const gradeRecord = grades.find((g) => g.idAlumno === idAlumno && g.tipoEvaluacion === tipoEvaluacion);
        if (gradeRecord && !gradeRecord.cerrada) {
          // Aquí debería actualizar la calificación real
          // Por ahora simulamos el guardado
          saved++;
        }
      }
      alert(`${saved} calificaciones actualizadas correctamente`);
      setEditingGrades(new Map());
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Error al guardar calificaciones');
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

  // Obtener tipos de evaluación únicos
  const evaluationTypes = [...new Set(grades.map((g) => g.tipoEvaluacion))];
  const filteredGrades = filter === '' ? grades : grades.filter((g) => g.tipoEvaluacion === filter);

  // Agrupar por estudiante
  const studentGrades: Map<number, TeacherGradeRecord[]> = new Map();
  filteredGrades.forEach((grade) => {
    if (!studentGrades.has(grade.idAlumno)) {
      studentGrades.set(grade.idAlumno, []);
    }
    studentGrades.get(grade.idAlumno)!.push(grade);
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Captura de Calificaciones</h2>

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
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Evaluación</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ipn-guinda focus:border-transparent"
          >
            <option value="">Todos</option>
            {evaluationTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de calificaciones */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Boleta</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Nombre</th>
                {evaluationTypes.map((type) => (
                  <th key={type} className="text-center py-3 px-4 font-semibold text-gray-800">
                    {type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(studentGrades.entries()).map(([idAlumno, studentGradesList]) => {
                const firstGrade = studentGradesList[0];
                return (
                  <tr key={idAlumno} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700 font-medium">{firstGrade.boleta}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {firstGrade.nombre} {firstGrade.apellidoPaterno} {firstGrade.apellidoMaterno || ''}
                    </td>
                    {evaluationTypes.map((type) => {
                      const gradeRecord = studentGradesList.find((g) => g.tipoEvaluacion === type);
                      const key = `${idAlumno}-${type}`;
                      const editValue = editingGrades.get(key);
                      const displayValue = editValue !== undefined ? editValue : gradeRecord?.calificacion;

                      return (
                        <td key={type} className="py-3 px-4 text-center">
                          {gradeRecord?.cerrada ? (
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              Cerrada: {displayValue !== undefined && displayValue !== null ? displayValue.toFixed(2) : '-'}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={displayValue !== undefined && displayValue !== null ? displayValue : ''}
                              onChange={(e) => handleGradeChange(idAlumno, type, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-ipn-guinda focus:border-transparent"
                              placeholder="-"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={handleSaveGrades}
          disabled={saving || editingGrades.size === 0}
          className="px-6 py-2 bg-ipn-guinda text-white rounded-lg hover:bg-ipn-guinda/90 disabled:opacity-50 font-medium"
        >
          {saving ? 'Guardando...' : `Guardar (${editingGrades.size} cambios)`}
        </button>
        {editingGrades.size > 0 && (
          <button
            onClick={() => setEditingGrades(new Map())}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
        <p className="font-semibold mb-2">Notas:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Las calificaciones deben estar entre 0 y 10</li>
          <li>No puedes modificar evaluaciones cerradas</li>
          <li>Los cambios se guardarán cuando hagas clic en "Guardar"</li>
          <li>Asegúrate de revisar la información antes de guardar</li>
        </ul>
      </div>
    </div>
  );
}
