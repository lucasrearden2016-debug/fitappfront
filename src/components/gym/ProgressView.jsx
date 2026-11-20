import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import api, { showError } from '../../api/client';
import DayTabs from './DayTabs';
import { dateFmt } from '../../i18n/labels';
import { fmtNum } from '../../utils/num';
import { useTranslation } from 'react-i18next';

const fmtDate = (d) => dateFmt(d, { day: 'numeric', month: 'short' });
const fmtSet = (p) => (p.weightKg ? `${fmtNum(p.weightKg)}×${p.reps}` : `${p.reps} reps`);
const fmtPct = (n) => `${n > 0 ? '+' : ''}${fmtNum(n)}%`;
const trend = (n) => (n > 0 ? 'up' : n < 0 ? 'down' : 'flat');

export default function ProgressView({ routine, dayIndex, onSelectDay }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  // Se vuelve a pedir cada vez que se abre la pestaña (la tabla pudo cambiar)
  useEffect(() => {
    api.get(`/routines/${routine._id}/progress`).then(({ data }) => setData(data)).catch(showError);
  }, [routine._id]);

  const day = routine.days[dayIndex];
  const rows = day.exercises
    .filter((e) => e.name.trim())
    .map((e) => ({ name: e.name.trim(), p: data?.[e.name.trim()] }));
  const withChange = rows.filter((r) => r.p?.changePct != null);
  const maxAbs = Math.max(5, ...withChange.map((r) => Math.abs(r.p.changePct)));
  const avg = withChange.length ? withChange.reduce((a, r) => a + r.p.changePct, 0) / withChange.length : null;
  const best = withChange.reduce((b, r) => (!b || r.p.changePct > b.p.changePct ? r : b), null);

  return (
    <>
      <DayTabs days={routine.days} active={dayIndex} onSelect={onSelectDay} editable={false} />

      {!data ? (
        <Spinner size="sm" />
      ) : (
        <>
          <div className="gp-summary">
            <div>
              <div className="gp-stat-label">{t('Progreso promedio')}</div>
              <div className={`gp-stat-value ${avg != null ? trend(avg) : ''}`}>{avg != null ? fmtPct(avg) : '—'}</div>
            </div>
            <div>
              <div className="gp-stat-label">{t('Mejor ejercicio')}</div>
              <div className="gp-stat-value" style={{ fontSize: '1rem', paddingTop: '0.3rem' }}>
                {best && best.p.changePct > 0 ? best.name : '—'}
              </div>
            </div>
            <div>
              <div className="gp-stat-label">{t('Ejercicios con historial')}</div>
              <div className="gp-stat-value">{withChange.length}/{rows.length}</div>
            </div>
          </div>

          {rows.length === 0 && <p className="text-muted small mt-3">{t('Este día todavía no tiene ejercicios.')}</p>}

          {rows.map(({ name, p }) => (
            <div className="gp-row" key={name}>
              <div>
                <div className="gp-name">{name}</div>
                <div className="gp-sub">
                  {!p && t('Sin datos todavía')}
                  {p && p.sessions === 1 && `${fmtSet(p.last)} · ${t('1 registro')}`}
                  {p && p.sessions > 1 && (
                    <>
                      {fmtSet(p.first)} → {fmtSet(p.last)} · {fmtDate(p.first.date)} – {fmtDate(p.last.date)}
                      {p.weightChangePct != null && p.weightChangePct !== 0 && ` · ${t('peso')} ${fmtPct(p.weightChangePct)}`}
                    </>
                  )}
                </div>
              </div>
              <div className="gp-track" title={p?.metric === 'reps' ? t('Comparando reps máximas') : t('Comparando fuerza estimada (1RM)')}>
                {p?.changePct != null && (
                  <div
                    className={`gp-fill ${trend(p.changePct)}`}
                    style={{ width: `${Math.max(3, (Math.abs(p.changePct) / maxAbs) * 100)}%` }}
                  />
                )}
              </div>
              <div className={`gp-pct ${p?.changePct != null ? trend(p.changePct) : 'none'}`}>
                {p?.changePct != null ? fmtPct(p.changePct) : '—'}
              </div>
            </div>
          ))}

          <p className="gym-hint mt-3">
            {t('El % compara tu primer registro con el último. Con peso se usa la fuerza estimada (1RM: peso y reps juntos), así 100×12 y 105×10 cuentan como esfuerzos parecidos; sin peso se comparan las reps. Se registra solo cada vez que cambiás un valor en la tabla.')}
          </p>
        </>
      )}
    </>
  );
}
