import { useEffect, useState, useMemo } from 'react';
import {
  adminUsersService,
  adminExceptionsService,
  AdminUser,
  ExceptionEligibilityResult,
  ExceptionGroup,
} from '../../services/admin.service';
import { parseHorarios, checkConflict } from '../../utils/schedule';

type Phase = 'search' | 'eligibility' | 'success';

const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-700',
  'bg-emerald-100 border-emerald-300 text-emerald-700',
  'bg-amber-100 border-amber-300 text-amber-700',
  'bg-purple-100 border-purple-300 text-purple-700',
  'bg-rose-100 border-rose-300 text-rose-700',
  'bg-cyan-100 border-cyan-300 text-cyan-700',
];

export function ExceptionsPage() {
  const [phase, setPhase] = useState<Phase>('search');

  // Fase 1
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fase 2
  const [selectedStudent, setSelectedStudent] = useState<AdminUser | null>(null);
  const [eligibility, setEligibility] = useState<ExceptionEligibilityResult | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fase 3
  const [gruposInscritos, setGruposInscritos] = useState(0);

  // Debounce búsqueda de alumnos
  useEffect(() => {
    if (!searchQuery.trim()) {
      setStudents([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await adminUsersService.listUsers({ search: searchQuery, rol: 'alumno' });
        setStudents(data);
      } catch {
        setStudents([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStudent = async (student: AdminUser) => {
    setSelectedStudent(student);
    setEligibilityLoading(true);
    setEligibilityError('');
    setSelectedGroups([]);
    setGroupFilter('');
    try {
      const data = await adminExceptionsService.getEligibility(student.id_usuario);
      setEligibility(data);
      setPhase('eligibility');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al cargar elegibilidad';
      setEligibilityError(msg);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const toggleGroup = (group: ExceptionGroup) => {
    if (selectedGroups.includes(group.id_grupo)) {
      setSelectedGroups((prev) => prev.filter((id) => id !== group.id_grupo));
      setSubmitError('');
      return;
    }
    if (!eligibility) return;
    const alreadySelectedGroups = eligibility.grupos.filter((g) =>
      selectedGroups.includes(g.id_grupo)
    );
    if (alreadySelectedGroups.some((g) => g.id_materia === group.id_materia)) {
      setSubmitError(
        `Ya seleccionaste "${group.nombre_materia}" en otro grupo. Solo puedes inscribir una vez cada materia.`
      );
      return;
    }
    const currentSlots = alreadySelectedGroups.flatMap((g) => parseHorarios(g.horarios));
    if (checkConflict(currentSlots, parseHorarios(group.horarios))) {
      setSubmitError(`Conflicto de horario: "${group.nombre_materia}" choca con una materia ya seleccionada.`);
      return;
    }
    setSelectedGroups((prev) => [...prev, group.id_grupo]);
    setSubmitError('');
  };

  const filteredGroups = useMemo(() => {
    if (!eligibility) return [];
    const q = groupFilter.toLowerCase();
    if (!q) return eligibility.grupos;
    return eligibility.grupos.filter(
      (g) =>
        g.nombre_materia.toLowerCase().includes(q) ||
        g.clave_grupo.toLowerCase().includes(q)
    );
  }, [eligibility, groupFilter]);

  const handleSubmit = async () => {
    if (!selectedStudent || selectedGroups.length === 0) return;
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const result = await adminExceptionsService.submit({
        idUsuario: selectedStudent.id_usuario,
        grupos: selectedGroups,
      });
      setGruposInscritos(result.gruposInscritos);
      setPhase('success');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al procesar la excepción';
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setPhase('search');
    setSearchQuery('');
    setStudents([]);
    setSelectedStudent(null);
    setEligibility(null);
    setEligibilityError('');
    setSelectedGroups([]);
    setSubmitError('');
    setGruposInscritos(0);
  };

  // ── Fase 3: Éxito ─────────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Excepciones</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3">
          <p className="text-green-700 font-semibold text-lg">
            Inscripción de excepción completada
          </p>
          <p className="text-green-600 text-sm">
            Se inscribieron <strong>{gruposInscritos}</strong> grupo(s) para{' '}
            <strong>
              {selectedStudent?.nombre} {selectedStudent?.apellido_paterno}
            </strong>
            .
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-5 py-2 bg-ipn-guinda text-white text-sm font-medium rounded-lg hover:bg-ipn-guinda/90 transition-colors"
        >
          Realizar otra excepción
        </button>
      </div>
    );
  }

  // ── Fase 2: Selección de grupos ───────────────────────────────────────────
  if (phase === 'eligibility' && eligibility) {
    const { alumno } = eligibility;
    return (
      <div className="max-w-5xl mx-auto space-y-5 pb-24">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-ipn-guinda transition-colors"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Excepciones</h1>
        </div>

        {/* Banner alumno */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-center shadow-sm">
          <div className="w-10 h-10 rounded-full bg-ipn-guinda text-white flex items-center justify-center font-bold text-lg">
            {alumno.nombre.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800">
              {alumno.nombre} {alumno.apellido_paterno} {alumno.apellido_materno ?? ''}
            </p>
            <p className="text-sm text-gray-500">
              {alumno.boleta} · {alumno.nombre_carrera} · Sem. {alumno.semestre_actual}
            </p>
            <p className="text-xs text-gray-400">{alumno.nombre_plan}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Créditos ya inscritos</p>
            <p className="text-xl font-bold text-gray-800">{eligibility.creditosInscritos}</p>
          </div>
        </div>

        {/* Advertencia de modo excepción */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-800 text-sm flex gap-3 items-start">
          <span className="text-xl leading-none">⚠️</span>
          <div>
            <p className="font-semibold">Modo excepción activo</p>
            <p className="mt-0.5 text-amber-700">
              Se omiten restricciones de cita, créditos mínimos/máximos y rango de semestres.
              Esta acción queda registrada en la bitácora de auditoría.
            </p>
          </div>
        </div>

        {/* Filtro */}
        <div>
          <input
            type="text"
            placeholder="Filtrar por nombre de materia o clave de grupo..."
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
          />
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
            <span>⚠️</span> {submitError}
          </div>
        )}

        {/* Lista de grupos */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-gray-700">
            Grupos disponibles ({filteredGroups.length})
          </h3>
          {filteredGroups.length === 0 && (
            <p className="text-gray-400 text-sm py-4 text-center">
              No se encontraron grupos con ese criterio.
            </p>
          )}
          {filteredGroups.map((g, idx) => {
            const horarios = parseHorarios(g.horarios);
            const isSelected = selectedGroups.includes(g.id_grupo);
            const colorClass = COLORS[idx % COLORS.length];
            return (
              <label
                key={g.id_grupo}
                className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-ipn-guinda ring-2 ring-ipn-guinda/20 bg-ipn-guinda/[0.02]'
                    : 'border-gray-200 hover:border-ipn-guinda/30 hover:shadow-md'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-ipn-guinda border-ipn-guinda text-white' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <span className="text-xs">✓</span>}
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleGroup(g)}
                  className="hidden"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-gray-800 group-hover:text-ipn-guinda transition-colors">
                      {g.nombre_materia}
                    </p>
                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex-shrink-0">
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
                      <span
                        key={i}
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${colorClass}`}
                      >
                        {h.day} {h.start}-{h.end} {h.room && `[${h.room}]`}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right sm:border-l sm:pl-4 min-w-[90px]">
                  <p
                    className={`text-sm font-bold ${
                      g.cupo_disponible < 5 ? 'text-red-500' : 'text-green-600'
                    }`}
                  >
                    {g.cupo_disponible}{' '}
                    <span className="text-[10px] font-normal text-gray-400">cupos</span>
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Barra sticky de acción */}
        <div className="fixed bottom-0 left-0 right-0 bg-ipn-guinda text-white shadow-2xl z-30">
          <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-ipn-guinda-light text-xs opacity-80 uppercase tracking-wider font-bold">
                Excepción — {alumno.boleta}
              </p>
              <p className="text-xl font-bold">
                {selectedGroups.length}{' '}
                <span className="text-base font-normal opacity-70">
                  materia{selectedGroups.length !== 1 ? 's' : ''} seleccionada
                  {selectedGroups.length !== 1 ? 's' : ''}
                </span>
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitLoading || selectedGroups.length === 0}
              className="w-full sm:w-auto bg-white text-ipn-guinda px-8 py-3 rounded-xl font-bold hover:bg-gray-100 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {submitLoading ? 'Procesando...' : 'Confirmar inscripción de excepción'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Fase 1: Búsqueda de alumno ────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Excepciones</h1>
      <p className="text-gray-500 text-sm">
        Selecciona un alumno para realizar su reinscripción sin restricciones de cita, créditos
        o rango de semestres.
      </p>

      {eligibilityError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {eligibilityError}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar alumno por nombre, boleta o correo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
        />
        {searchLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Buscando...
          </span>
        )}
      </div>

      {eligibilityLoading && (
        <p className="text-gray-500 text-sm animate-pulse">Cargando grupos disponibles...</p>
      )}

      {students.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {students.map((s) => (
            <button
              key={s.id_usuario}
              onClick={() => handleSelectStudent(s)}
              className="w-full text-left px-4 py-3 hover:bg-ipn-guinda/5 transition-colors border-b border-gray-100 last:border-0 focus:outline-none focus:bg-ipn-guinda/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {s.nombre.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {s.nombre} {s.apellido_paterno} {s.apellido_materno ?? ''}
                  </p>
                  <p className="text-xs text-gray-500">{s.identificador}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!searchLoading && searchQuery.trim() && students.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">
          No se encontraron alumnos con ese criterio.
        </p>
      )}
    </div>
  );
}
