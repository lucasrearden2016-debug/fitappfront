import { useEffect, useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { mealStyle, sumMacros } from './mealUtils';
import { dayLabel, mealTypeLabel } from '../../i18n/labels';
import { useTranslation } from 'react-i18next';

const typeLabel = (ty, t) => (ty === 'todas' ? t('todas') : mealTypeLabel(ty));

// Elegir una favorita para el día, viendo cuánto falta para llegar al objetivo
export default function FavoritePicker({ show, onHide, day, targets, favorites, defaultType, onPick, onCreate }) {
  const { t } = useTranslation();
  const [type, setType] = useState('todas');
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    if (show) setType(defaultType && favorites.some((f) => f.type?.toLowerCase() === defaultType) ? defaultType : 'todas');
  }, [show, defaultType, favorites]);

  if (!day) return null;
  const totals = sumMacros(day.meals);
  const left = {
    calories: Math.round(targets.calories - totals.calories),
    protein: Math.round(targets.protein - totals.protein),
    carbs: Math.round(targets.carbs - totals.carbs),
    fat: Math.round(targets.fat - totals.fat),
  };
  const types = [...new Set(favorites.map((f) => f.type?.toLowerCase()).filter(Boolean))];
  const fits = (f) => f.calories <= left.calories * 1.1;
  const list = favorites
    .filter((f) => type === 'todas' || f.type?.toLowerCase() === type)
    .sort((a, b) => Number(fits(b)) - Number(fits(a)) || b.protein - a.protein);

  const pick = async (f) => {
    setAdding(f._id);
    try {
      await onPick(f);
    } finally {
      setAdding(null);
    }
  };

  return (
    <Modal show={show} onHide={onHide} scrollable fullscreen="sm-down" className="fav-picker">
      <Modal.Header closeButton>
        <Modal.Title as="h5">{t('⭐ Agregar desde favoritas')} · {dayLabel(day.day)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="picker-left">
          <span className="text-muted small">{t('Te falta para hoy')}</span>
          <div className="picker-left-values">
            {[['calories', 'kcal'], ['protein', 'P'], ['carbs', 'C'], ['fat', 'G']].map(([k, label]) => (
              <span key={k} className={left[k] < 0 ? 'over' : ''}>
                <b>{left[k]}</b> {label === 'kcal' ? 'kcal' : `g ${label}`}
              </span>
            ))}
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted">{t('Todavía no tenés favoritas.')}</p>
            <Button variant="light" onClick={onCreate}>{t('+ Crear una favorita')}</Button>
          </div>
        ) : (
          <>
            <div className="segmented mb-2">
              {['todas', ...types].map((ty) => (
                <button key={ty} type="button" className={ty === type ? 'active' : ''} onClick={() => setType(ty)}>{typeLabel(ty, t)}</button>
              ))}
            </div>
            <ul className="picker-list">
              {list.map((f) => {
                const style = mealStyle(f.type);
                return (
                  <li key={f._id} className={fits(f) ? '' : 'too-much'}>
                    <span className="picker-icon" style={{ background: style.bg }}>{style.icon}</span>
                    <div className="picker-info">
                      <div className="picker-name">{f.name}</div>
                      <div className="picker-macros">
                        {Math.round(f.calories)} kcal · P {Math.round(f.protein)} · C {Math.round(f.carbs)} · G {Math.round(f.fat)}
                        {!fits(f) && <span className="picker-warn"> · {t('te pasás')}</span>}
                      </div>
                    </div>
                    <Button size="sm" variant={fits(f) ? 'primary' : 'light'} disabled={!!adding} onClick={() => pick(f)}>
                      {adding === f._id ? <Spinner size="sm" /> : '+'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide}>{t('Listo')}</Button>
      </Modal.Footer>
    </Modal>
  );
}
