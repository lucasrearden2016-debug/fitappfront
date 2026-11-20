import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import pt from './pt.json';

// Las claves son los textos en español: si falta una traducción, se ve el español.
export const LANGS = [
  ['es', 'Español'],
  ['pt', 'Português'],
  ['en', 'English'],
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: {} }, en: { translation: en }, pt: { translation: pt } },
    fallbackLng: 'es',
    supportedLngs: ['es', 'pt', 'en'],
    nonExplicitSupportedLngs: true, // pt-BR → pt, en-US → en
    load: 'languageOnly',
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], lookupLocalStorage: 'lang', caches: [] },
    returnEmptyString: false,
  });

const syncHtml = (lng) => document.documentElement.setAttribute('lang', lng);
syncHtml(i18n.resolvedLanguage);
i18n.on('languageChanged', syncHtml);

export const setLanguage = (lng) => {
  try {
    localStorage.setItem('lang', lng);
  } catch {
    /* sin storage */
  }
  i18n.changeLanguage(lng);
};

export const lang = () => i18n.resolvedLanguage || 'es';
export const locale = () => ({ es: 'es-UY', pt: 'pt-BR', en: 'en-US' })[lang()];

export default i18n;
