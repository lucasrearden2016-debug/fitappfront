import { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { emptySeries, formatSeries, newExercise, parseSeries } from '../../utils/series';
import { useTranslation } from 'react-i18next';

// Mueve el foco a la celda de abajo (o arriba) en la misma columna
function focusCell(table, row, col) {
  const el = table?.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (el) {
    el.focus();
    el.select?.();
  }
  return !!el;
}

function SeriesCell({ value, row, col, onCommit, tableRef, className = 'gt-input gt-series' }) {
  const { t } = useTranslation();
  const formatted = formatSeries(value);
  const [text, setText] = useState(formatted);
  const focused = useRef(false);

  // Si el valor cambia desde afuera (carga, IA), actualizamos lo que se ve
  useEffect(() => {
    if (!focused.current) setText(formatted);
  }, [formatted]);

  const commit = () => {
    const parsed = parseSeries(text);
    setText(formatSeries(parsed));
    if (parsed.weightKg !== (value?.weightKg ?? null) || parsed.reps !== (value?.reps ?? null)) onCommit(parsed);
  };

  const target = value?.target;
  return (
    <input
      className={className}
      value={text}
      placeholder={target ? `× ${target}` : ''}
      title={target ? t('Objetivo: {{n}} reps', { n: target }) : t('peso×reps (ej. 80x10) o solo reps')}
      inputMode="decimal"
      data-row={row}
      data-col={col}
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        commit();
      }}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          if (!focusCell(tableRef.current, row + 1, col)) e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          setText(formatted);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export default function RoutineTable({ day, onChange }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 767.98px)');
  const tableRef = useRef(null);
  const dragFrom = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const columns = day.columns || 1;

  const setExercises = (exercises) => onChange({ ...day, exercises });
  const updateExercise = (i, patch) => setExercises(day.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)));

  const setSeries = (i, col, parsed) => {
    const ex = day.exercises[i];
    const series = [...(ex.series ?? [])];
    while (series.length <= col) series.push(emptySeries());
    series[col] = { ...series[col], ...parsed };
    updateExercise(i, { series });
  };

  // Al agregar una fila, el foco va a su nombre apenas se renderiza
  const focusRow = useRef(null);
  useEffect(() => {
    if (focusRow.current != null && focusCell(tableRef.current, focusRow.current, 'name')) focusRow.current = null;
  });
  const addRow = () => {
    focusRow.current = day.exercises.length;
    setExercises([...day.exercises, newExercise()]);
  };
  const removeRow = (i) => setExercises(day.exercises.filter((_, j) => j !== i));

  const addColumn = () => onChange({ ...day, columns: columns + 1 });
  const removeColumn = (col) => {
    const hasData = day.exercises.some((e) => e.series?.[col]?.reps || e.series?.[col]?.weightKg);
    if (hasData && !confirm(t('La serie {{n}} tiene datos. ¿Eliminarla igual?', { n: col + 1 }))) return;
    onChange({
      ...day,
      columns: Math.max(1, columns - 1),
      exercises: day.exercises.map((e) => ({ ...e, series: (e.series ?? []).filter((_, j) => j !== col) })),
    });
  };

  const drop = (to) => {
    const from = dragFrom.current;
    setDragOver(null);
    dragFrom.current = null;
    if (from == null || from === to) return;
    const list = [...day.exercises];
    const [moved] = list.splice(from, 1);
    list.splice(to > from ? to - 1 : to, 0, moved);
    setExercises(list);
  };

  const textKeys = (i, col) => (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (focusCell(tableRef.current, i + 1, col)) return;
    if (col === 'name') addRow();
    else e.currentTarget.blur();
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= day.exercises.length) return;
    const list = [...day.exercises];
    [list[i], list[j]] = [list[j], list[i]];
    setExercises(list);
  };

  // ---------- Celular: una tarjeta por ejercicio ----------
  if (isMobile) {
    return (
      <div className="gm-list" ref={tableRef}>
        {day.exercises.map((ex, i) => (
          <div className="gm-card" key={ex.key}>
            <div className="gm-head">
              <input
                className="gm-name"
                value={ex.name}
                placeholder={t('Ejercicio')}
                data-row={i}
                data-col="name"
                onChange={(e) => updateExercise(i, { name: e.target.value })}
              />
              <Dropdown align="end">
                <Dropdown.Toggle as="button" className="gm-menu" aria-label={t('Opciones')}>⋯</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item disabled={i === 0} onClick={() => move(i, -1)}>{t('↑ Subir')}</Dropdown.Item>
                  <Dropdown.Item disabled={i === day.exercises.length - 1} onClick={() => move(i, 1)}>{t('↓ Bajar')}</Dropdown.Item>
                  {columns > 1 && <Dropdown.Item onClick={() => removeColumn(columns - 1)}>{t('− Quitar serie {{n}}', { n: columns })}</Dropdown.Item>}
                  <Dropdown.Divider />
                  <Dropdown.Item className="text-danger" onClick={() => removeRow(i)}>{t('🗑 Eliminar ejercicio')}</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            <div className="gm-series">
              {Array.from({ length: columns }, (_, c) => (
                <label key={c} className="gm-set">
                  <span>{t('S{{n}}', { n: c + 1 })}</span>
                  <SeriesCell
                    className="gm-set-input"
                    value={ex.series?.[c]}
                    row={i}
                    col={c}
                    tableRef={tableRef}
                    onCommit={(parsed) => setSeries(i, c, parsed)}
                  />
                </label>
              ))}
              <button className="gm-add-set" onClick={addColumn} title={t('Agregar serie')}>{t('+ serie')}</button>
            </div>
            <div className="gm-foot">
              <input className="gm-rest" value={ex.rest} placeholder={`◷ ${t('Descanso')}`} onChange={(e) => updateExercise(i, { rest: e.target.value })} />
              <input className="gm-notes" value={ex.notes} placeholder={t('Notas…')} onChange={(e) => updateExercise(i, { notes: e.target.value })} />
            </div>
          </div>
        ))}
        <button className="gm-new" onClick={() => addRow()}>{t('+ Nuevo ejercicio')}</button>
      </div>
    );
  }

  return (
    <div className="gt-wrap">
      <table className="gt-table" ref={tableRef} style={{ width: '100%', minWidth: 28 + 230 + 96 * columns + 40 + 96 + 260 + 36 }}>
        <colgroup>
          <col style={{ width: 28 }} />
          <col style={{ width: 230 }} />
          {Array.from({ length: columns }, (_, c) => <col key={c} style={{ width: 96 }} />)}
          <col style={{ width: 40 }} />
          <col style={{ width: 96 }} />
          <col />
          <col style={{ width: 36 }} />
        </colgroup>
        <thead>
          <tr>
            <th />
            <th><span className="gt-th-icon">Aa</span> {t('Ejercicio')}</th>
            {Array.from({ length: columns }, (_, c) => (
              <th key={c} className="gt-th-series">
                <span className="gt-th-icon">#</span> {t('Serie {{n}}', { n: c + 1 })}
                {columns > 1 && (
                  <button className="gt-th-remove" title={t('Eliminar columna')} onClick={() => removeColumn(c)}>×</button>
                )}
              </th>
            ))}
            <th className="gt-th-add">
              <button className="gt-add-col" title={t('Agregar serie')} onClick={addColumn}>+</button>
            </th>
            <th><span className="gt-th-icon">◷</span> {t('Descanso')}</th>
            <th><span className="gt-th-icon">≡</span> {t('Notas')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {day.exercises.map((ex, i) => (
            <tr
              key={ex.key}
              className={dragOver === i ? 'gt-drop-target' : ''}
              onDragOver={(e) => {
                if (dragFrom.current == null) return;
                e.preventDefault();
                setDragOver(i);
              }}
              onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
              onDrop={() => drop(i)}
            >
              <td className="gt-gutter">
                <span
                  className="gt-handle"
                  draggable
                  title={t('Arrastrar para reordenar')}
                  onDragStart={(e) => {
                    dragFrom.current = i;
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setDragImage(e.currentTarget.closest('tr'), 20, 16);
                  }}
                  onDragEnd={() => setDragOver(null)}
                >
                  ⋮⋮
                </span>
              </td>
              <td>
                <input
                  className="gt-input gt-name"
                  value={ex.name}
                  placeholder={t('Ejercicio')}
                  data-row={i}
                  data-col="name"
                  onChange={(e) => updateExercise(i, { name: e.target.value })}
                  onKeyDown={textKeys(i, 'name')}
                />
              </td>
              {Array.from({ length: columns }, (_, c) => (
                <td key={c}>
                  <SeriesCell
                    value={ex.series?.[c]}
                    row={i}
                    col={c}
                    tableRef={tableRef}
                    onCommit={(parsed) => setSeries(i, c, parsed)}
                  />
                </td>
              ))}
              <td className="gt-empty" />
              <td>
                <input
                  className="gt-input"
                  value={ex.rest}
                  placeholder="—"
                  data-row={i}
                  data-col="rest"
                  onChange={(e) => updateExercise(i, { rest: e.target.value })}
                  onKeyDown={textKeys(i, 'rest')}
                />
              </td>
              <td>
                <input
                  className="gt-input gt-notes"
                  value={ex.notes}
                  placeholder=""
                  data-row={i}
                  data-col="notes"
                  title={ex.notes}
                  onChange={(e) => updateExercise(i, { notes: e.target.value })}
                  onKeyDown={textKeys(i, 'notes')}
                />
              </td>
              <td className="gt-gutter">
                <button className="gt-row-remove" title={t('Eliminar ejercicio')} onClick={() => removeRow(i)}>
                  🗑
                </button>
              </td>
            </tr>
          ))}
          <tr className={`gt-new-row ${dragOver === day.exercises.length ? 'gt-drop-target' : ''}`}
            onDragOver={(e) => { if (dragFrom.current != null) { e.preventDefault(); setDragOver(day.exercises.length); } }}
            onDrop={() => drop(day.exercises.length)}
          >
            <td />
            <td colSpan={columns + 5}>
              <button className="gt-new" onClick={() => addRow()}>{t('+ Nuevo ejercicio')}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
