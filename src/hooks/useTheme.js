import { useCallback, useState } from 'react';

// Tema claro/oscuro: se guarda en localStorage y se aplica en <html data-bs-theme>
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-bs-theme') || 'light');

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', next);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', next === 'dark' ? '#191919' : '#ffffff');
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* sin storage */
    }
    setTheme(next);
  }, [theme]);

  return { theme, toggle };
}
