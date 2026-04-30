import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { studentsService } from '../services/students.service';
import { KardexResponse } from '../types/api.types';

function semaforo(promedio: number) {
  if (promedio >= 8) return 'text-green-600';
  if (promedio >= 6) return 'text-yellow-500';
  return 'text-red-600';
}

export function KardexPage() {
  const [kardex, setKardex] = useState<KardexResponse | null>(null);

  useEffect(() => {
    studentsService.getKardex().then(setKardex);
  }, []);

  if (!kardex) return <p className="text-gray-500">Cargando kardex...</p>;

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Kardex Académico</h2>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Promedio general</p>
          <p className={`text-4xl font-bold ${semaforo(kardex.promedio)}`}>
            {kardex.promedio.toFixed(2)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Avance del plan</p>
          <p className="text-4xl font-bold text-blue-600">{kardex.avancePorcentaje}%</p>
          <div className="mt-2 h-2 bg-gray-100 rounded-full">
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${kardex.avancePorcentaje}%` }}
            />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Materias aprobadas</p>
          <p className="text-4xl font-bold text-gray-800">
            {kardex.materiasAprobadas}
            <span className="text-lg text-gray-400">/{kardex.totalMaterias}</span>
          </p>
        </div>
      </div>

      {/* Gráfica por semestre */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Comportamiento por semestre</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={kardex.porPeriodo}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="promedio_periodo" stroke="#6d1b34" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla de materias */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <h3 className="font-semibold text-gray-700 p-4 border-b border-gray-100">
          Historial de materias
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Clave', 'Materia', 'Sem.', 'Periodo', 'Calificación', 'Tipo', 'Resultado'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kardex.materias.map((m) => (
                <tr key={`${m.id_materia}-${m.nombre_periodo}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.clave_materia}</td>
                  <td className="px-4 py-3">{m.nombre_materia}</td>
                  <td className="px-4 py-3 text-center">{m.semestre_plan}</td>
                  <td className="px-4 py-3 text-xs">{m.nombre_periodo}</td>
                  <td className="px-4 py-3 font-semibold text-center">
                    {m.calificacion_final ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">{m.tipo_acreditacion}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.resultado === 'aprobado'
                          ? 'bg-green-100 text-green-700'
                          : m.resultado === 'reprobado'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {m.resultado}
                    </span>
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
