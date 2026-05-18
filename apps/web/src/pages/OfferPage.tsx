import { useEffect, useMemo, useState } from 'react';
import { offerService } from '../services/offer.service';
import { OfferGroup } from '../types/api.types';
import { Modal } from '../components/Modal';
import { ScheduleBoard } from '../components/ScheduleBoard';
import { ScheduleSlot } from '../utils/schedule';
import { makeColorByKey, normalizeDay } from '../utils/scheduleView';

type SelectedFilter =
  | { kind: 'grupo'; key: string; label: string }
  | { kind: 'profesor'; key: string; label: string }
  | { kind: 'materia'; key: string; label: string };

export function OfferPage() {
  const [grupos, setGrupos] = useState<OfferGroup[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedFilter | null>(null);
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroSemestre, setFiltroSemestre] = useState('');
  const [filtroCarrera, setFiltroCarrera] = useState('');

  useEffect(() => {
    offerService.getOffer().then((data) => {
      setGrupos(data);
      setLoading(false);
    });
  }, []);

  const opcionesGrupo = useMemo(
    () => [...new Set(grupos.map((g) => g.claveGrupo))].sort((a, b) => a.localeCompare(b, 'es')),
    [grupos]
  );
  const opcionesSemestre = useMemo(
    () =>
      [...new Set(grupos.map((g) => g.materia.semestre).filter((s): s is number => s != null))].sort(
        (a, b) => a - b
      ),
    [grupos]
  );
  const opcionesCarrera = useMemo(
    () =>
      [...new Set(grupos.flatMap((g) => g.materia.carreras ?? []))].sort((a, b) =>
        a.localeCompare(b, 'es')
      ),
    [grupos]
  );

  const filtrados = useMemo(
    () =>
      grupos.filter((g) => {
        const q = busqueda.toLowerCase();
        const matchText =
          !q ||
          g.materia.nombre.toLowerCase().includes(q) ||
          g.materia.clave.toLowerCase().includes(q) ||
          g.profesor.toLowerCase().includes(q) ||
          g.claveGrupo.toLowerCase().includes(q);

        const matchGrupo = !filtroGrupo || g.claveGrupo === filtroGrupo;
        const matchSemestre =
          !filtroSemestre || String(g.materia.semestre ?? '') === filtroSemestre;
        const matchCarrera = !filtroCarrera || (g.materia.carreras ?? []).includes(filtroCarrera);

        return matchText && matchGrupo && matchSemestre && matchCarrera && g.cupoDisponible > 0;
      }),
    [grupos, busqueda, filtroGrupo, filtroSemestre, filtroCarrera]
  );

  const filteredForModal = useMemo((): OfferGroup[] => {
    if (!selected) return [];
    if (selected.kind === 'grupo') return grupos.filter((g) => String(g.idGrupo) === selected.key);
    if (selected.kind === 'profesor') return grupos.filter((g) => g.profesor === selected.key);
    return grupos.filter((g) => String(g.materia.id) === selected.key);
  }, [grupos, selected]);

  const modalMeta = useMemo(() => {
    if (!selected) return null;
    const kindLabel =
      selected.kind === 'grupo' ? 'Grupo' : selected.kind === 'profesor' ? 'Profesor' : 'Materia';
    return { title: `Horario: ${selected.label}`, description: `Filtro por ${kindLabel}.` };
  }, [selected]);

  const modalSlots = useMemo((): ScheduleSlot[] => {
    if (!selected) return [];
    const colorKeyFor = (g: OfferGroup) =>
      selected.kind === 'materia' ? g.claveGrupo : g.materia.nombre;
    const colorByKey = makeColorByKey(filteredForModal.map(colorKeyFor));
    return filteredForModal.flatMap((g) =>
      (g.horarios ?? []).map((h) => ({
        day: normalizeDay(h.dia),
        start: h.inicio,
        end: h.fin,
        room: `${h.aula}${h.aula ? ' • ' : ''}${g.profesor}`,
        materiaName: `${g.materia.nombre} (${g.claveGrupo})`,
        color: colorByKey.get(colorKeyFor(g)),
      }))
    );
  }, [filteredForModal, selected]);

  if (loading) return <p className="text-gray-500">Cargando oferta...</p>;

  return (
    <div className="max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Oferta Académica</h2>

      {/* Buscador y selects */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por materia, profesor o grupo..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
        />

        <select
          value={filtroGrupo}
          onChange={(e) => setFiltroGrupo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda bg-white"
        >
          <option value="">Grupo: Todos</option>
          {opcionesGrupo.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={filtroSemestre}
          onChange={(e) => setFiltroSemestre(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda bg-white"
          disabled={opcionesSemestre.length === 0}
        >
          <option value="">Semestre: Todos</option>
          {opcionesSemestre.map((s) => (
            <option key={s} value={String(s)}>Semestre {s}</option>
          ))}
        </select>

        <select
          value={filtroCarrera}
          onChange={(e) => setFiltroCarrera(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda bg-white"
          disabled={opcionesCarrera.length === 0}
        >
          <option value="">Carrera: Todas</option>
          {opcionesCarrera.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Clave', 'Materia', 'Grupo', 'Créditos', 'Profesor', 'Cupos', 'Horario', 'Estatus'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  No hay grupos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filtrados.map((g) => (
                <tr key={g.idGrupo} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{g.materia.clave}</td>
                  <td className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => setSelected({ kind: 'materia', key: String(g.materia.id), label: g.materia.nombre })}
                      className="text-left text-ipn-guinda hover:underline focus:outline-none focus:ring-2 focus:ring-ipn-guinda/40 rounded"
                    >
                      {g.materia.nombre}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected({ kind: 'grupo', key: String(g.idGrupo), label: g.claveGrupo })}
                      className="text-left text-ipn-guinda hover:underline focus:outline-none focus:ring-2 focus:ring-ipn-guinda/40 rounded"
                    >
                      {g.claveGrupo}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">{g.materia.creditos}</td>
                  <td className="px-4 py-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelected({ kind: 'profesor', key: g.profesor, label: g.profesor })}
                      className="text-left text-ipn-guinda hover:underline focus:outline-none focus:ring-2 focus:ring-ipn-guinda/40 rounded"
                    >
                      {g.profesor}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={g.cupoDisponible === 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                      {g.cupoDisponible}/{g.cupoMax}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {g.horarios.map((h) => (
                      <div key={`${h.dia}-${h.inicio}`}>
                        <span className="capitalize">{h.dia}</span> {h.inicio}–{h.fin}{' '}
                        <span className="text-gray-400">{h.aula}</span>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        g.estatus === 'abierto' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {g.estatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(selected)}
        title={modalMeta?.title ?? 'Horario'}
        description={modalMeta?.description}
        onClose={() => setSelected(null)}
      >
        {modalSlots.length === 0 ? (
          <p className="text-sm text-gray-500">Sin horarios para este filtro.</p>
        ) : (
          <ScheduleBoard slots={modalSlots} />
        )}
      </Modal>
    </div>
  );
}
