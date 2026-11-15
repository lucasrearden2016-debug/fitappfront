import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';

// Lista de compras con tildes. Lo tildado se recuerda en este navegador por plan.
export default function ShoppingList({ planId, items }) {
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

  const count = items.filter((i) => checked[i]).length;
  const pending = items.filter((i) => !checked[i]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pending.map((i) => `• ${i}`).join('\n'));
      toast.success('Lista copiada: pegala en WhatsApp o en tus notas');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

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
      <ul className="shopping-list">
        {[...pending, ...items.filter((i) => checked[i])].map((item) => (
          <li key={item} className={checked[item] ? 'done' : ''} onClick={() => setChecked((c) => ({ ...c, [item]: !c[item] }))}>
            <span className="check">{checked[item] ? '✓' : ''}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
