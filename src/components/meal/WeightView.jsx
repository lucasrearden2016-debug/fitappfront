import { useEffect, useState } from 'react';
import { Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { toast } from 'react-toastify';
import api, { showError } from '../../api/client';
import { cleanDecimal, fmtNum, toNum } from '../../utils/num';
import i18n from '../../i18n';
import { dateFmt } from '../../i18n/labels';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const fmtDate = (d) => dateFmt(d, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtPct = (n) => `${n > 0 ? '+' : ''}${fmtNum(n)}%`;
const GOAL_LABEL = { lose: 'bajar grasa', maintain: 'mantener', gain: 'ganar músculo' };

// El back manda un estado y los números; el texto se arma acá, en el idioma del usuario
const STATUS_MSG = {
  collecting: 'Registrá tu peso una vez por semana (mismo día, en ayunas). Con 2 semanas de datos empezamos a ajustar tus calorías.',
  ok: 'Vas {{rate}} por semana: dentro de lo esperado ({{min}} a {{max}}). Seguimos igual.',
  adjusted: 'Vas {{rate}} por semana y lo esperado es {{min}} a {{max}}. Ajustamos tus calorías {{change}} kcal/día.',
  waiting: 'Vas {{rate}} por semana. Ya ajustamos hace menos de 7 días: esperamos a ver el efecto.',
  max: 'Vas {{rate}} por semana. Llegamos al ajuste máximo (±600 kcal); conviene revisar actividad o adherencia.',
};

// ⚖️ Registro de peso semanal + ajuste automático de calorías
export default function WeightView({ onTargetsChange }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/profile/weights').then(({ data }) => setData(data)).catch(showError);
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const value = toNum(weight);
    if (!value) return;
    setSaving(true);
    try {
      const { data: res } = await api.post('/profile/weights', { weightKg: value });
      setData(res);
      setWeight('');
      onTargetsChange?.(res.targets);
      toast[res.change ? 'info' : 'success'](res.change ? i18n.t('Calorías ajustadas {{change}} kcal/día', { change: `${res.change > 0 ? '+' : ''}${res.change}` }) : i18n.t('Peso registrado'));
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (date) => {
    try {
      const { data: res } = await api.delete(`/profile/weights/${new Date(date).toISOString().slice(0, 10)}`);
      setData(res);
    } catch (err) {
      showError(err);
    }
  };

  if (!data) return <Spinner size="sm" />;

  const logs = data.logs;
  const first = logs[0];
  const last = logs.at(-1);
  const total = first && last ? Math.round((last.weightKg - first.weightKg) * 10) / 10 : null;
  const inRange = data.rate != null && data.rate >= data.expected[0] && data.rate <= data.expected[1];

  return (
    <div className="weight">
      <div className="weight-top">
        <form className="weight-form" onSubmit={save}>
          <h5>{t('Registrá tu peso')}</h5>
          <p className="text-muted small">{t('Una vez por semana, mismo día, en ayunas. Con eso ajustamos tus calorías solos.')}</p>
          <InputGroup>
            <Form.Control inputMode="decimal" placeholder={last ? fmtNum(last.weightKg) : fmtNum(78.5)} value={weight} onChange={(e) => setWeight(cleanDecimal(e.target.value))} />
            <InputGroup.Text>kg</InputGroup.Text>
            <Button type="submit" disabled={!weight || saving}>{saving ? <Spinner size="sm" /> : t('Registrar')}</Button>
          </InputGroup>
        </form>

        <div className="weight-stats">
          <div><span>{t('Actual')}</span><b>{last ? `${fmtNum(last.weightKg)} kg` : '—'}</b></div>
          <div><span>{t('Cambio total')}</span><b className={total > 0 ? 'up' : total < 0 ? 'down' : ''}>{total != null ? `${total > 0 ? '+' : ''}${fmtNum(total)} kg` : '—'}</b></div>
          <div><span>{t('Ritmo semanal')}</span><b className={data.rate == null ? '' : inRange ? 'good' : 'warn'}>{data.rate != null ? fmtPct(data.rate) : '—'}</b></div>
          <div><span>{t('Ajuste de calorías')}</span><b>{data.adjustment ? `${data.adjustment > 0 ? '+' : ''}${data.adjustment} kcal` : '0'}</b></div>
        </div>
      </div>

      <div className="meal-callout mb-3">
        <span>🎯</span>
        <div>
          <b>{t('Objetivo')}: {data.goal ? t(GOAL_LABEL[data.goal]) : '—'}</b> · {t('ritmo ideal {{min}} a {{max}} del peso por semana.', { min: fmtPct(data.expected[0]), max: fmtPct(data.expected[1]) })}
          {data.targets && <> {t('Hoy tu objetivo es')} <b>{data.targets.calories} kcal</b>.</>}
          <div className="mt-1">
            {t(STATUS_MSG[data.status] ?? STATUS_MSG.collecting, {
              rate: data.rate != null ? fmtPct(data.rate) : '',
              min: fmtPct(data.expected[0]),
              max: fmtPct(data.expected[1]),
              change: `${data.change > 0 ? '+' : ''}${data.change ?? 0}`,
            })}
          </div>
        </div>
      </div>

      {logs.length > 1 && (
        <div className="weight-chart">
          <Line
            data={{
              labels: logs.map((l) => fmtDate(l.date)),
              datasets: [{
                data: logs.map((l) => l.weightKg),
                borderColor: '#2383e2',
                backgroundColor: 'rgba(35,131,226,0.08)',
                fill: true,
                tension: 0.3,
                pointRadius: 3,
              }],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { ticks: { callback: (v) => `${fmtNum(v)} kg` }, grid: { color: 'rgba(127,127,127,0.15)' } }, x: { grid: { display: false } } },
            }}
          />
        </div>
      )}

      {logs.length > 0 && (
        <ul className="weight-list">
          {[...logs].reverse().slice(0, 8).map((l) => (
            <li key={l.date}>
              <span>{fmtDate(l.date)}</span>
              <b>{fmtNum(l.weightKg)} kg</b>
              <button onClick={() => remove(l.date)} title={t('Borrar registro')}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
