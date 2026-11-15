import { useEffect, useState } from 'react';
import { Card, Button, Spinner, Alert, Table, Tabs, Tab, ButtonGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api, { showError } from '../api/client';
import RoutineEditor from '../components/gym/RoutineEditor';
import WorkoutLogger from '../components/gym/WorkoutLogger';
import ProgressChart from '../components/gym/ProgressChart';

export default function Gym() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // 'generate' | 'review'
  const [editing, setEditing] = useState(null); // null | 'new' | routine

  const active = routines.find((r) => r.active);

  const load = () =>
    api.get('/routines').then(({ data }) => setRoutines(data)).catch(showError).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (active && !confirm('Esto reemplaza tu rutina activa (la anterior queda guardada). ¿Seguimos?')) return;
    setBusy('generate');
    try {
      await api.post('/routines/generate');
      toast.success('¡Rutina generada!');
      await load();
    } catch (err) { showError(err); } finally { setBusy(null); }
  };

  const review = async () => {
    setBusy('review');
    try {
      const { data } = await api.post(`/routines/${active._id}/review`);
      setRoutines((rs) => rs.map((r) => (r._id === active._id ? { ...r, lastReview: data } : r)));
    } catch (err) { showError(err); } finally { setBusy(null); }
  };

  const activate = async (r) => {
    await api.put(`/routines/${r._id}`, { name: r.name, days: r.days, active: true }).catch(showError);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <Tabs defaultActiveKey="routine" className="mb-3">
      <Tab eventKey="routine" title="Mi rutina">
        <ButtonGroup className="mb-3">
          <Button onClick={generate} disabled={!!busy}>
            {busy === 'generate' ? <Spinner size="sm" /> : '✨'} Generar con IA
          </Button>
          <Button variant="outline-primary" onClick={() => setEditing('new')}>Cargar mi rutina</Button>
          {active && <Button variant="outline-primary" onClick={() => setEditing(active)}>Editar</Button>}
          {active && (
            <Button variant="outline-success" onClick={review} disabled={!!busy}>
              {busy === 'review' ? <Spinner size="sm" /> : '🧠'} Pedir recomendaciones
            </Button>
          )}
        </ButtonGroup>

        {!active && <Alert variant="info">No tenés rutina activa. Generá una con IA o cargá la tuya.</Alert>}

        {active && (
          <>
            <h4>{active.name} {active.source === 'ai' && <small className="text-muted">(generada por IA)</small>}</h4>
            {active.days.map((d) => (
              <Card className="mb-3" key={d.name}>
                <Card.Header>{d.name}</Card.Header>
                <Table size="sm" className="mb-0">
                  <thead><tr><th>Ejercicio</th><th>Series</th><th>Reps</th><th>Descanso</th><th>Notas</th></tr></thead>
                  <tbody>
                    {d.exercises.map((e) => (
                      <tr key={e.name}><td>{e.name}</td><td>{e.sets}</td><td>{e.reps}</td><td>{e.restSeconds}s</td><td className="text-muted small">{e.notes}</td></tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            ))}
            {active.lastReview?.summary && (
              <Alert variant="success">
                <Alert.Heading>Recomendaciones</Alert.Heading>
                <p>{active.lastReview.summary}</p>
                <ul className="mb-0">{active.lastReview.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </Alert>
            )}
          </>
        )}

        {routines.filter((r) => !r.active).length > 0 && (
          <>
            <h6 className="mt-4">Rutinas anteriores</h6>
            {routines.filter((r) => !r.active).map((r) => (
              <div key={r._id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                <span>{r.name}</span>
                <Button size="sm" variant="link" onClick={() => activate(r)}>Activar</Button>
              </div>
            ))}
          </>
        )}
      </Tab>

      <Tab eventKey="log" title="Registrar entrenamiento" disabled={!active}>
        {active && <WorkoutLogger routine={active} />}
      </Tab>

      <Tab eventKey="progress" title="Progreso">
        <ProgressChart />
      </Tab>

      <RoutineEditor
        show={!!editing}
        routine={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />
    </Tabs>
  );
}
