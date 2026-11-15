import { Dropdown, Spinner } from 'react-bootstrap';
import { mealStyle } from './mealUtils';

// Tarjeta de comida: clic abre la receta; acciones: hecha ✓, favorita ⭐, otra opción 🔄
export default function MealCard({ meal, onOpen, onToggleEaten, isFavorite, onToggleFavorite, onSwap, swapping, onEdit, onDelete }) {
  const style = mealStyle(meal.type);
  const preview = meal.ingredients.map((i) => (i.quantity ? `${i.name} ${i.quantity}` : i.name)).join(' · ');
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div
      className={`meal-card ${meal.eaten ? 'eaten' : ''} ${swapping ? 'swapping' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => !swapping && onOpen(meal)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(meal)}
    >
      <div className="meal-card-top">
        <span className="meal-type" style={{ background: style.bg, color: style.fg }}>{style.icon} {meal.type}</span>
        <div className="meal-actions">
          <button className={`meal-act ${isFavorite ? 'on fav' : ''}`} title={isFavorite ? 'Quitar de favoritas' : 'Guardar como favorita'} onClick={stop(onToggleFavorite)}>
            {isFavorite ? '★' : '☆'}
          </button>
          <button className="meal-act" title="Otra opción con las mismas calorías" disabled={swapping} onClick={stop(onSwap)}>
            {swapping ? <Spinner size="sm" /> : '↻'}
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown align="end" className="meal-menu">
              <Dropdown.Toggle as="button" className="meal-act" title="Más opciones">⋯</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={onEdit}>✎ Editar</Dropdown.Item>
                <Dropdown.Item onClick={onSwap}>↻ Otra opción con IA</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="text-danger" onClick={onDelete}>🗑 Eliminar</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <button className={`meal-check ${meal.eaten ? 'on' : ''}`} title={meal.eaten ? 'Marcar como no hecha' : 'Marcar como hecha'} onClick={stop(onToggleEaten)}>
            ✓
          </button>
        </div>
      </div>
      <h6 className="meal-name">{meal.name}</h6>
      {meal.description && <p className="meal-desc">{meal.description}</p>}
      <p className="meal-ingredients" title={preview}>{preview}</p>
      <div className="meal-foot">
        <span className="meal-macros">
          <b>{Math.round(meal.calories)} kcal</b>
          <span>P {Math.round(meal.protein)}g</span>
          <span>C {Math.round(meal.carbs)}g</span>
          <span>G {Math.round(meal.fat)}g</span>
        </span>
        <span className="meal-open">Receta →</span>
      </div>
    </div>
  );
}
