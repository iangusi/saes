const COLORS = [
  'bg-blue-100 border-blue-300 text-blue-700',
  'bg-emerald-100 border-emerald-300 text-emerald-700',
  'bg-amber-100 border-amber-300 text-amber-700',
  'bg-purple-100 border-purple-300 text-purple-700',
  'bg-rose-100 border-rose-300 text-rose-700',
  'bg-cyan-100 border-cyan-300 text-cyan-700',
  'bg-orange-100 border-orange-300 text-orange-700',
];

export function normalizeDay(rawDay: string): string {
  const base = (rawDay ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const map: Record<string, string> = {
    lun: 'lunes',
    mar: 'martes',
    mie: 'miercoles',
    mié: 'miercoles',
    jue: 'jueves',
    vie: 'viernes',
    sab: 'sabado',
    sáb: 'sabado',
  };

  return map[base] ?? base;
}

export function makeColorByKey(keys: string[]): Map<string, string> {
  const uniq = Array.from(new Set((keys ?? []).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
  const map = new Map<string, string>();
  uniq.forEach((key, idx) => map.set(key, COLORS[idx % COLORS.length]));
  return map;
}

