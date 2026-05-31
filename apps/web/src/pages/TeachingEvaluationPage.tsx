import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ApiResponse } from '../types/api.types';

interface EvalStatus {
  abierto: boolean;
  mensaje?: string;
  inscripciones?: Array<{
    id_inscripcion: number;
    nombre_materia: string;
    clave_grupo: string;
    nombre_profesor: string;
    apellido_paterno_profesor: string;
    ya_evaluado: number;
  }>;
  idEncuesta?: number;
}

interface Pregunta {
  id_pregunta: number;
  texto: string;
  tipo: string;
}

export function TeachingEvaluationPage() {
  const [status, setStatus] = useState<EvalStatus | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, { num?: number; texto?: string }>>({});
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    api.get<ApiResponse<EvalStatus>>('/teaching-evaluation/status').then(({ data }) => {
      setStatus(data.data);
    });
  }, []);

  const abrirFormulario = async (idInscripcion: number) => {
    setSeleccionada(idInscripcion);
    setRespuestas({});
    const { data } = await api.get<ApiResponse<{ preguntas: Pregunta[] }>>(
      '/teaching-evaluation/form'
    );
    setPreguntas(data.data.preguntas);
  };

  const handleSubmit = async () => {
    if (!seleccionada) return;
    const resp = Object.entries(respuestas).map(([id, val]) => ({
      idPregunta: parseInt(id),
      respuestaNumerica: val.num,
      respuestaTexto: val.texto,
    }));

    try {
      await api.post('/teaching-evaluation/submit', {
        idInscripcion: seleccionada,
        respuestas: resp,
      });
      setMensaje('Evaluación enviada correctamente');
      setSeleccionada(null);
      // Marcar como evaluada localmente
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              inscripciones: prev.inscripciones?.map((i) =>
                i.id_inscripcion === seleccionada ? { ...i, ya_evaluado: 1 } : i
              ),
            }
          : prev
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al enviar evaluación';
      setMensaje(msg);
    }
  };

  if (!status) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Evaluación Docente</h2>

      {!status.abierto ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-500">
          {status.mensaje}
        </div>
      ) : (
        <>
          {mensaje && (
            <p className="text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg p-3">
              {mensaje}
            </p>
          )}

          {status.inscripciones?.map((ins) => (
            <div key={ins.id_inscripcion} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{ins.nombre_materia}</p>
                  <p className="text-sm text-gray-500">
                    {ins.nombre_profesor} {ins.apellido_paterno_profesor} · Grupo {ins.clave_grupo}
                  </p>
                </div>
                {ins.ya_evaluado ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Evaluado
                  </span>
                ) : (
                  <button
                    onClick={() => abrirFormulario(ins.id_inscripcion)}
                    className="text-sm bg-ipn-guinda text-white px-3 py-1.5 rounded-lg hover:bg-ipn-guinda/90"
                  >
                    Evaluar
                  </button>
                )}
              </div>

              {seleccionada === ins.id_inscripcion && (
                <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                  {preguntas.map((p) => (
                    <div key={p.id_pregunta}>
                      <p className="text-sm font-medium text-gray-700 mb-2">{p.texto}</p>
                      {p.tipo === 'escala' ? (
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() =>
                                setRespuestas((r) => ({
                                  ...r,
                                  [p.id_pregunta]: { ...r[p.id_pregunta], num: n },
                                }))
                              }
                              className={`w-10 h-10 rounded-full text-sm font-semibold border-2 ${
                                respuestas[p.id_pregunta]?.num === n
                                  ? 'bg-ipn-guinda text-white border-ipn-guinda'
                                  : 'border-gray-300 text-gray-600 hover:border-ipn-guinda'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          rows={2}
                          onChange={(e) =>
                            setRespuestas((r) => ({
                              ...r,
                              [p.id_pregunta]: { texto: e.target.value },
                            }))
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
                        />
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleSubmit}
                    className="bg-ipn-guinda text-white px-4 py-2 rounded-lg text-sm hover:bg-ipn-guinda/90"
                  >
                    Enviar evaluación
                  </button>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
