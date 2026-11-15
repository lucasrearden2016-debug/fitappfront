import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Guardado automático con debounce, estilo Notion.
 * schedule(valor) → guarda `delay` ms después del último cambio.
 * Si hay un guardado en curso, encola uno más con el último valor.
 */
export function useAutosave(save, delay = 800) {
  const [status, setStatus] = useState('idle'); // idle | pending | saving | saved | error
  const timer = useRef(null);
  const latest = useRef(null);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    timer.current = null;
    if (latest.current == null) return;
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    const value = latest.current;
    latest.current = null;
    inFlight.current = true;
    setStatus('saving');
    try {
      await saveRef.current(value);
      setStatus(latest.current ? 'pending' : 'saved');
    } catch {
      latest.current ??= value; // reintento con el próximo cambio o con "Reintentar"
      setStatus('error');
    } finally {
      inFlight.current = false;
      if (queued.current) {
        queued.current = false;
        flush();
      }
    }
  }, []);

  const schedule = useCallback(
    (value) => {
      latest.current = value;
      setStatus('pending');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay]
  );

  // Al salir de la página o desmontar, guarda lo pendiente
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [flush]);

  return { status, schedule, flush };
}
