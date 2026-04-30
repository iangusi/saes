export interface ScheduleSlot {
  day: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  room?: string;
  materiaName?: string;
  color?: string;
}

export function parseHorarios(raw: string): ScheduleSlot[] {
  if (!raw) return [];
  // Format: lunes|07:00|08:30|A-101;miercoles|07:00|08:30|A-101
  return raw.split(';').map((part) => {
    const [day, start, end, room] = part.split('|');
    return { day: day.toLowerCase(), start, end, room };
  });
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function checkConflict(slotsA: ScheduleSlot[], slotsB: ScheduleSlot[]): boolean {
  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.day !== b.day) continue;
      
      const startA = timeToMinutes(a.start);
      const endA = timeToMinutes(a.end);
      const startB = timeToMinutes(b.start);
      const endB = timeToMinutes(b.end);

      if (startA < endB && endA > startB) return true;
    }
  }
  return false;
}

export const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
export const DAY_NAMES: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
};
