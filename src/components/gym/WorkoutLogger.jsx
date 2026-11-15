import { useEffect, useState } from 'react';
import { Form, Card, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api, { showError } from '../../api/client';

// Registrar una sesión: elegís el día, y por cada ejercicio cargás reps y kg de cada serie.
// Se precarga con lo que hiciste la última vez para que sea fácil subir peso.
export default function WorkoutLogger({ routine }) {
  const [dayName, setDayName] = useState(routine.days[0]?.name);
  const [entries, setEntries] = useState([]);
  const [last, setLast] = useState({});
  const [saving, setSaving] = useState(false);

  const day = routine.days.find((d) => d.name === dayName);

  useEffect(() => {
    if (!day) return;
    setEntries(day.exercises.map((e) => ({
      exercise: e.name,
      sets: Array.from({ length: e.sets }, () => ({ reps: parseInt(e.reps) || 10, weightKg: 0 })),
    })));
    Promise.all(day.exercises.map((e) => api.get('/workouts/last', { params: { exercise: e.name } }).then((r) => [e.name, r.data])))
      .then((pairs) => {
        const map = Object.fromEntries(pairs);
        setLast(map);
        // precarga el peso de la sesión anterior
        setEntries((prev) => prev.map((en) => {
          const prevSets = map[en.exercise]?.sets;
          return prevSets ? { ...en, sets: en.sets.map((s, i) => ({ ...s, weightKg: prevSets[i]?.weightKg ?? prevSets.at(-1).weightKg })) } : en;
        }));
      })
      .catch(() => {});
  }, [dayName]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = (ei, si, field, value) =>
    setEntries((prev) => prev.map((en, i) => (i !== ei ? en : {
      ...en, sets: en.sets.map((s, j) => (j !== si ? s : { ...s, [field]: value === '' ? '' : Number(value) })),
    })));

  const addSet = (ei) =>
    setEntries((prev) => prev.map((en, i) => (i !== ei ? en : { ...en, sets: [...en.sets, { ...en.sets.at(-1) }] })));

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/workouts', {
        routine: routine._id,
        dayName,
        entries: entries.map((en) => ({ ...en, sets: en.sets.filter((s) => s.reps !== '' && s.weightKg !== '') })).filter((en) => en.sets.length),
      });
      toast.success('¡Sesión guardada! 💪');
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Form.Select className="mb-3" value={dayName} onChange={(e) => setDayName(e.target.value)}>
        {routine.days.map((d) => <option key={d.name}>{d.name}</option>)}
      </Form.Select>

      {entries.map((en, ei) => (
        <Card className="mb-3" key={en.exercise}>
          <Card.Body>
            <Card.Title className="h6">{en.exercise}</Card.Title>
            {last[en.exercise] && (
              <small className="text-muted d-block mb-2">
                Última vez: {last[en.exercise].sets.map((s) => `${s.weightKg}kg×${s.reps}`).join(' · ')}
              </small>
            )}
            {en.sets.map((s, si) => (
              <Row className="g-2 mb-2" key={si}>
                <Col xs={2} className="pt-2 text-muted">#{si + 1}</Col>
                <Col>
                  <InputGroup size="sm">
                    <Form.Control type="number" value={s.weightKg} onChange={(e) => setValue(ei, si, 'weightKg', e.target.value)} />
                    <InputGroup.Text>kg</InputGroup.Text>
                  </InputGroup>
                </Col>
                <Col>
                  <InputGroup size="sm">
                    <Form.Control type="number" value={s.reps} onChange={(e) => setValue(ei, si, 'reps', e.target.value)} />
                    <InputGroup.Text>reps</InputGroup.Text>
                  </InputGroup>
                </Col>
              </Row>
            ))}
            <Button size="sm" variant="link" onClick={() => addSet(ei)}>+ serie</Button>
          </Card.Body>
        </Card>
      ))}

      <Button onClick={save} disabled={saving} size="lg">Guardar sesión</Button>
    </>
  );
}
