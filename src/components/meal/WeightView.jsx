import { useEffect, useState } from 'react';
import { Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
import { toast } from 'react-toastify';
import api, { showError } from '../../api/client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const fmtDate = (d) => new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtPct = (n) => `${n > 0 ? '+' : ''}${n}%`;
const GOAL_LABEL = { lose: 'bajar grasa', maintain: 'mantener', gain: 'ganar músculo' };

// ⚖️ Registro de peso semanal + ajuste automático de calorías
export default function WeightView({ onTargetsChange }) {
  const [data, setData] = useState(null);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/profile/weights').then(({ data }) => setData(data)).catch(showError);
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const value = Number(String(weight).replace(',', '.'));
    if (!value) return;
    setSaving(true);
    try {
      const { data: res } = await api.post('/profile/weights', { weightKg: value });
      setData(res);
      setWeight('');
      onTargetsChange?.(res.targets);
      toast[res.change ? 'info' : 'success'](res.change ? `Calorías ajustadas ${res.change > 0 ? '+' : ''}${res.change} kcal/día` : 'Peso registrado');
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
          <h5>Registrá tu peso</h5>
          <p className="text-muted small">Una vez por semana, mismo día, en ayunas. Con eso ajustamos tus calorías solos.</p>
          <InputGroup>
            <Form.Control inputMode="decimal" placeholder={last ? String(last.weightKg) : 'Ej: 78,5'} value={weight} onChange={(e) => setWeight(e.target.value)} />
            <InputGroup.Text>kg</InputGroup.Text>
            <Button type="submit" disabled={!weight || saving}>{saving ? <Spinner size="sm" /> : 'Registrar'}</Button>
          </InputGroup>
        </form>

        <div className="weight-stats">
          <div><span>Actual</span><b>{last ? `${last.weightKg} kg` : '—'}</b></div>
          <div><span>Cambio total</span><b className={total > 0 ? 'up' : total < 0 ? 'down' : ''}>{total != null ? `${total > 0 ? '+' : ''}${total} kg` : '—'}</b></div>
          <div><span>Ritmo semanal</span><b className={data.rate == null ? '' : inRange ? 'good' : 'warn'}>{data.rate != null ? fmtPct(data.rate) : '—'}</b></div>
          <div><span>Ajuste de calorías</span><b>{data.adjustment ? `${data.adjustment > 0 ? '+' : ''}${data.adjustment} kcal` : '0'}</b></div>
        </div>
      </div>

      <div className="meal-callout mb-3">
        <span>🎯</span>
        <div>
          <b>Objetivo: {GOAL_LABEL[data.goal] ?? '—'}</b> · ritmo ideal {fmtPct(data.expected[0])} a {fmtPct(data.expected[1])} del peso por semana.
          {data.targets && <> Hoy tu objetivo es <b>{data.targets.calories} kcal</b>.</>}
          <div className="mt-1">{data.message}</div>
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
              scales: { y: { ticks: { callback: (v) => `${Number(v).toFixed(1)} kg` }, grid: { color: 'rgba(127,127,127,0.15)' } }, x: { grid: { display: false } } },
            }}
          />
        </div>
      )}

      {logs.length > 0 && (
        <ul className="weight-list">
          {[...logs].reverse().slice(0, 8).map((l) => (
            <li key={l.date}>
              <span>{fmtDate(l.date)}</span>
              <b>{l.weightKg} kg</b>
              <button onClick={() => remove(l.date)} title="Borrar registro">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
