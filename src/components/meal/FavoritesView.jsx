import { useState } from 'react';
import { Button, Dropdown } from 'react-bootstrap';
import { mealStyle } from './mealUtils';

// ⭐ Banco de comidas favoritas: crear, editar, borrar y mandar al plan
export default function FavoritesView({ favorites, days, onNew, onEdit, onDelete, onAddToDay }) {
  const [type, setType] = useState('todas');
  const types = [...new Set(favorites.map((f) => f.type?.toLowerCase()).filter(Boolean))];
  const list = favorites.filter((f) => type === 'todas' || f.type?.toLowerCase() === type);

  return (
    <div className="favs">
      <div className="favs-head">
        <div>
          <h5 className="mb-1">Tus favoritas</h5>
          <p className="text-muted small mb-0">Tu banco de comidas para armar el plan a tu manera.</p>
        </div>
        <Button onClick={onNew}>+ Nueva favorita</Button>
      </div>

      {favorites.length > 0 && (
        <div className="segmented mb-3">
          {['todas', ...types].map((t) => (
            <button key={t} type="button" className={t === type ? 'active' : ''} onClick={() => setType(t)}>
              {t} <span className="text-muted">{t === 'todas' ? favorites.length : favorites.filter((f) => f.type?.toLowerCase() === t).length}</span>
            </button>
          ))}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="gym-empty">
          <div className="gym-empty-icon">⭐</div>
          <h5>Todavía no tenés favoritas</h5>
          <p className="text-muted small mb-3">
            Cargá tus desayunos, almuerzos y cenas de siempre. Después, al armar cada día, los elegís con un toque.
          </p>
          <Button onClick={onNew}>+ Crear la primera</Button>
        </div>
      ) : (
        <div className="meal-grid">
          {list.map((f) => {
            const style = mealStyle(f.type);
            return (
              <div className="meal-card fav-card" key={f._id}>
                <div className="meal-card-top">
                  <span className="meal-type" style={{ background: style.bg, color: style.fg }}>{style.icon} {f.type}</span>
                  <div className="meal-actions" onClick={(e) => e.stopPropagation()}>
                    <Dropdown align="end" className="meal-menu">
                      <Dropdown.Toggle as="button" className="meal-act" title="Más opciones">⋯</Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => onEdit(f)}>✎ Editar</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item className="text-danger" onClick={() => onDelete(f)}>🗑 Eliminar</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                <h6 className="meal-name">{f.name}</h6>
                {f.description && <p className="meal-desc">{f.description}</p>}
                <p className="meal-ingredients">{f.ingredients?.map((i) => (i.quantity ? `${i.name} ${i.quantity}` : i.name)).join(' · ')}</p>
                <div className="meal-foot">
                  <span className="meal-macros">
                    <b>{Math.round(f.calories)} kcal</b>
                    <span>P {Math.round(f.protein)}g</span>
                    <span>C {Math.round(f.carbs)}g</span>
                    <span>G {Math.round(f.fat)}g</span>
                  </span>
                  {days.length > 0 && (
                    <Dropdown align="end" drop="up">
                      <Dropdown.Toggle as="button" className="fav-add">+ Al plan</Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Header>Agregar al…</Dropdown.Header>
                        {days.map((d, i) => (
                          <Dropdown.Item key={d} onClick={() => onAddToDay(f, i)}>{d}</Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

