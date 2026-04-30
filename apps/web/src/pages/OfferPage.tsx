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

  useEffect(() => {
    offerService.getOffer().then((data) => {
      setGrupos(data);
      setLoading(false);
    });
  }, []);

  const filtrados = grupos.filter(
    (g) =>
      (g.materia.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        g.materia.clave.toLowerCase().includes(busqueda.toLowerCase()) ||
        g.profesor.toLowerCase().includes(busqueda.toLowerCase())) &&
      g.cupoDisponible > 0
  );

  const filteredForModal = useMemo((): OfferGroup[] => {
    if (!selected) return [];
    if (selected.kind === 'grupo') return grupos.filter((g) => String(g.idGrupo) === selected.key);
    if (selected.kind === 'profesor') return grupos.filter((g) => g.profesor === selected.key);
    return grupos.filter((g) => String(g.materia.id) === selected.key);
  }, [grupos, selected]);

  const modalMeta = useMemo(() => {
    if (!selected) return null;
    const kindLabel = selected.kind === 'grupo' ? 'Grupo' : selected.kind === 'profesor' ? 'Profesor' : 'Materia';
    return {
      title: `Horario: ${selected.label}`,
      description: `Filtro por ${kindLabel}.`,
    };
  }, [selected]);

  const modalSlots = useMemo((): ScheduleSlot[] => {
    if (!selected) return [];

    const colorKeyFor = (g: OfferGroup): string => {
      if (selected.kind === 'materia') return g.claveGrupo; // color por grupo
      return g.materia.nombre; // color por materia (profesor/grupo)
    };

    const colorByKey = makeColorByKey(filteredForModal.map((g) => colorKeyFor(g)));

    return filteredForModal.flatMap((g) =>
      (g.horarios ?? []).map((h) => {
        const label = `${g.materia.nombre} (${g.claveGrupo})`;
        const subtitle = `${h.aula}${h.aula ? ' • ' : ''}${g.profesor}`;
        const key = colorKeyFor(g);

        return {
          day: normalizeDay(h.dia),
          start: h.inicio,
          end: h.fin,
          room: subtitle,
          materiaName: label,
          color: colorByKey.get(key),
        };
      })
    );
  }, [filteredForModal, selected]);

  if (loading) return <p className="text-gray-500">Cargando oferta...</p>;

  return (
    <div className="max-w-5xl space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Oferta Académica</h2>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por materia, clave o profesor..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
      />

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Clave', 'Materia', 'Grupo', 'Créditos', 'Profesor', 'Cupos', 'Horario', 'Estatus'].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map((g) => (
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
                  <span
                    className={`${
                      g.cupoDisponible === 0 ? 'text-red-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
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
                      g.estatus === 'abierto'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {g.estatus}
                  </span>
                </td>
              </tr>
            ))}
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
