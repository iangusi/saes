import { useEffect, useState, useMemo } from 'react';
import { reenrollmentService } from '../services/reenrollment.service';
import { ScheduleBoard } from '../components/ScheduleBoard';
import { parseHorarios, checkConflict, ScheduleSlot } from '../utils/schedule';

interface EligibleGroup {
  id_grupo: number;
  id_materia: number;
  nombre_materia: string;
  creditos: number;
  semestre_plan: number;
  cupo_disponible: number;
  nombre_profesor: string;
  apellido_paterno_profesor: string;
  clave_grupo: string;
  horarios: string;
}

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-700',
  'bg-emerald-100 border-emerald-300 text-emerald-700',
  'bg-amber-100 border-amber-300 text-amber-700',
  'bg-purple-100 border-purple-300 text-purple-700',
  'bg-rose-100 border-rose-300 text-rose-700',
  'bg-cyan-100 border-cyan-300 text-cyan-700',
  'bg-orange-100 border-orange-300 text-orange-700',
];

export function ReenrollmentPage() {
  const [status, setStatus] = useState<{ estado: string; mensaje: string; cita?: unknown } | null>(null);
  const [eligibility, setEligibility] = useState<{
    grupos: EligibleGroup[];
    creditosInscritos: number;
    creditosMaximos: number;
  } | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    reenrollmentService.getStatus().then((s) => setStatus(s as typeof status));
  }, []);

  useEffect(() => {
    if (status?.estado === 'en_cita') {
      reenrollmentService.getEligibility().then((e) => setEligibility(e as typeof eligibility));
    }
  }, [status]);

  const toggleGroup = (group: EligibleGroup) => {
    if (selected.includes(group.id_grupo)) {
      setSelected((prev) => prev.filter((id) => id !== group.id_grupo));
      setMensaje('');
      return;
    }

    if (!eligibility) return;

    // Validar materia única (no permitir la misma materia en distinto grupo/profesor)
    const selectedGroups = eligibility.grupos.filter((g) => selected.includes(g.id_grupo));
    const alreadySelectedSameMateria = selectedGroups.some((g) => g.id_materia === group.id_materia);
    if (alreadySelectedSameMateria) {
      setMensaje(
        `⚠️ No puedes agregar "${group.nombre_materia}". Ya seleccionaste esa misma materia en otro grupo.`
      );
      return;
    }

    // Validar créditos
    const currentCredits =
      eligibility.creditosInscritos + selectedGroups.reduce((s, g) => s + g.creditos, 0);
    
    if (currentCredits + group.creditos > eligibility.creditosMaximos) {
      setMensaje(`⚠️ No puedes agregar "${group.nombre_materia}". Excederías el límite de ${eligibility.creditosMaximos} créditos.`);
      return;
    }

    // Validar conflictos
    const currentSlots = selectedGroups.flatMap((g) => parseHorarios(g.horarios));
    
    const newSlots = parseHorarios(group.horarios);

    if (checkConflict(currentSlots || [], newSlots)) {
      setMensaje(`⚠️ Conflicto de horario: "${group.nombre_materia}" choca con una materia ya seleccionada.`);
      return;
    }

    setSelected((prev) => [...prev, group.id_grupo]);
    setMensaje('');
  };

  const selectedSlots = useMemo((): ScheduleSlot[] => {
    if (!eligibility) return [];
    return eligibility.grupos
      .filter((g) => selected.includes(g.id_grupo))
      .flatMap((g, idx) => 
        parseHorarios(g.horarios).map(slot => ({
          ...slot,
          materiaName: g.nombre_materia,
          color: COLORS[idx % COLORS.length]
        }))
      );
  }, [selected, eligibility]);

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    if (!eligibility) return;

    // Guard extra: el usuario no debe enviar dos grupos de la misma materia
    const selectedGroups = eligibility.grupos.filter((g) => selected.includes(g.id_grupo));
    const uniqueMaterias = new Set(selectedGroups.map((g) => g.id_materia));
    if (uniqueMaterias.size !== selectedGroups.length) {
      setMensaje('⚠️ Solo puedes inscribir una vez cada materia. Revisa tu selección.');
      return;
    }

    setSubmitting(true);
    setMensaje('');
    try {
      await reenrollmentService.submit(selected);
      setMensaje('¡Reinscripción exitosa! Revisa tu correo de confirmación.');
      setStatus({ estado: 'inscrito', mensaje: 'Ya estás inscrito en este periodo.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al procesar reinscripción';
      setMensaje(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!status) return <p className="text-gray-500">Cargando...</p>;

  const estados: Record<string, JSX.Element> = {
    sin_periodo: (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-gray-500">
        {status.mensaje}
      </div>
    ),
    fuera_ventana: (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-yellow-700">
        {status.mensaje}
      </div>
    ),
    cita_pendiente: (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <p className="font-semibold text-blue-800">Tienes una cita asignada</p>
        <p className="text-sm text-blue-600 mt-1">{status.mensaje}</p>
        {status.cita ? (
          <pre className="mt-2 text-xs text-blue-500">
            {JSON.stringify(status.cita, null, 2)}
          </pre>
        ) : null}
      </div>
    ),
    cita_expirada: (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-700">{status.mensaje}</p>
        <button
          onClick={() =>
            (window.location.href = 'mailto:control.escolar@escom.ipn.mx?subject=Reinscripción')
          }
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
        >
          Contactar administración
        </button>
      </div>
    ),
    inscrito: (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-green-700 font-semibold">
        {status.mensaje}
      </div>
    ),
  };

  if (status.estado !== 'en_cita') {
    return (
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Reinscripción</h2>
        {estados[status.estado] ?? <p>{status.mensaje}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Reinscripción</h2>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
          Tu cita está activa. Selecciona las materias a inscribir.
        </div>

        {/* Tablero de Horario */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📅 Mi Horario Propuesto
          </h3>
          <div className="overflow-x-auto">
            <ScheduleBoard slots={selectedSlots} />
          </div>
          <p className="text-[11px] text-gray-400 italic">
            * El tablero muestra una vista previa de cómo quedarían tus clases seleccionadas.
          </p>
        </div>

        {eligibility && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-ipn-guinda text-white p-6 rounded-xl shadow-lg sticky top-4 z-20">
            <div className="mb-4 sm:mb-0">
              <p className="text-ipn-guinda-light text-sm opacity-80 uppercase tracking-wider font-bold">Resumen de Selección</p>
              <div className="text-2xl font-bold">
                {eligibility.creditosInscritos +
                  (eligibility.grupos
                    .filter((g) => selected.includes(g.id_grupo))
                    .reduce((s, g) => s + g.creditos, 0))}
                <span className="text-lg opacity-60 ml-1">/ {eligibility.creditosMaximos} créditos</span>
              </div>
              <p className="text-sm opacity-90">{selected.length} materias seleccionadas</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || selected.length === 0}
              className="w-full sm:w-auto bg-white text-ipn-guinda px-8 py-3 rounded-xl font-bold hover:bg-gray-100 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {submitting ? 'Procesando...' : `Confirmar Reinscripción`}
            </button>
          </div>
        )}

        {mensaje && (
          <div
            className={`text-sm p-4 rounded-xl border flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
              mensaje.includes('exitosa')
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <span className="text-lg">{mensaje.includes('exitosa') ? '✅' : '⚠️'}</span>
            {mensaje}
          </div>
        )}

        <div className="grid gap-3">
          <h3 className="text-lg font-bold text-gray-800 mt-4">Materias Disponibles</h3>
          {eligibility?.grupos.map((g) => {
            const horarios = parseHorarios(g.horarios);
            const isSelected = selected.includes(g.id_grupo);
            return (
              <label
                key={g.id_grupo}
                className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-ipn-guinda ring-2 ring-ipn-guinda/20 bg-ipn-guinda/[0.02]' 
                    : 'border-gray-200 hover:border-ipn-guinda/30 hover:shadow-md'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-ipn-guinda border-ipn-guinda text-white' : 'border-gray-300'
                }`}>
                  {isSelected && <span className="text-xs">✓</span>}
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleGroup(g)}
                  className="hidden"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-800 group-hover:text-ipn-guinda transition-colors">
                      {g.nombre_materia}
                    </p>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {g.clave_grupo}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      📦 <b>{g.creditos}</b> créditos
                    </span>
                    <span className="flex items-center gap-1">
                      🎓 Sem. <b>{g.semestre_plan}</b>
                    </span>
                    <span className="flex items-center gap-1">
                      👤 {g.nombre_profesor} {g.apellido_paterno_profesor}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {horarios.map((h, i) => (
                      <span key={i} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                        {h.day} {h.start}-{h.end} {h.room && `[${h.room}]`}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right sm:border-l sm:pl-4 min-w-[100px]">
                  <p className={`text-sm font-bold ${g.cupo_disponible < 5 ? 'text-red-500' : 'text-green-600'}`}>
                    {g.cupo_disponible} <span className="text-[10px] font-normal text-gray-400">cupos</span>
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
