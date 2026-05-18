import { useEffect, useMemo, useState } from 'react';
import { studentsService } from '../services/students.service';
import { ScheduleSlot as ApiScheduleSlot } from '../types/api.types';
import { ScheduleBoard } from '../components/ScheduleBoard';
import { ScheduleSlot as BoardScheduleSlot } from '../utils/schedule';
import { makeColorByKey, normalizeDay } from '../utils/scheduleView';

export function SchedulePage() {
  const [horario, setHorario] = useState<ApiScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const slots = useMemo((): BoardScheduleSlot[] => {
    const colorByMateria = makeColorByKey((horario ?? []).map((h) => h.nombre_materia).filter(Boolean));

    return (horario ?? [])
      .map((s) => ({
        day: normalizeDay(s.dia_semana),
        start: s.hora_inicio,
        end: s.hora_fin,
        room: s.nombre_aula,
        materiaName: s.nombre_materia,
        color: s.nombre_materia ? colorByMateria.get(s.nombre_materia) : undefined,
      }))
      .filter((s) => Boolean(s.day && s.start && s.end));
  }, [horario]);

  useEffect(() => {
    studentsService.getSchedule().then(({ horario }) => {
      setHorario(horario ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">Cargando horario...</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Horario</h2>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">📅 Mi Horario</h3>
        <div className="overflow-x-auto">
          <ScheduleBoard slots={slots} />
        </div>
        <p className="text-[11px] text-gray-400 italic">
          * Vista semanal (L-V) del horario registrado.
        </p>
      </div>
    </div>
  );
}
