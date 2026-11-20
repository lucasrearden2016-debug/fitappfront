import { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { fetchPlan } from '../store/planSlice';
import { Diamond, PREMIUM_FEATURES } from '../components/premium/premiumUtils';
import { dateFmt } from '../i18n/labels';
import { locale } from '../i18n';
import '../components/premium/premium.css';

const FREE_FEATURES = [
  'Plan de comidas armado por vos',
  'Alimentos, favoritas y lista de compras',
  'Rutina de gimnasio editable y progreso',
  'Registro de peso con ajuste de calorías',
];

export default function Premium() {
  const { t } = useTranslation();
  const plan = useSelector((s) => s.plan.data);
  const dispatch = useDispatch();
  const [billing, setBilling] = useState('year');

  useEffect(() => {
    dispatch(fetchPlan());
  }, [dispatch]);

  if (!plan) return <div className="text-center py-5"><Spinner /></div>;

  const { prices } = plan;
  const perMonth = billing === 'year' ? prices.year / 12 : prices.month;
  const saving = prices.month * 12 - prices.year;

  // Los pagos se enchufan cuando elijas proveedor (Paddle/Polar): acá va el checkout
  const choose = () => toast.info(t('Los pagos se habilitan muy pronto. ¡Gracias por el interés!'));

  return (
    <div className="premium-page">
      <header className="text-center mb-4">
        <div className="premium-gem mx-auto mb-3"><Diamond size={30} /></div>
        <h1 className="premium-title">FittingUp <span>Premium</span></h1>
        <p className="text-muted mb-0">{t('Toda la IA para tu dieta y tu entrenamiento. Sin anuncios.')}</p>
      </header>

      <PlanStatus plan={plan} />

      <div className="premium-toggle mx-auto mb-3" role="group" aria-label={t('Frecuencia de pago')}>
        <button className={billing === 'month' ? 'active' : ''} onClick={() => setBilling('month')}>{t('Mensual')}</button>
        <button className={billing === 'year' ? 'active' : ''} onClick={() => setBilling('year')}>
          {t('Anual')} <span className="premium-save">−{Math.round((saving / (prices.month * 12)) * 100)}%</span>
        </button>
      </div>

      <div className="premium-grid">
        <section className="premium-card">
          <h3>{t('Común')}</h3>
          <div className="premium-price">US$0</div>
          <p className="text-muted small">{t('Para siempre')}</p>
          <ul className="premium-list">
            {FREE_FEATURES.map((f) => <li key={f}>{t(f)}</li>)}
            <li className="off">{t('Sin funciones de IA')}</li>
          </ul>
        </section>

        <section className="premium-card featured">
          <span className="badge-premium premium-ribbon"><Diamond size={12} /> {t('Recomendado')}</span>
          <h3>Premium</h3>
          <div className="premium-price">
            US${billing === 'year' ? prices.year : prices.month}
            <small>/{billing === 'year' ? t('año') : t('mes')}</small>
          </div>
          <p className="text-muted small">
            {billing === 'year'
              ? t('Equivale a US${{n}}/mes · ahorrás US${{s}}', { n: perMonth.toLocaleString(locale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 }), s: saving })
              : t('Cancelás cuando quieras')}
          </p>
          <ul className="premium-list">
            <li>{t('Todo lo de Común')}</li>
            {PREMIUM_FEATURES.map((f) => <li key={f}>{t(f)}</li>)}
          </ul>
          <Button className="w-100 mt-auto" onClick={choose} disabled={plan.source === 'subscription'}>
            {plan.source === 'subscription' ? t('Ya sos Premium') : t('Pasarme a Premium')}
          </Button>
        </section>
      </div>
    </div>
  );
}

function PlanStatus({ plan }) {
  const { t } = useTranslation();
  if (plan.source === 'trial') {
    return (
      <div className="premium-status trial">
        <Diamond size={16} />
        <span>{t('Estás en tu prueba gratis de Premium: te quedan {{n}} días.', { n: plan.trialDaysLeft })}</span>
      </div>
    );
  }
  if (plan.source === 'subscription') {
    return (
      <div className="premium-status active">
        <Diamond size={16} />
        <span>
          {plan.status === 'canceled'
            ? t('Cancelaste tu suscripción: seguís con Premium hasta el {{d}}.', { d: dateFmt(plan.premiumUntil) })
            : t('Sos Premium. Se renueva el {{d}}.', { d: dateFmt(plan.premiumUntil) })}
        </span>
      </div>
    );
  }
  return <div className="premium-status">{t('Estás en el plan Común. Tu prueba gratis de Premium ya terminó.')}</div>;
}
