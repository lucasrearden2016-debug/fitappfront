import { useEffect } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { closePremiumPrompt, fetchPlan, openPremiumPrompt } from '../../store/planSlice';
import { Diamond, PREMIUM_FEATURES } from './premiumUtils';
import './premium.css';

// Se abre solo cuando el back responde PREMIUM_REQUIRED (ver api/client.js)
export default function PremiumModal() {
  const { t } = useTranslation();
  const open = useSelector((s) => s.plan.promptOpen);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const onRequired = () => {
      dispatch(openPremiumPrompt());
      dispatch(fetchPlan());
    };
    window.addEventListener('premium-required', onRequired);
    return () => window.removeEventListener('premium-required', onRequired);
  }, [dispatch]);

  const close = () => dispatch(closePremiumPrompt());
  const goPlans = () => {
    close();
    navigate('/premium');
  };

  return (
    <Modal show={open} onHide={close} centered className="premium-modal">
      <Modal.Body className="p-4 text-center">
        <div className="premium-gem mx-auto mb-3"><Diamond size={30} /></div>
        <h4 className="mb-2">{t('Esta función es Premium')}</h4>
        <p className="text-muted mb-3">{t('Tu prueba gratis terminó. Con Premium usás toda la IA de FittingUp, sin anuncios.')}</p>
        <ul className="premium-list text-start mb-4">
          {PREMIUM_FEATURES.map((f) => <li key={f}>{t(f)}</li>)}
        </ul>
        <div className="d-grid gap-2">
          <Button onClick={goPlans}>{t('Ver planes · desde US$2,50/mes')}</Button>
          <Button variant="ghost" onClick={close}>{t('Ahora no')}</Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
