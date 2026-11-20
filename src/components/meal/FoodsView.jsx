import { useEffect, useRef, useState } from 'react';
import { Button, Dropdown, Form, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api, { showError } from '../../api/client';
import FoodForm from './FoodForm';
import { fmtNum } from '../../utils/num';
import i18n from '../../i18n';
import { brandLabel } from '../../i18n/labels';
import { useTranslation } from 'react-i18next';

// 🥫 Base pública de alimentos: buscar, crear, editar los propios, reportar
export default function FoodsView() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [mine, setMine] = useState(false);
  const [foods, setFoods] = useState(null);
  const [editing, setEditing] = useState(null); // {} nuevo | food
  const timer = useRef(null);

  const load = (query, onlyMine) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/foods', { params: { q: query, mine: onlyMine ? 1 : undefined, limit: 50 } });
        setFoods(data);
      } catch (err) {
        showError(err);
      }
    }, 200);
  };

  useEffect(() => {
    load(q, mine);
    return () => clearTimeout(timer.current);
  }, [q, mine]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (f) => {
    if (!confirm(i18n.t('¿Borrar "{{name}}" de la base? Las comidas que ya lo usan no cambian.', { name: `${f.name} · ${brandLabel(f.brand)}` }))) return;
    try {
      await api.delete(`/foods/${f._id}`);
      setFoods((list) => list.filter((x) => x._id !== f._id));
    } catch (err) {
      showError(err);
    }
  };

  const report = async (f) => {
    if (!confirm(i18n.t('¿Reportar "{{name}}" por tener valores incorrectos?', { name: `${f.name} · ${brandLabel(f.brand)}` }))) return;
    try {
      await api.post(`/foods/${f._id}/report`);
      setFoods((list) => list.map((x) => (x._id === f._id ? { ...x, reported: true } : x)));
      toast.info(i18n.t('Gracias, lo vamos a revisar'));
    } catch (err) {
      showError(err);
    }
  };

  const saved = (food) => {
    setEditing(null);
    setFoods((list) => {
      const rest = (list ?? []).filter((x) => x._id !== food._id);
      return [food, ...rest];
    });
    toast.success(i18n.t('Alimento guardado'));
  };

  return (
    <div className="foods">
      <div className="favs-head">
        <div>
          <h5 className="mb-1">{t('Alimentos')}</h5>
          <p className="text-muted small mb-0">{t('Base compartida por toda la comunidad. Valores cada 100 g o 100 ml.')}</p>
        </div>
        <Button onClick={() => setEditing({})}>{t('+ Nuevo alimento')}</Button>
      </div>

      <div className="d-flex gap-2 align-items-center mb-3">
        <Form.Control placeholder={t('Buscar: arroz, leche, pollo…')} value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="segmented flex-none">
          <button type="button" className={!mine ? 'active' : ''} onClick={() => setMine(false)}>{t('Todos')}</button>
          <button type="button" className={mine ? 'active' : ''} onClick={() => setMine(true)}>{t('Míos')}</button>
        </div>
      </div>

      {!foods ? (
        <Spinner size="sm" />
      ) : foods.length === 0 ? (
        <div className="gym-empty">
          <div className="gym-empty-icon">🥫</div>
          <h5>{q ? t('No encontramos “{{q}}”', { q }) : t('Todavía no hay alimentos')}</h5>
          <p className="text-muted small mb-3">{t('Cargalo con los datos de la etiqueta y queda disponible para todos.')}</p>
          <Button onClick={() => setEditing({ name: q })}>{q ? t('+ Crear “{{q}}”', { q }) : t('+ Nuevo alimento')}</Button>
        </div>
      ) : (
        <ul className="food-list">
          {foods.map((f) => (
            <li key={f._id}>
              <div className="fl-main">
                <div className="fl-name">
                  {f.name} <span className="fl-brand">{brandLabel(f.brand)}</span>
                </div>
                <div className="fl-macros">
                  <b>{Math.round(f.calories)} kcal</b> · P {fmtNum(f.protein)} · C {fmtNum(f.carbs)} · G {fmtNum(f.fat)}
                  <span className="text-muted"> /100{f.baseUnit}</span>
                  {f.unitName && <span className="text-muted"> · 1 {f.unitName} = {fmtNum(f.unitGrams)}{f.baseUnit}</span>}
                </div>
              </div>
              <span className="fl-uses" title={t('Veces usado')}>{f.uses > 0 ? t('{{n}} usos', { n: f.uses }) : t('nuevo')}</span>
              <Dropdown align="end" className="meal-menu">
                <Dropdown.Toggle as="button" className="meal-act" aria-label={t('Opciones')}>⋯</Dropdown.Toggle>
                <Dropdown.Menu>
                  {f.mine ? (
                    <>
                      <Dropdown.Item onClick={() => setEditing(f)}>{t('✎ Editar')}</Dropdown.Item>
                      <Dropdown.Item className="text-danger" onClick={() => remove(f)}>{t('🗑 Borrar')}</Dropdown.Item>
                    </>
                  ) : (
                    <Dropdown.Item disabled={f.reported} onClick={() => report(f)}>{f.reported ? t('✓ Reportado') : t('🚩 Reportar valores')}</Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </li>
          ))}
        </ul>
      )}

      <Modal show={!!editing} onHide={() => setEditing(null)} scrollable fullscreen="sm-down">
        <Modal.Header closeButton>
          <Modal.Title as="h5">{editing?._id ? t('Editar alimento') : t('Nuevo alimento')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editing && (
            <FoodForm food={editing._id ? editing : null} initialName={editing.name ?? ''} onSaved={saved} onCancel={() => setEditing(null)} />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
