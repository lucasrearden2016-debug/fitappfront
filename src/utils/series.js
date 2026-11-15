// Helpers de la tabla de rutina

export const uid = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);

export const emptySeries = () => ({ weightKg: null, reps: null, target: '' });

/**
 * Texto de la celda → serie.
 *  "100x12" | "100 x 12" | "22,5*10" | "100kg × 12" → { weightKg, reps }
 *  "12"  → solo reps (peso corporal)
 *  ""    → vacía
 */
export function parseSeries(text) {
  const nums = (text ?? '').replace(/,/g, '.').match(/\d+(\.\d+)?/g) ?? [];
  if (nums.length === 0) return { weightKg: null, reps: null };
  if (nums.length === 1) return { weightKg: null, reps: Math.round(Number(nums[0])) };
  return { weightKg: Number(nums[0]), reps: Math.round(Number(nums[1])) };
}

export function formatSeries(s) {
  if (!s?.reps && !s?.weightKg) return '';
  if (s.weightKg) return `${s.weightKg}×${s.reps ?? ''}`;
  return String(s.reps);
}

// Agrega una `key` local (no se guarda) para que React pueda reordenar filas
export const withKeys = (routine) =>
  routine && {
    ...routine,
    days: routine.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e, key: uid() })) })),
  };

export const newExercise = () => ({ key: uid(), name: '', series: [], rest: '', notes: '' });
