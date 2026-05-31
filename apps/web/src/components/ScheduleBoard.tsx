import { ScheduleSlot, timeToMinutes, DAYS, DAY_NAMES } from '../utils/schedule';

interface ScheduleBoardProps {
  slots: ScheduleSlot[];
}

const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

export function ScheduleBoard({ slots }: ScheduleBoardProps) {
  const getPosition = (time: string) => {
    const minutes = timeToMinutes(time) - START_HOUR * 60;
    return (minutes / TOTAL_MINUTES) * 100;
  };

  const getHeight = (start: string, end: string) => {
    const duration = timeToMinutes(end) - timeToMinutes(start);
    return (duration / TOTAL_MINUTES) * 100;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[600px] shadow-sm min-w-[480px]">
      <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b bg-gray-50">
        <div className="p-2 border-r"></div>
        {DAYS.slice(0, 5).map((day) => (
          <div key={day} className="p-2 text-center text-xs font-bold text-gray-500 border-r last:border-r-0">
            {DAY_NAMES[day]}
          </div>
        ))}
      </div>

      <div className="flex-1 relative overflow-y-auto">
        {/* Horas de fondo */}
        <div className="absolute inset-0 grid grid-cols-[60px_1fr]">
          <div className="border-r bg-gray-50/50">
            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
              <div
                key={i}
                className="text-[10px] text-gray-400 text-right pr-2 border-b last:border-b-0"
                style={{ height: `${100 / (END_HOUR - START_HOUR + 1)}%` }}
              >
                {START_HOUR + i}:00
              </div>
            ))}
          </div>
          <div className="relative">
             {/* Líneas horizontales */}
             {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-b border-gray-100"
                style={{ top: `${((i + 1) * 60 / TOTAL_MINUTES) * 100}%` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Slots de materias */}
        <div className="absolute inset-0 grid grid-cols-[60px_repeat(5,1fr)] pointer-events-none">
          <div className=""></div>
          {DAYS.slice(0, 5).map((day) => (
            <div key={day} className="relative border-r last:border-r-0">
              {slots
                .filter((s) => s.day === day)
                .map((slot, idx) => (
                  <div
                    key={idx}
                    className={`absolute left-1 right-1 rounded p-1 text-[10px] leading-tight border shadow-sm pointer-events-auto transition-all hover:z-10 ${
                        slot.color || 'bg-ipn-guinda/10 border-ipn-guinda/30 text-ipn-guinda'
                    }`}
                    style={{
                      top: `${getPosition(slot.start)}%`,
                      height: `${getHeight(slot.start, slot.end)}%`,
                    }}
                    title={`${slot.materiaName}\n${slot.start} - ${slot.end}\n${slot.room || ''}`}
                  >
                    <div className="font-bold truncate">{slot.materiaName}</div>
                    <div className="opacity-80">{slot.room}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
