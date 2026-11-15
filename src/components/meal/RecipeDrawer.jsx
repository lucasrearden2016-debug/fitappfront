import { useEffect, useState } from 'react';
import { Offcanvas, Spinner } from 'react-bootstrap';
import api, { showError } from '../../api/client';
import { mealStyle } from './mealUtils';

// Panel lateral con la receta. La receta se genera la primera vez que se abre (y queda guardada).
export default function RecipeDrawer({ planId, meal, onClose }) {
  const [recipe, setRecipe] = useState(null);
  const [done, setDone] = useState({}); // ingredientes tildados mientras cocinás

  useEffect(() => {
    if (!meal) return;
    setRecipe(null);
    setDone({});
    api.get(`/mealplans/${planId}/meals/${meal._id}/recipe`)
      .then(({ data }) => setRecipe(data))
      .catch((err) => {
        showError(err);
        onClose();
      });
  }, [planId, meal, onClose]);

  const style = meal ? mealStyle(meal.type) : null;

  return (
    <Offcanvas show={!!meal} onHide={onClose} placement="end" className="recipe-drawer">
      {meal && (
        <>
          <Offcanvas.Header closeButton>
            <div>
              <span className="meal-type" style={{ background: style.bg, color: style.fg }}>{style.icon} {meal.type}</span>
              <Offcanvas.Title as="h4" className="mt-2">{meal.name}</Offcanvas.Title>
            </div>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {meal.description && <p className="text-muted">{meal.description}</p>}

            <div className="recipe-stats">
              {recipe && <div><span>Tiempo</span><b>{recipe.timeMinutes} min</b></div>}
              <div><span>Calorías</span><b>{Math.round(meal.calories)}</b></div>
              <div><span>Proteína</span><b>{Math.round(meal.protein)} g</b></div>
              <div><span>Carbos</span><b>{Math.round(meal.carbs)} g</b></div>
              <div><span>Grasas</span><b>{Math.round(meal.fat)} g</b></div>
            </div>

            <h6 className="recipe-h">Ingredientes</h6>
            <ul className="recipe-ingredients">
              {meal.ingredients.map((i) => (
                <li key={i.name} className={done[i.name] ? 'done' : ''} onClick={() => setDone((d) => ({ ...d, [i.name]: !d[i.name] }))}>
                  <span className="check">{done[i.name] ? '✓' : ''}</span>
                  <span className="qty">{i.quantity}</span> {i.name}
                </li>
              ))}
            </ul>

            <h6 className="recipe-h">Preparación</h6>
            {!recipe ? (
              <div className="text-muted small d-flex align-items-center gap-2">
                <Spinner size="sm" /> Escribiendo la receta…
              </div>
            ) : (
              <>
                <ol className="recipe-steps">
                  {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                {recipe.tips && (
                  <div className="meal-callout"><span>💡</span><div>{recipe.tips}</div></div>
                )}
              </>
            )}
          </Offcanvas.Body>
        </>
      )}
    </Offcanvas>
  );
}
