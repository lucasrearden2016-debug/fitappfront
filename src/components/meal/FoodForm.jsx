import { useState } from 'react';
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import api, { showError } from '../../api/client';
import { checkFood } from '../../utils/foods';
import { cleanDecimal, fmtNum, toInput, toNum } from '../../utils/num';
import { sectionLabel } from '../../i18n/labels';
import { useTranslation } from 'react-i18next';

const SECTIONS = ['Verdulería', 'Carnicería y pescadería', 'Lácteos y huevos', 'Almacén', 'Panadería', 'Congelados', 'Otros'];

const fromFood = (f) => ({
  name: f?.name ?? '',
  brand: f?.brand && f.brand !== 'Genérico' ? f.brand : '',
  generic: f ? f.brand === 'Genérico' : false,
  baseUnit: f?.baseUnit ?? 'g',
  calories: toInput(f?.calories),
  protein: toInput(f?.protein),
  carbs: toInput(f?.carbs),
  fat: toInput(f?.fat),
  fiber: toInput(f?.fiber),
  sugar: toInput(f?.sugar),
  sodiumMg: toInput(f?.sodiumMg),
  byUnit: !!f?.unitName,
  unitName: f?.unitName ?? 'unidad',
  unitGrams: toInput(f?.unitGrams),
  section: f?.section ?? 'Otros',
});

/**
 * Formulario de alimento (valores por 100 g / 100 ml).
 * onSaved(food) recibe el alimento creado o, si ya existía, el existente.
 */
export default function FoodForm({ food, initialName = '', onSaved, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => ({ ...fromFood(food), ...(!food && initialName && { name: initialName }) }));
  const [more, setMore] = useState(!!(food?.fiber || food?.sugar || food?.sodiumMg));
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const warning = checkFood(form);
  const num = toNum;

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // no disparar el submit del editor de comidas que lo contiene
    setSaving(true);
    setDuplicate(null);
    const body = {
      name: form.name.trim(),
      brand: form.generic ? 'Genérico' : form.brand.trim(),
      baseUnit: form.baseUnit,
      calories: num(form.calories),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
      fiber: num(form.fiber),
      sugar: num(form.sugar),
      sodiumMg: num(form.sodiumMg),
      unitName: form.byUnit ? form.unitName.trim() : '',
      unitGrams: form.byUnit ? num(form.unitGrams) : null,
      section: form.section,
    };
    try {
      const { data } = food ? await api.put(`/foods/${food._id}`, body) : await api.post('/foods', body);
      onSaved(data);
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.food) setDuplicate(err.response.data.food);
      else showError(err);
    } finally {
      setSaving(false);
    }
  };

  const unitLabel = form.baseUnit === 'ml' ? '100 ml' : '100 g';

  return (
    <Form onSubmit={submit} className="food-form">
      <Form.Control className="me-name mb-2" placeholder={t('Nombre (ej. Arroz blanco)')} value={form.name} onChange={(e) => set({ name: e.target.value })} required maxLength={80} autoFocus />
      <div className="d-flex gap-2 align-items-center mb-3">
        <Form.Control placeholder={t('Marca (ej. Saman)')} value={form.generic ? '' : form.brand} disabled={form.generic} onChange={(e) => set({ brand: e.target.value })} maxLength={60} required={!form.generic} />
        <Form.Check type="switch" id="food-generic" label={t('Genérico')} checked={form.generic} onChange={(e) => set({ generic: e.target.checked })} className="text-nowrap" />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="recipe-h m-0">{t('Valores cada {{unit}}', { unit: unitLabel })}</h6>
        <div className="segmented">
          {['g', 'ml'].map((u) => (
            <button key={u} type="button" className={form.baseUnit === u ? 'active' : ''} onClick={() => set({ baseUnit: u })}>{u === 'g' ? t('Sólido (g)') : t('Líquido (ml)')}</button>
          ))}
        </div>
      </div>
      <Row className="g-2">
        {[['calories', 'kcal'], ['protein', 'Proteína (g)'], ['carbs', 'Carbos (g)'], ['fat', 'Grasas (g)']].map(([k, label]) => (
          <Col xs={6} md={3} key={k}>
            <Form.Label className="small text-muted mb-1">{t(label)}</Form.Label>
            <Form.Control inputMode="decimal" placeholder="0" value={form[k]} onChange={(e) => set({ [k]: cleanDecimal(e.target.value) })} required />
          </Col>
        ))}
      </Row>
      {warning && <div className="food-warning">⚠️ {t(warning.key, warning.vars)}</div>}
      <div className="field-help">{t('Copialos de la etiqueta del paquete (columna “por 100 g”).')}</div>

      <button type="button" className="gt-new mt-2" onClick={() => setMore((m) => !m)}>{more ? t('− Menos datos') : t('+ Fibra, azúcar, sodio')}</button>
      {more && (
        <Row className="g-2 mt-1">
          {[['fiber', 'Fibra (g)'], ['sugar', 'Azúcares (g)'], ['sodiumMg', 'Sodio (mg)']].map(([k, label]) => (
            <Col xs={4} key={k}>
              <Form.Label className="small text-muted mb-1">{t(label)}</Form.Label>
              <Form.Control inputMode="decimal" value={form[k]} onChange={(e) => set({ [k]: cleanDecimal(e.target.value) })} />
            </Col>
          ))}
        </Row>
      )}

      <h6 className="recipe-h">{t('Unidad (opcional)')}</h6>
      <Form.Check type="switch" id="food-unit" label={t('También se usa por unidad (huevo, rebanada, feta…)')} checked={form.byUnit} onChange={(e) => set({ byUnit: e.target.checked })} />
      {form.byUnit && (
        <div className="d-flex gap-2 align-items-center mt-2">
          <span className="small text-muted">1</span>
          <Form.Control style={{ maxWidth: 140 }} value={form.unitName} onChange={(e) => set({ unitName: e.target.value })} maxLength={20} placeholder={t('unidad')} />
          <span className="small text-muted">=</span>
          <Form.Control style={{ maxWidth: 100 }} inputMode="decimal" value={form.unitGrams} onChange={(e) => set({ unitGrams: cleanDecimal(e.target.value) })} required placeholder="50" />
          <span className="small text-muted">{form.baseUnit}</span>
        </div>
      )}

      <h6 className="recipe-h">{t('Sección del súper')}</h6>
      <Form.Select value={form.section} onChange={(e) => set({ section: e.target.value })}>
        {SECTIONS.map((s) => <option key={s} value={s}>{sectionLabel(s)}</option>)}
      </Form.Select>

      {duplicate && (
        <div className="food-dup">
          {t('Ya existe')} <b>{duplicate.name} · {duplicate.brand}</b> ({fmtNum(duplicate.calories)} kcal/100{duplicate.baseUnit}).
          <Button size="sm" className="ms-2" onClick={() => onSaved(duplicate)}>{t('Usar ese')}</Button>
        </div>
      )}

      <div className="d-flex justify-content-end gap-2 mt-3">
        {onCancel && <Button variant="light" onClick={onCancel}>{t('Cancelar')}</Button>}
        <Button type="submit" disabled={saving || !!warning || !form.name.trim()}>
          {saving ? <Spinner size="sm" /> : food ? t('Guardar cambios') : t('Crear alimento')}
        </Button>
      </div>
      {!food && <p className="field-help mt-2 mb-0">{t('Los alimentos son públicos: los ve y usa toda la comunidad de fitapp.')}</p>}
    </Form>
  );
}
