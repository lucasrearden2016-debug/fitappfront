import { useEffect, useState } from 'react';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import api, { showError } from '../../api/client';
import { shortDay } from './mealUtils';

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
    ? m.ingredients.map((i) => ({ amount: i.amount || '', unit: i.unit || 'g', name: i.name, section: i.section }))
    : [emptyIng()],
  calories: m.calories ?? '',
  protein: m.protein ?? '',
  carbs: m.carbs ?? '',
  fat: m.fat ?? '',
  steps: m.recipe?.steps?.join('\n') ?? '',
});

/**
 * Modal para cargar o editar una comida a mano.
 * La IA es opcional: solo si tocás "Calcular macros".
 */
export default function MealEditor({ show, meal, defaultType, days = [], dayIndex = 0, favorites = [], onHide, onSave, mode = 'plan' }) {
  const isFav = mode === 'favorite';
  const [form, setForm] = useState(blank(defaultType));
  const [repeat, setRepeat] = useState([]);
  const [estimating, setEstimating] = useState(false);
  const [saving, setSaving] = useState(false);
  const editing = !!meal;

  useEffect(() => {
    if (!show) return;
    setForm(meal ? fromMeal(meal) : blank(defaultType || 'almuerzo'));
    setRepeat([]);
  }, [show, meal, defaultType]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setIng = (i, patch) => set({ ingredients: form.ingredients.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const kcalFromMacros = Math.round((+form.protein || 0) * 4 + (+form.carbs || 0) * 4 + (+form.fat || 0) * 9);

  const cleanIngredients = () =>
    form.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name.trim(), amount: Number(String(i.amount).replace(',', '.')) || 0, unit: i.unit, section: i.section }));

  const estimate = async () => {
    setEstimating(true);
    try {
      const { data } = await api.post('/mealplans/estimate', {
        name: form.name,
        description: form.description,
        ingredients: cleanIngredients().map(({ section: _s, ...i }) => i),
      });
      set({
        calories: data.calories, protein: data.protein, carbs: data.carbs, fat: data.fat,
        ingredients: data.ingredients.map((i) => ({ amount: i.amount || '', unit: i.unit, name: i.name, section: i.section })),
      });
    } catch (err) {
      showError(err);
    } finally {
      setEstimating(false);
    }
  };

  const fromFavorite = (id) => {
    const fav = favorites.find((f) => f._id === id);
    if (fav) setForm({ ...fromMeal(fav), type: form.type });
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
          calories: Number(form.calories) || kcalFromMacros,
          protein: Number(form.protein) || 0,
          carbs: Number(form.carbs) || 0,
          fat: Number(form.fat) || 0,
          ...(steps.length && { recipe: { steps, timeMinutes: meal?.recipe?.timeMinutes ?? 0 } }),
        },
        repeatDays: repeat,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable fullscreen="sm-down" className="meal-editor-modal">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
          <Modal.Title as="h5">
            {isFav ? (editing ? 'Editar favorita' : 'Nueva favorita') : editing ? 'Editar comida' : `Agregar comida · ${days[dayIndex] ?? ''}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="meal-editor">
          {!editing && !isFav && favorites.length > 0 && (
            <Form.Select className="mb-3" defaultValue="" onChange={(e) => fromFavorite(e.target.value)}>
              <option value="" disabled>⭐ Cargar desde mis favoritas…</option>
              {favorites.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </Form.Select>
          )}

          <div className="segmented mb-3">
            {MEAL_TYPES.map((t) => (
              <button key={t} type="button" className={form.type === t ? 'active' : ''} onClick={() => set({ type: t })}>{t}</button>
            ))}
          </div>

          <Form.Control className="me-name" placeholder="Nombre de la comida" value={form.name} onChange={(e) => set({ name: e.target.value })} required maxLength={120} autoFocus />
          <Form.Control className="mt-2" size="sm" placeholder="Descripción (opcional)" value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={500} />

          <h6 className="recipe-h">Ingredientes</h6>
          {form.ingredients.map((ing, i) => (
            <div className="me-ing" key={i}>
              <Form.Control size="sm" inputMode="decimal" placeholder="Cant." value={ing.amount} disabled={ing.unit === 'a gusto'} onChange={(e) => setIng(i, { amount: e.target.value })} />
              <Form.Select size="sm" value={ing.unit} onChange={(e) => setIng(i, { unit: e.target.value })}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </Form.Select>
              <Form.Control
                size="sm"
                placeholder="Ingrediente"
                value={ing.name}
                onChange={(e) => setIng(i, { name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    set({ ingredients: [...form.ingredients, emptyIng()] });
                  }
                }}
              />
              <button type="button" className="me-remove" title="Quitar" onClick={() => set({ ingredients: form.ingredients.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          <button type="button" className="gt-new" onClick={() => set({ ingredients: [...form.ingredients, emptyIng()] })}>+ Ingrediente</button>

          <div className="d-flex justify-content-between align-items-end mt-3 mb-2">
            <h6 className="recipe-h m-0">Macros</h6>
            <Button size="sm" variant="light" onClick={estimate} disabled={!form.name.trim() || estimating}>
              {estimating ? <><Spinner size="sm" /> Calculando…</> : '✨ Calcular macros con IA'}
            </Button>
          </div>
          <Row className="g-2">
            {[['calories', 'kcal'], ['protein', 'Proteína (g)'], ['carbs', 'Carbos (g)'], ['fat', 'Grasas (g)']].map(([k, label]) => (
              <Col xs={6} md={3} key={k}>
                <Form.Label className="small text-muted mb-1">{label}</Form.Label>
                <Form.Control
                  size="sm"
                  type="number"
                  min={0}
                  value={form[k]}
                  placeholder={k === 'calories' && kcalFromMacros ? String(kcalFromMacros) : '0'}
                  onChange={(e) => set({ [k]: e.target.value })}
                />
              </Col>
            ))}
          </Row>
          <div className="field-help">Si no sabés los macros, tocá “Calcular”. Si dejás kcal vacío se calcula de P/C/G.</div>

          <h6 className="recipe-h">Preparación (opcional)</h6>
          <Form.Control as="textarea" rows={3} size="sm" placeholder={'Un paso por línea.\nSi lo dejás vacío, la IA escribe la receta cuando la abras.'} value={form.steps} onChange={(e) => set({ steps: e.target.value })} />

          {!editing && !isFav && (
            <>
              <h6 className="recipe-h">Repetir también en</h6>
              <div className="segmented">
                {days.map((d, i) => i !== dayIndex && (
                  <button
                    key={d}
                    type="button"
                    className={repeat.includes(i) ? 'active' : ''}
                    onClick={() => setRepeat((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]))}
                  >
                    {shortDay(d)}
                  </button>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide}>Cancelar</Button>
          <Button type="submit" disabled={!form.name.trim() || saving}>
            {saving ? <Spinner size="sm" /> : editing ? 'Guardar cambios' : isFav ? 'Guardar favorita' : repeat.length ? `Agregar a ${repeat.length + 1} días` : 'Agregar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
