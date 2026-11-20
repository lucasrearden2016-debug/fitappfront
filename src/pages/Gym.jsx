import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dropdown, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api, { showError } from '../api/client';
import { useAutosave } from '../hooks/useAutosave';
import { newExercise, uid, withKeys } from '../utils/series';
import RoutineTable from '../components/gym/RoutineTable';
import DayTabs from '../components/gym/DayTabs';
import ProgressView from '../components/gym/ProgressView';
import '../components/gym/gym.css';
import i18n from '../i18n';
import { dateFmt } from '../i18n/labels';
import { Trans, useTranslation } from 'react-i18next';

const SAVE_LABEL = { idle: '', pending: 'Sin guardar', saving: 'Guardando…', saved: 'Guardado', error: 'Error al guardar' };
const fmtDate = (d) => dateFmt(d, { day: 'numeric', month: 'short' });

// Lo que se manda al back (sin las keys locales)
const toPayload = (r) => ({
  name: r.name,
  days: r.days.map((d) => ({
    name: d.name,
    columns: d.columns,
    exercises: d.exercises.map(({ key: _key, ...e }) => e),
  })),
});

export default function Gym() {
  const { t } = useTranslation();
  const [routine, setRoutine] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // 'generate' | 'review' | 'create'
  const [dayIndex, setDayIndex] = useState(0);
  const [view, setView] = useState('table');
  const [showReview, setShowReview] = useState(true);
  const routineRef = useRef(null);

  const { status, schedule, flush } = useAutosave(
    useCallback((r) => api.put(`/routines/${r._id}`, toPayload(r)), [])
  );

  const load = useCallback(async () => {
    const [{ data: active }, { data: all }] = await Promise.all([api.get('/routines/active'), api.get('/routines')]);
    const r = withKeys(active);
    routineRef.current = r;
    setRoutine(r);
    setRoutines(all);
    setDayIndex(0);
    setShowReview(true);
  }, []);

  useEffect(() => {
    load().catch(showError).finally(() => setLoading(false));
  }, [load]);

  // Todo cambio pasa por acá: actualiza la vista y agenda el guardado
  const change = useCallback(
    (updater) => {
      const next = updater(routineRef.current);
      routineRef.current = next;
      setRoutine(next);
      schedule(next);
    },
    [schedule]
  );

  const updateDay = (i, day) => change((r) => ({ ...r, days: r.days.map((d, j) => (j === i ? day : d)) }));

  // ---------- Días ----------
  const addDay = () => {
    change((r) => ({ ...r, days: [...r.days, { name: i18n.t('Día {{n}}', { n: r.days.length + 1 }), columns: 3, exercises: [newExercise()] }] }));
    setDayIndex(routineRef.current.days.length - 1);
  };
  const renameDay = (i, name) => updateDay(i, { ...routineRef.current.days[i], name });
  const duplicateDay = (i) => {
    change((r) => {
      const copy = { ...r.days[i], name: `${r.days[i].name} (${i18n.t('copia')})`, exercises: r.days[i].exercises.map((e) => ({ ...e, key: uid() })) };
      return { ...r, days: [...r.days.slice(0, i + 1), copy, ...r.days.slice(i + 1)] };
    });
    setDayIndex(i + 1);
  };
  const deleteDay = (i) => {
    if (!confirm(t('¿Eliminar "{{name}}"?', { name: routineRef.current.days[i].name }))) return;
    change((r) => ({ ...r, days: r.days.filter((_, j) => j !== i) }));
    setDayIndex(Math.max(0, i - 1));
  };

  // ---------- Acciones ----------
  const run = async (key, fn) => {
    setBusy(key);
    try {
      await flush();
      await fn();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(null);
    }
  };

  const generate = () => {
    if (routine && !confirm(t('Se va a crear una rutina nueva con IA. La actual queda guardada en "Mis rutinas". ¿Seguimos?'))) return;
    run('generate', async () => {
      await api.post('/routines/generate');
      await load();
      toast.success(t('Rutina generada. Completá los pesos a medida que entrenás 💪'));
    });
  };

  const createBlank = () =>
    run('create', async () => {
      await api.post('/routines', { name: 'Mi rutina' });
      await load();
    });

  const activate = (id) =>
    run('create', async () => {
      await api.post(`/routines/${id}/activate`);
      await load();
    });

  const removeRoutine = () => {
    if (!confirm(t('¿Eliminar "{{name}}" y todo su historial? No se puede deshacer.', { name: routine.name }))) return;
    run('create', async () => {
      await api.delete(`/routines/${routine._id}`);
      await load();
    });
  };

  const review = () =>
    run('review', async () => {
      const { data } = await api.post(`/routines/${routine._id}/review`);
      const next = { ...routineRef.current, lastReview: data };
      routineRef.current = next;
      setRoutine(next);
      setShowReview(true);
    });

  if (loading) return <Spinner size="sm" />;

  // ---------- Sin rutina ----------
  if (!routine) {
    return (
      <div className="gym-page">
        <div className="gym-empty">
          <div className="gym-empty-icon">🏋️</div>
          <h4>{t('Armá tu rutina')}</h4>
          <p className="text-muted mb-4">
            {t('Generala con IA según tu perfil o empezá con una tabla en blanco y cargá la tuya. Después solo actualizás los pesos a medida que entrenás.')}
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <Button onClick={generate} disabled={!!busy}>
              {busy === 'generate' ? <><Spinner size="sm" /> {t('Generando…')}</> : t('✨ Generar con IA')}
            </Button>
            <Button variant="light" onClick={createBlank} disabled={!!busy}>{t('Empezar en blanco')}</Button>
          </div>
        </div>
      </div>
    );
  }

  const day = routine.days[Math.min(dayIndex, routine.days.length - 1)];
  const safeIndex = routine.days.indexOf(day);

  return (
    <div className="gym-page">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div className="flex-grow-1">
          <div className="gym-crumb">{t('Gimnasio / Rutina')}</div>
          <input
            className="gym-title"
            value={routine.name}
            maxLength={80}
            onChange={(e) => change((r) => ({ ...r, name: e.target.value }))}
            aria-label={t('Nombre de la rutina')}
          />
          <div className="gym-meta">
            <span className={`gym-badge ${routine.source === 'ai' ? 'ai' : ''}`}>
              {routine.source === 'ai' ? t('✨ Generada con IA') : t('✎ Propia')}
            </span>
            <span>{routine.days.length} {routine.days.length === 1 ? t('día') : t('días')}</span>
            {status !== 'idle' && (
              <span className={`gym-save ${status}`}>
                · <span className="dot" /> {t(SAVE_LABEL[status])}
                {status === 'error' && (
                  <button className="btn btn-link btn-sm p-0 ms-1" onClick={flush}>{t('Reintentar')}</button>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="d-flex gap-2 pt-3">
          <Button variant="light" size="sm" onClick={review} disabled={!!busy}>
            {busy === 'review' ? <><Spinner size="sm" /> {t('Analizando…')}</> : t('🧠 Pedir recomendaciones')}
          </Button>
          <Dropdown align="end">
            <Dropdown.Toggle variant="light" size="sm" disabled={!!busy}>
              {busy === 'generate' ? <Spinner size="sm" /> : '⋯'}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={generate}>{t('✨ Generar nueva con IA')}</Dropdown.Item>
              <Dropdown.Item onClick={createBlank}>{t('＋ Nueva rutina en blanco')}</Dropdown.Item>
              {routines.length > 1 && (
                <>
                  <Dropdown.Divider />
                  <Dropdown.Header>{t('Mis rutinas')}</Dropdown.Header>
                  {routines.map((r) => (
                    <Dropdown.Item key={r._id} active={r._id === routine._id} onClick={() => r._id !== routine._id && activate(r._id)}>
                      {r._id === routine._id ? '✓ ' : ''}{r.name}
                    </Dropdown.Item>
                  ))}
                </>
              )}
              <Dropdown.Divider />
              <Dropdown.Item className="text-danger" onClick={removeRoutine}>{t('🗑 Eliminar rutina')}</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {busy === 'generate' && <p className="text-muted small mt-2 mb-0">{t('Armando tu rutina con IA, puede tardar unos segundos…')}</p>}

      {/* Vistas */}
      <div className="gym-views">
        <button className={`gym-view ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}>▦ {t('Rutina')}</button>
        <button
          className={`gym-view ${view === 'progress' ? 'active' : ''}`}
          onClick={async () => {
            await flush();
            setView('progress');
          }}
        >
          ↗ {t('Progreso')}
        </button>
      </div>

      {routine.lastReview?.summary && showReview && view === 'table' && (
        <div className="gym-callout">
          <div className="gym-callout-icon">💡</div>
          <div>
            <h6>{t('Recomendaciones')} · {fmtDate(routine.lastReview.date)}</h6>
            <p>{routine.lastReview.summary}</p>
            <ul>{routine.lastReview.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <button className="gym-callout-close" onClick={() => setShowReview(false)} aria-label={t('Ocultar')}>×</button>
        </div>
      )}

      {view === 'table' ? (
        <>
          <DayTabs
            days={routine.days}
            active={safeIndex}
            onSelect={setDayIndex}
            onAdd={addDay}
            onRename={renameDay}
            onDuplicate={duplicateDay}
            onDelete={deleteDay}
          />
          <RoutineTable day={day} onChange={(d) => updateDay(safeIndex, d)} />
          <p className="gym-hint">
            <Trans i18nKey="Escribí <kbd>peso×reps</kbd> (ej. <kbd>80x10</kbd>) o solo las reps. <kbd>Enter</kbd> baja a la fila siguiente · arrastrá <kbd>⋮⋮</kbd> para reordenar · todo se guarda solo." components={{ kbd: <kbd /> }} />
          </p>
        </>
      ) : (
        <ProgressView routine={routine} dayIndex={safeIndex} onSelectDay={setDayIndex} />
      )}
    </div>
  );
}
