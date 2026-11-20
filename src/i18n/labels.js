import i18n, { lang } from './index';
import { fmtNum } from '../utils/num';

// Los datos guardados usan claves en español (tipos de comida, días, secciones, unidades).
// Acá se traducen solo para mostrar.
const t = (k, o) => i18n.t(k, o);
const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DAY_LABEL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const dayIdx = (day) => DAYS.findIndex((d) => norm(day).startsWith(d));
export const dayLabel = (day) => (dayIdx(day) >= 0 ? t(DAY_LABEL[dayIdx(day)]) : day);
export const dayShort = (day) => (dayIdx(day) >= 0 ? t(DAY_SHORT[dayIdx(day)]) : day.slice(0, 3));

// "desayuno" → "Breakfast" / "Café da manhã" (si es un tipo inventado, se muestra tal cual)
export const mealTypeLabel = (type = '') => t(norm(type) === 'colacion' ? 'colación' : type.toLowerCase());

export const sectionLabel = (s) => t(s);

const UNIT_PLURAL = { unidad: 'unidades', cda: 'cdas', cdita: 'cditas', taza: 'tazas' };
export function unitLabel(unit, amount = 1) {
  if (!unit) return '';
  if (unit === 'a gusto') return t('a gusto');
  if (amount > 1 && UNIT_PLURAL[unit]) return t(UNIT_PLURAL[unit]);
  if (['g', 'ml', 'cda', 'cdita', 'taza', 'unidad'].includes(unit)) return t(unit);
  return unit; // unidades propias del alimento ("rebanada", "feta")
}

// Cantidad de un ingrediente para mostrar, en el idioma actual
export function qty(ing) {
  if (ing.amount == null && ing.quantity) return ing.quantity; // datos viejos
  if (!ing.amount || ing.unit === 'a gusto') return t('a gusto');
  return `${fmtNum(ing.amount)} ${unitLabel(ing.unit, ing.amount)}`;
}

export const dateFmt = (d, opts) =>
  new Date(d).toLocaleDateString({ es: 'es', pt: 'pt-BR', en: 'en-US' }[lang()], opts);

export const brandLabel = (b) => (b === 'Genérico' ? t('Genérico') : b);
