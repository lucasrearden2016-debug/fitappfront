import { useEffect, useState } from 'react';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import api, { showError } from '../../api/client';
import FoodSearch from './FoodSearch';
import FoodForm from './FoodForm';
import { isLinked, linkFood, macrosOf, sumIngredients, unlink } from '../../utils/foods';
import { cleanDecimal, toInput, toNum } from '../../utils/num';
import { brandLabel, dayLabel, dayShort, mealTypeLabel, unitLabel } from '../../i18n/labels';
import { useTranslation } from 'react-i18next';

const LINK_KEYS = ['foodId', 'brand', 'per100', 'baseUnit', 'unitName', 'unitGrams'];
const pickLink = (i) => Object.fromEntries(LINK_KEYS.filter((k) => i[k] != null && i[k] !== '').map((k) => [k, i[k]]));

export const MEAL_TYPES = ['desayuno', 'colación', 'almuerzo', 'merienda', 'cena', 'snack'];
const UNITS = ['g', 'ml', 'unidad', 'cda', 'cdita', 'taza', 'a gusto'];
const emptyIng = () => ({ amount: '', unit: 'g', name: '' });

const blank = (type) => ({
  type, name: '', description: '', ingredients: [emptyIng()],
  calories: '', protein: '', carbs: '', fat: '', steps: '',
});

const fromMeal = (m) => ({
  type: m.type,
  name: m.name,
  description: m.description ?? '',
  ingredients: m.ingredients?.length
    ? m.ingredients.map((i) => ({ amount: i.amount ? toInput(i.amount) : '', unit: i.unit || 'g', name: i.name, section: i.section, ...pickLink(i) }))
    : [emptyIng()],
  calories: toInput(m.calories),
  protein: toInput(m.protein),
  carbs: toInput(m.carbs),
  fat: toInput(m.fat),
  steps: m.recipe?.steps?.join('\n') ?? '',
});

/**
 * Modal para cargar o editar una comida a mano.
 * La IA es opcional: solo si tocás "Calcular macros".
 */
