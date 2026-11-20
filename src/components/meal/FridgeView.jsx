import { useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api, { showError } from '../../api/client';
import TagInput from '../TagInput';
import { mealStyle } from './mealUtils';
import { mealTypeLabel, qty } from '../../i18n/labels';
import i18n from '../../i18n';
import { useTranslation } from 'react-i18next';

const COMMON = ['Huevos', 'Arroz', 'Pollo', 'Atún', 'Fideos', 'Papa', 'Tomate', 'Cebolla', 'Queso', 'Avena', 'Banana', 'Lentejas'];

// 🧊 "¿Qué cocino con lo que tengo?"
export default function FridgeView({ types, todayMeals, onUseInPlan, isFavorite, onToggleFavorite }) {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState([]);
  const [type, setType] = useState(types[Math.min(1, types.length - 1)] ?? 'almuerzo');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/mealplans/fridge', { ingredients, type, note });
      setResult(data);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const todayMeal = todayMeals.find((m) => m.type.toLowerCase() === type.toLowerCase());
  const style = result ? mealStyle(result.type) : null;

  return (
    <div className="fridge">
      <div className="fridge-form">
        <h5>{t('¿Qué tenés en la heladera?')}</h5>
        <p className="text-muted small">{t('Cargá lo que tengas y la IA te arma una comida con tus macros. Sal, aceite y especias se dan por hechos.')}</p>
        <TagInput value={ingredients} onChange={setIngredients} placeholder={t('Ej: huevos, espinaca, queso…')} suggestions={COMMON.map((s) => t(s))} variant="blue" />
        <div className="d-flex flex-wrap gap-3 align-items-end mt-3">
          <div>
            <div className="small fw-medium mb-1">{t('Para')}</div>
            <div className="segmented">
              {types.map((ty) => (
                <button key={ty} type="button" className={ty === type ? 'active' : ''} onClick={() => setType(ty)}>{mealTypeLabel(ty)}</button>
              ))}
            </div>
          </div>
          <Form.Control size="sm" style={{ maxWidth: 280 }} placeholder={t('Opcional: algo rápido, sin horno…')} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
          <Button onClick={generate} disabled={!ingredients.length || loading}>
            {loading ? <><Spinner size="sm" /> {t('Pensando…')}</> : t('✨ ¿Qué cocino?')}
          </Button>
        </div>
      </div>

      {result && (
        <article className="fridge-result">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div>
              <span className="meal-type" style={{ background: style.bg, color: style.fg }}>{style.icon} {mealTypeLabel(result.type)}</span>
              <h4 className="mt-2 mb-1">{result.name}</h4>
              <p className="text-muted small mb-2">{result.description}</p>
            </div>
            <button className={`meal-act ${isFavorite(result.name) ? 'on fav' : ''}`} title={t('Guardar como favorita')} onClick={() => onToggleFavorite(result)}>
              {isFavorite(result.name) ? '★' : '☆'}
            </button>
          </div>
          <div className="recipe-stats">
            <div><span>{t('Tiempo')}</span><b>{result.recipe?.timeMinutes ?? '—'} min</b></div>
            <div><span>{t('Calorías')}</span><b>{result.calories}</b></div>
            <div><span>{t('Proteína')}</span><b>{result.protein} g</b></div>
            <div><span>{t('Carbos')}</span><b>{result.carbs} g</b></div>
            <div><span>{t('Grasas')}</span><b>{result.fat} g</b></div>
          </div>
          <div className="fridge-cols">
            <div>
              <h6 className="recipe-h">{t('Ingredientes')}</h6>
              <ul className="fridge-ing">{result.ingredients.map((i) => <li key={i.name}><span className="qty">{qty(i)}</span> {i.name}</li>)}</ul>
            </div>
            <div>
              <h6 className="recipe-h">{t('Preparación')}</h6>
              <ol className="recipe-steps">{result.recipe?.steps?.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
          </div>
          {todayMeal && (
            <div className="fridge-use">
              <span>{t('¿Te gusta? Reemplazá tu {{type}} de hoy', { type: mealTypeLabel(type).toLowerCase() })} (<i>{todayMeal.name}</i>). {t('Se ajustan las porciones a ese lugar del plan.')}</span>
              <Button
                size="sm"
                onClick={async () => {
                  await onUseInPlan(todayMeal, result);
                  toast.success(i18n.t('Listo, cambiamos tu {{type}} de hoy', { type: mealTypeLabel(type).toLowerCase() }));
                  setResult(null);
                }}
              >
                {t('Usar en el plan de hoy')}
              </Button>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
