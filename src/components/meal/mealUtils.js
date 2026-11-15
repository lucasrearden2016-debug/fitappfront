const STYLES = {
  desayuno: { icon: '☀️', bg: '#fff8c5', fg: '#7d4e00' },
  almuerzo: { icon: '🍽️', bg: '#dafbe1', fg: '#116329' },
  merienda: { icon: '☕', bg: '#ffeff7', fg: '#99286e' },
  cena: { icon: '🌙', bg: '#ddf4ff', fg: '#0550ae' },
  snack: { icon: '🍎', bg: '#f1f1ef', fg: '#57534e' },
};

const normalize = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const mealStyle = (type) => {
  const t = normalize(type);
  const key = Object.keys(STYLES).find((k) => t.includes(k)) ?? 'snack';
  return STYLES[key];
};

const WEEK = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Índice del día de hoy dentro del plan (o 0 si no lo encuentra)
export const todayIndex = (days) => {
  const today = WEEK[new Date().getDay()];
  const i = days.findIndex((d) => normalize(d.day).startsWith(today));
  return i >= 0 ? i : 0;
};

export const isToday = (day) => normalize(day).startsWith(WEEK[new Date().getDay()]);

export const shortDay = (day) => day.slice(0, 3);

export const sumMacros = (meals) =>
  meals.reduce(
    (a, m) => ({
      calories: a.calories + (m.calories || 0),
      protein: a.protein + (m.protein || 0),
      carbs: a.carbs + (m.carbs || 0),
      fat: a.fat + (m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
