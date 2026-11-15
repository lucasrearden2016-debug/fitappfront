import { useEffect, useState } from 'react';
import { Form, Alert } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,
} from 'chart.js';
import api, { showError } from '../../api/client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function ProgressChart() {
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get('/workouts/exercises').then(({ data }) => {
      setExercises(data);
      if (data.length) setSelected(data[0]);
    }).catch(showError);
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get('/workouts/progress', { params: { exercise: selected } }).then(({ data }) => setData(data)).catch(showError);
  }, [selected]);

  if (!exercises.length) return <Alert variant="info">Registrá tu primer entrenamiento para ver tu progreso.</Alert>;

  return (
    <>
      <Form.Select className="mb-3" value={selected} onChange={(e) => setSelected(e.target.value)}>
        {exercises.map((e) => <option key={e}>{e}</option>)}
      </Form.Select>
      <Line
        data={{
          labels: data.map((d) => new Date(d.date).toLocaleDateString()),
          datasets: [
            { label: 'Peso máximo (kg)', data: data.map((d) => d.maxWeight), borderColor: '#0d6efd', yAxisID: 'y' },
            { label: 'Volumen (kg×reps)', data: data.map((d) => d.volume), borderColor: '#adb5bd', yAxisID: 'y1' },
          ],
        }}
        options={{
          responsive: true,
          interaction: { mode: 'index', intersect: false },
          scales: { y: { position: 'left' }, y1: { position: 'right', grid: { drawOnChartArea: false } } },
        }}
      />
    </>
  );
}
