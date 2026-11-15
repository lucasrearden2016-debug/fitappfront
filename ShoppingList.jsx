import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

const ICONS = {
  'Verdulería': '🥬',
  'Carnicería y pescadería': '🥩',
  'Lácteos y huevos': '🥛',
  'Almacén': '🥫',
  'Panadería': '🥖',
  'Congelados': '🧊',
  'Otros': '🛍️',
};

// Planes viejos tienen la lista como strings
const normalize = (items) => items.map((i) => (typeof i === 'string' ? { item: i, section: 'Otros' } : i));

// Lista de compras por sección del súper, con tildes que se recuerdan en este navegador
export default function ShoppingList({ planId, items: rawItems }) {
  const items = normalize(rawItems);
  const storageKey = `shopping:${planId}`;
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) ?? {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      /* sin storage: no pasa nada */
    }
  }, [storageKey, checked]);

  const sections = [...new Set(items.map((i) => i.section))];
  const count = items.filter((i) => checked[i.item]).length;
  const pending = items.filter((i) => !checked[i.item]);

  const copy = async () => {
    const text = sections
      .map((s) => {
        const list = pending.filter((i) => i.section === s);
        return list.length ? `*${s}*\n${list.map((i) => `• ${i.item}`).join('\n')}` : '';
      })
      .filter(Boolean)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Lista copiada: pegala en WhatsApp o en tus notas');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  const toggle = (item) => setChecked((c) => ({ ...c, [item]: !c[item] }));

  return (
    <div className="shopping">
      <div className="shopping-head">
        <div>
          <div className="shopping-count">{count}/{items.length} en el carrito</div>
          <div className="shopping-bar"><div style={{ width: `${items.length ? (count / items.length) * 100 : 0}%` }} /></div>
        </div>
        <div className="d-flex gap-2">
          {count > 0 && <Button size="sm" variant="ghost" onClick={() => setChecked({})}>Destildar todo</Button>}
          <Button size="sm" variant="light" onClick={copy} disabled={!pending.length}>📋 Copiar pendientes</Button>
        </div>
      </div>

      <div className="shopping-sections">
        {sections.map((s) => {
          const list = items.filter((i) => i.section === s);
          const done = list.filter((i) => checked[i.item]).length;
          return (
            <section key={s} className="shopping-section">
              <h6>
                <span>{ICONS[s] ?? '🛍️'} {s}</span>
                <span className="text-muted">{done}/{list.length}</span>
              </h6>
              <ul className="shopping-list">
                {[...list.filter((i) => !checked[i.item]), ...list.filter((i) => checked[i.item])].map(({ item }) => (
                  <li key={item} className={checked[item] ? 'done' : ''} onClick={() => toggle(item)}>
                    <span className="check">{checked[item] ? '✓' : ''}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
