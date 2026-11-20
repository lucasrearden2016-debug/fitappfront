import { lang, locale } from '../i18n';

// Números con coma o punto: "95,4" y "95.4" valen lo mismo

// Texto → número (o null si está vacío / no es número)
export function toNum(v) {
  if (v === '' || v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).trim().replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// Mientras se escribe: solo dígitos y un separador decimal
export const cleanDecimal = (s) => {
  const t = String(s).replace(/[^\d.,]/g, '');
  const i = t.search(/[.,]/);
  return i < 0 ? t : t.slice(0, i + 1) + t.slice(i + 1).replace(/[.,]/g, '');
};

// Número → texto con coma ("0,6"), sin decimales de más
export const fmtNum = (n, max = 1) =>
  n == null || n === '' ? '' : Number(n).toLocaleString(locale(), { maximumFractionDigits: max, useGrouping: false });

// Valor inicial de un input a partir de un número guardado
export const toInput = (n) => (n == null || n === '' ? '' : lang() === 'en' ? String(n) : String(n).replace('.', ','));
