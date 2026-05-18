import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ApiResponse } from '../types/api.types';

interface WithdrawalStatus {
  abierto: boolean;
  mensaje?: string;
  inscritas?: Array<{ id_inscripcion: number; nombre_materia: string; creditos: number; clave_grupo: string }>;
  totalCreditos?: number;
  creditosMinimos?: number;
}

export function WithdrawalsPage() {
  const [status, setStatus] = useState<WithdrawalStatus | null>(null);
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [procesando, setProcesando] = useState<number | null>(null);

  const loadStatus = async () => {
    const { data } = await api.get<ApiResponse<WithdrawalStatus>>('/withdrawals/status');
    setStatus(data.data);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleBaja = async (idInscripcion: number) => {
    if (!motivo.trim()) { setMensaje('Debes ingresar un motivo'); return; }
    setProcesando(idInscripcion);
    setMensaje('');
    try {
      await api.post('/withdrawals/request', { idInscripcion, motivo });
      setMensaje('Baja procesada correctamente');
      setMotivo('');
      await loadStatus();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al procesar baja';
      setMensaje(msg);
    } finally {
      setProcesando(null);
    }
  };

  if (!status) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Bajas de Materias</h2>

      {!status.abierto ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-500">
          {status.mensaje}
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600">
            Créditos actuales:{' '}
            <span className="font-semibold">{status.totalCreditos}</span> (mínimo:{' '}
            {status.creditosMinimos})
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de baja (obligatorio)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Escribe el motivo..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
            />
          </div>

          {mensaje && (
            <p
              className={`text-sm p-3 rounded-lg border ${
                mensaje.includes('correctamente')
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {mensaje}
            </p>
          )}

          <div className="space-y-2">
            {status.inscritas?.map((ins) => (
              <div
                key={ins.id_inscripcion}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-800">{ins.nombre_materia}</p>
                  <p className="text-xs text-gray-500">
                    Grupo: {ins.clave_grupo} · {ins.creditos} créditos
                  </p>
                </div>
                <button
                  onClick={() => handleBaja(ins.id_inscripcion)}
                  disabled={procesando === ins.id_inscripcion}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {procesando === ins.id_inscripcion ? 'Procesando...' : 'Dar de baja'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
