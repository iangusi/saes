import { useEffect, useState } from 'react';
import { studentsService } from '../services/students.service';
import { GradeRow } from '../types/api.types';

export function GradesPage() {
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentsService.getGrades().then((data) => {
      setGrades(data);
      setLoading(false);
    });
  }, []);

  // Agrupar por materia
  const porMateria: Record<string, GradeRow[]> = {};
  for (const g of grades) {
    if (!porMateria[g.nombre_materia]) porMateria[g.nombre_materia] = [];
    porMateria[g.nombre_materia].push(g);
  }

  if (loading) return <p className="text-gray-500">Cargando calificaciones...</p>;

  return (
    <div className="max-w-4xl space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Calificaciones</h2>

      {Object.entries(porMateria).length === 0 && (
        <p className="text-gray-500">No hay calificaciones registradas en el periodo activo.</p>
      )}

      {Object.entries(porMateria).map(([materia, rows]) => (
        <div key={materia} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between">
            <span className="font-semibold text-gray-800">{materia}</span>
            <span className="text-sm text-gray-500">
              {rows[0].nombre_profesor} {rows[0].apellido_paterno_profesor} · Grupo{' '}
              {rows[0].clave_grupo}
            </span>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase bg-gray-50">
                <th className="px-4 py-2 text-left">Evaluación</th>
                <th className="px-4 py-2 text-center">Calificación</th>
                <th className="px-4 py-2 text-center">Estado captura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.tipo_evaluacion}>
                  <td className="px-4 py-3 capitalize">{r.tipo_evaluacion}</td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {r.calificacion !== null ? r.calificacion : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.cerrada
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {r.cerrada ? 'Cerrada' : 'Abierta'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
