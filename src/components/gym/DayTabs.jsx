import { useState } from 'react';
import { Dropdown } from 'react-bootstrap';

// Pills de días estilo "views" de Notion. Doble clic para renombrar.
export default function DayTabs({ days, active, onSelect, onRename, onAdd, onDuplicate, onDelete, editable = true }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');

  const startRename = (i) => {
    setEditing(i);
    setDraft(days[i].name);
  };
  const finish = () => {
    if (editing != null && draft.trim()) onRename(editing, draft.trim());
    setEditing(null);
  };

  return (
    <div className="gym-days">
      {days.map((d, i) =>
        editing === i ? (
          <input
            key={i}
            className="gym-day-input"
            autoFocus
            value={draft}
            maxLength={60}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={finish}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finish();
              if (e.key === 'Escape') setEditing(null);
            }}
          />
        ) : (
          <span key={i} className="d-inline-flex align-items-center">
            <button
              className={`gym-day ${i === active ? 'active' : ''}`}
              onClick={() => onSelect(i)}
              onDoubleClick={() => editable && startRename(i)}
              title={editable ? 'Doble clic para renombrar' : undefined}
            >
              {d.name}
            </button>
            {editable && i === active && (
              <Dropdown className="gym-day-menu" popperConfig={{ strategy: 'fixed' }}>
                <Dropdown.Toggle aria-label="Opciones del día">⌄</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => startRename(i)}>✎ Renombrar</Dropdown.Item>
                  <Dropdown.Item onClick={() => onDuplicate(i)}>⧉ Duplicar</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item className="text-danger" disabled={days.length === 1} onClick={() => onDelete(i)}>
                    🗑 Eliminar día
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </span>
        )
      )}
      {editable && days.length < 7 && (
        <button className="gym-day" onClick={onAdd} title="Agregar día">+ Día</button>
      )}
    </div>
  );
}
