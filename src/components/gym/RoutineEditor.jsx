import { useEffect, useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api, { showError } from '../../api/client';

// Editor rápido en texto plano:
//   # Día A - Empuje
//   Press banca 4x6-8
//   Press militar 3x10
// Las líneas con "#" son días; el resto: "Nombre SERIESxREPS"
const PLACEHOLDER = `# Día A - Empuje
Press banca 4x6-8
Press inclinado mancuernas 3x10
Fondos 3x12

# Día B - Tirón
Dominadas 4x6
Remo con barra 4x8`;

function parse(text) {
  const days = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      days.push({ name: line.slice(1).trim(), exercises: [] });
      continue;
    }
    if (!days.length) days.push({ name: 'Día 1', exercises: [] });
    const m = line.match(/^(.*?)\s+(\d+)\s*[xX]\s*([\d-]+)\s*$/);
    days.at(-1).exercises.push(m ? { name: m[1], sets: +m[2], reps: m[3] } : { name: line });
  }
  return days.filter((d) => d.exercises.length);
}

const serialize = (r) =>
  r.days.map((d) => `# ${d.name}\n` + d.exercises.map((e) => `${e.name} ${e.sets}x${e.reps}`).join('\n')).join('\n\n');

export default function RoutineEditor({ show, routine, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    setName(routine?.name ?? 'Mi rutina');
    setText(routine ? serialize(routine) : '');
  }, [routine, show]);

  const save = async () => {
    // Conserva notas y descansos de ejercicios que ya existían (p.ej. los de la IA)
    const previous = new Map(routine?.days.flatMap((d) => d.exercises).map((e) => [e.name, e]) ?? []);
    const days = parse(text).map((d) => ({
      ...d,
      exercises: d.exercises.map((e) => ({ ...previous.get(e.name), ...e })),
    }));
    if (!days.length) return toast.warn('Agregá al menos un día con ejercicios');
    try {
      if (routine) await api.put(`/routines/${routine._id}`, { name, days, active: true });
      else await api.post('/routines', { name, days });
      toast.success('Rutina guardada');
      onSaved();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton><Modal.Title>{routine ? 'Editar rutina' : 'Cargar mi rutina'}</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Nombre</Form.Label>
          <Form.Control value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Group>
        <Form.Group>
          <Form.Label>Ejercicios</Form.Label>
          <Form.Control as="textarea" rows={14} value={text} onChange={(e) => setText(e.target.value)} placeholder={PLACEHOLDER} className="font-monospace" />
          <Form.Text muted>Usá <code># Nombre del día</code> para cada día y <code>Ejercicio 4x8</code> por línea.</Form.Text>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={save}>Guardar</Button>
      </Modal.Footer>
    </Modal>
  );
}
