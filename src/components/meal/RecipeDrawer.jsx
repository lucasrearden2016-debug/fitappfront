import { useEffect, useState } from 'react';
import { Offcanvas, Spinner } from 'react-bootstrap';
import api, { showError } from '../../api/client';
import { mealStyle } from './mealUtils';
import { mealTypeLabel, qty } from '../../i18n/labels';
import { useTranslation } from 'react-i18next';

// Panel lateral con la receta. La receta se genera la primera vez que se abre (y queda guardada).
export default function RecipeDrawer({ planId, meal, onClose }) {
  const { t } = useTranslation();
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
              <span className="meal-type" style={{ background: style.bg, color: style.fg }}>{style.icon} {mealTypeLabel(meal.type)}</span>
              <Offcanvas.Title as="h4" className="mt-2">{meal.name}</Offcanvas.Title>
            </div>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {meal.description && <p className="text-muted">{meal.description}</p>}

            <div className="recipe-stats">
              {recipe && <div><span>{t('Tiempo')}</span><b>{recipe.timeMinutes} min</b></div>}
              <div><span>{t('Calorías')}</span><b>{Math.round(meal.calories)}</b></div>
              <div><span>{t('Proteína')}</span><b>{Math.round(meal.protein)} g</b></div>
              <div><span>{t('Carbos')}</span><b>{Math.round(meal.carbs)} g</b></div>
              <div><span>{t('Grasas')}</span><b>{Math.round(meal.fat)} g</b></div>
            </div>

            <h6 className="recipe-h">{t('Ingredientes')}</h6>
            <ul className="recipe-ingredients">
              {meal.ingredients.map((i) => (
                <li key={i.name} className={done[i.name] ? 'done' : ''} onClick={() => setDone((d) => ({ ...d, [i.name]: !d[i.name] }))}>
                  <span className="check">{done[i.name] ? '✓' : ''}</span>
                  <span className="qty">{qty(i)}</span> {i.name}
                </li>
              ))}
            </ul>

            <h6 className="recipe-h">{t('Preparación')}</h6>
            {!recipe ? (
              <div className="text-muted small d-flex align-items-center gap-2">
                <Spinner size="sm" /> {t('Escribiendo la receta…')}
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
