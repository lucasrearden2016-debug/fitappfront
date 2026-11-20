import { useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import api from '../../api/client';
import { foodLabel } from '../../utils/foods';
import { fmtNum } from '../../utils/num';
import { useTranslation } from 'react-i18next';

// Input de ingrediente con buscador de la base de alimentos
export default function FoodSearch({ value, linked, onType, onPick, onCreate, onEnter }) {
  const { t } = useTranslation();
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (q) => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/foods', { params: { q, limit: 8 } });
        setResults(data);
        setActive(0);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);
  };

  const pick = (food) => {
    setOpen(false);
    onPick(food);
  };

  const showList = open && !linked && value.trim().length >= 2;

  return (
    <div className="food-search">
      <Form.Control
        size="sm"
        placeholder={t('Ingrediente (buscá en Alimentos)')}
        value={value}
        className={linked ? 'is-linked' : ''}
        onChange={(e) => {
          onType(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (showList && e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length)); }
          else if (showList && e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter') {
            e.preventDefault();
            if (showList && results[active]) pick(results[active]);
            else if (showList && active === results.length) onCreate(value);
            else onEnter();
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {showList && (
        <ul className="food-results">
          {results.map((f, i) => (
            <li key={f._id} className={i === active ? 'active' : ''} onMouseDown={(e) => { e.preventDefault(); pick(f); }}>
              <span className="fr-name">{foodLabel(f)}</span>
              <span className="fr-meta">{Math.round(f.calories)} kcal · P {fmtNum(f.protein)} /100{f.baseUnit}</span>
            </li>
          ))}
          <li className={`fr-create ${active === results.length ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); setOpen(false); onCreate(value); }}>
            {t('+ Crear “{{q}}” en Alimentos', { q: value.trim() })}
          </li>
        </ul>
      )}
    </div>
  );
}