export default function MealEditor({ show, meal, defaultType, days = [], dayIndex = 0, favorites = [], onHide, onSave, mode = 'plan' }) {
  const { t } = useTranslation();
  const isFav = mode === 'favorite';
  const [form, setForm] = useState(blank(defaultType));
  const [repeat, setRepeat] = useState([]);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState(false); // macros escritos a mano (no calculados con alimentos)
  const [creatingFood, setCreatingFood] = useState(null); // { index, name }
  const editing = !!meal;

  useEffect(() => {
    if (!show) return;
    setForm(meal ? fromMeal(meal) : blank(defaultType || 'almuerzo'));
    setManual(!!meal && !meal.ingredients?.some(isLinked));
    setRepeat([]);
    setCreatingFood(null);
  }, [show, meal, defaultType]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setIng = (i, patch) => set({ ingredients: form.ingredients.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const linkedCount = form.ingredients.filter(isLinked).length;
  const unlinkedCount = form.ingredients.filter((i) => i.name.trim() && !isLinked(i) && i.unit !== 'a gusto').length;
  const auto = linkedCount > 0 && !manual;
  const computed = sumIngredients(form.ingredients);
  // Lo que se muestra/guarda: calculado con alimentos o escrito a mano
  const macro = (k) => (auto ? Math.round(computed[k]) : form[k]);
  const kcalFromMacros = Math.round((toNum(macro('protein')) || 0) * 4 + (toNum(macro('carbs')) || 0) * 4 + (toNum(macro('fat')) || 0) * 9);

  const setMacro = (k, v) => {
    if (auto) {
      // pasar a manual partiendo de lo calculado, para que no "salten" los números
      setForm((f) => ({ ...f, calories: Math.round(computed.calories), protein: Math.round(computed.protein), carbs: Math.round(computed.carbs), fat: Math.round(computed.fat), [k]: v }));
      setManual(true);
    } else set({ [k]: v });
  };

  const pickFood = (i, food) => setIng(i, linkFood(food));

  const cleanIngredients = () =>
    form.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), amount: toNum(i.amount) || 0, unit: i.unit, section: i.section, ...pickLink(i) }));

  const estimate = async () => {
    setEstimating(true);
    try {
      const { data } = await api.post('/mealplans/estimate', {
        name: form.name,
        description: form.description,
        ingredients: cleanIngredients().map(({ section: _s, ...i }) => i),
      });
      set({
        calories: toInput(data.calories), protein: toInput(data.protein), carbs: toInput(data.carbs), fat: toInput(data.fat),
        ingredients: data.ingredients.map((i) => ({ amount: i.amount || '', unit: i.unit, name: i.name, section: i.section, ...pickLink(i) })),
      });
      setManual(true);
    } catch (err) {
      showError(err);
    } finally {
      setEstimating(false);
    }
  };

  const fromFavorite = (id) => {
    const fav = favorites.find((f) => f._id === id);
    if (fav) {
      setForm({ ...fromMeal(fav), type: form.type });
      setManual(!fav.ingredients?.some(isLinked));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const steps = form.steps.split('\n').map((s) => s.trim()).filter(Boolean);
    try {
      await onSave({
        meal: {
          type: form.type,
          name: form.name.trim(),
          description: form.description.trim(),
          ingredients: cleanIngredients(),
          calories: toNum(macro('calories')) || kcalFromMacros,
          protein: toNum(macro('protein')) || 0,
          carbs: toNum(macro('carbs')) || 0,
          fat: toNum(macro('fat')) || 0,
          ...(steps.length && { recipe: { steps, timeMinutes: meal?.recipe?.timeMinutes ?? 0 } }),
        },
        repeatDays: repeat,
      });
    } finally {
      setSaving(false);
    }
  };

  if (show && creatingFood) {
    return (
      <Modal show onHide={onHide} size="lg" scrollable fullscreen="sm-down" className="meal-editor-modal">
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            <button type="button" className="me-back" onClick={() => setCreatingFood(null)}>←</button> {t('Nuevo alimento')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FoodForm
            initialName={creatingFood.name}
            onCancel={() => setCreatingFood(null)}
            onSaved={(food) => {
              pickFood(creatingFood.index, food);
              setCreatingFood(null);
            }}
          />
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable fullscreen="sm-down" className="meal-editor-modal">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            {isFav ? (editing ? t('Editar favorita') : t('Nueva favorita')) : editing ? t('Editar comida') : `${t('Agregar comida')} · ${dayLabel(days[dayIndex] ?? '')}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="meal-editor">
          {!editing && !isFav && favorites.length > 0 && (
            <Form.Select className="mb-3" defaultValue="" onChange={(e) => fromFavorite(e.target.value)}>
              <option value="" disabled>{t('⭐ Cargar desde mis favoritas…')}</option>
              {favorites.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </Form.Select>
          )}

          <div className="segmented mb-3">
            {MEAL_TYPES.map((ty) => (
              <button key={ty} type="button" className={form.type === ty ? 'active' : ''} onClick={() => set({ type: ty })}>{mealTypeLabel(ty)}</button>
            ))}
          </div>

          <Form.Control className="me-name" placeholder={t('Nombre de la comida')} value={form.name} onChange={(e) => set({ name: e.target.value })} required maxLength={120} autoFocus />
          <Form.Control className="mt-2" size="sm" placeholder={t('Descripción (opcional)')} value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={500} />

          <h6 className="recipe-h">{t('Ingredientes')}</h6>
          {form.ingredients.map((ing, i) => {
            const linked = isLinked(ing);
            const units = linked ? [ing.baseUnit, ...(ing.unitName ? [ing.unitName] : [])] : UNITS;
            const m = linked ? macrosOf(ing) : null;
            return (
              <div className={`me-ing ${linked ? 'linked' : ''}`} key={i}>
                <Form.Control size="sm" inputMode="decimal" placeholder={t('Cant.')} value={ing.amount} disabled={ing.unit === 'a gusto'} onChange={(e) => setIng(i, { amount: cleanDecimal(e.target.value) })} />
                <Form.Select size="sm" value={ing.unit} onChange={(e) => setIng(i, { unit: e.target.value })}>
                  {units.map((u) => <option key={u} value={u}>{unitLabel(u)}</option>)}
                </Form.Select>
                <FoodSearch
                  value={ing.name}
                  linked={linked}
                  onType={(name) => setIng(i, linked ? { ...unlink(ing), name, unit: 'g' } : { name })}
                  onPick={(food) => pickFood(i, food)}
                  onCreate={(name) => setCreatingFood({ index: i, name })}
                  onEnter={() => set({ ingredients: [...form.ingredients, emptyIng()] })}
                />
                <button type="button" className="me-remove" title={t('Quitar')} onClick={() => set({ ingredients: form.ingredients.filter((_, j) => j !== i) })}>×</button>
                {linked && (
                  <div className="me-ing-meta">
                    🔗 {brandLabel(ing.brand)} · <b>{Math.round(m.calories)} kcal</b> · P {Math.round(m.protein)} · C {Math.round(m.carbs)} · G {Math.round(m.fat)}
                  </div>
                )}
              </div>
            );
          })}
          <button type="button" className="gt-new" onClick={() => set({ ingredients: [...form.ingredients, emptyIng()] })}>{t('+ Ingrediente')}</button>

          <div className="d-flex justify-content-between align-items-end mt-3 mb-2">
            <h6 className="recipe-h m-0">{t('Macros')}</h6>
            <Button size="sm" variant="light" onClick={estimate} disabled={!form.name.trim() || estimating}>
              {estimating ? <><Spinner size="sm" /> {t('Calculando…')}</> : t('✨ Calcular macros con IA')}
            </Button>
          </div>
          <Row className="g-2">
            {[['calories', 'kcal'], ['protein', 'Proteína (g)'], ['carbs', 'Carbos (g)'], ['fat', 'Grasas (g)']].map(([k, label]) => (
              <Col xs={6} md={3} key={k}>
                <Form.Label className="small text-muted mb-1">{t(label)}</Form.Label>
                <Form.Control
                  size="sm"
                  inputMode="decimal"
                  value={macro(k)}
                  className={auto ? 'is-auto' : ''}
                  placeholder={k === 'calories' && kcalFromMacros ? String(kcalFromMacros) : '0'}
                  onChange={(e) => setMacro(k, cleanDecimal(e.target.value))}
                />
              </Col>
            ))}
          </Row>
          {auto ? (
            <div className="field-help me-auto-note">
              {t('✓ Calculado con tus alimentos')}{unlinkedCount > 0 && ` · ${t('{{n}} sin vincular (no suman)', { n: unlinkedCount })}`}
            </div>
          ) : linkedCount > 0 ? (
            <div className="field-help">
              {t('Macros escritos a mano.')} <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={() => setManual(false)}>{t('↺ Calcular con los alimentos')}</button>
            </div>
          ) : (
            <div className="field-help">{t('Buscá los ingredientes en Alimentos y los macros se calculan solos. Si no, escribilos o tocá “Calcular con IA”.')}</div>
          )}

          <h6 className="recipe-h">{t('Preparación (opcional)')}</h6>
          <Form.Control as="textarea" rows={3} size="sm" placeholder={t('Un paso por línea.\nSi lo dejás vacío, la IA escribe la receta cuando la abras.')} value={form.steps} onChange={(e) => set({ steps: e.target.value })} />

          {!editing && !isFav && (
            <>
              <h6 className="recipe-h">{t('Repetir también en')}</h6>
              <div className="segmented">
                {days.map((d, i) => i !== dayIndex && (
                  <button
                    key={d}
                    type="button"
                    className={repeat.includes(i) ? 'active' : ''}
                    onClick={() => setRepeat((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]))}
                  >
                    {dayShort(d)}
                  </button>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide}>{t('Cancelar')}</Button>
          <Button type="submit" disabled={!form.name.trim() || saving}>
            {saving ? <Spinner size="sm" /> : editing ? t('Guardar cambios') : isFav ? t('Guardar favorita') : repeat.length ? t('Agregar a {{n}} días', { n: repeat.length + 1 }) : t('Agregar')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
