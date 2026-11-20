import { useEffect, useState } from 'react';
import { Formik, Form as FForm } from 'formik';
import * as Yup from 'yup';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { showError } from '../api/client';
import { setOnboarded } from '../store/authSlice';
import TagInput from '../components/TagInput';
import AccountSection from '../components/AccountSection';
import { cleanDecimal, toInput, toNum } from '../utils/num';
import './pages.css';
import { useTranslation } from 'react-i18next';

const empty = {
  sex: 'male', age: '', heightCm: '', weightKg: '', activityLevel: 'moderate', goal: 'maintain',
  mealsPerDay: 4, restrictions: [], cookingSkill: 'basic', maxCookingMinutes: 30, budget: 'medium',
  canCook: [], liked: [], disliked: [],
  experience: 'beginner', daysPerWeek: 3, minutesPerSession: 60, equipment: 'full_gym', gymGoals: '', injuries: '',
};

// Acepta coma decimal: "95,4"
const decimal = () => Yup.number().transform((_, orig) => toNum(orig) ?? NaN).typeError('Número');
const schema = Yup.object({
  age: decimal().min(14, 'Mínimo 14').max(100, 'Valor fuera de rango').required('Requerido'),
  heightCm: decimal().min(120, 'En cm, ej. 175').max(230, 'Valor fuera de rango').required('Requerido'),
  weightKg: decimal().min(35, 'Valor fuera de rango').max(300, 'Valor fuera de rango').required('Requerido'),
  daysPerWeek: Yup.number().min(1).max(7),
});

const FOOD_SUGGESTIONS = ['Pollo', 'Carne', 'Pescado', 'Huevos', 'Arroz', 'Pasta', 'Avena', 'Legumbres', 'Ensaladas', 'Frutas', 'Yogur', 'Papa'];
const RESTRICTION_SUGGESTIONS = ['Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa', 'Sin frutos secos', 'Sin mariscos'];

function toForm(u) {
  if (!u?.onboarded) return empty;
  const f = u.foods ?? [];
  return {
    ...empty,
    ...u.profile,
    heightCm: toInput(u.profile.heightCm),
    weightKg: toInput(u.profile.weightKg),
    restrictions: u.profile.restrictions ?? [],
    canCook: f.filter((x) => x.liked && x.canCook).map((x) => x.name),
    liked: f.filter((x) => x.liked && !x.canCook).map((x) => x.name),
    disliked: f.filter((x) => !x.liked).map((x) => x.name),
    ...(u.gym?.experience && {
      experience: u.gym.experience, daysPerWeek: u.gym.daysPerWeek, minutesPerSession: u.gym.minutesPerSession ?? 60,
      equipment: u.gym.equipment, gymGoals: u.gym.goals ?? '', injuries: u.gym.injuries ?? '',
    }),
  };
}

function toPayload(v) {
  return {
    profile: {
      sex: v.sex, age: toNum(v.age), heightCm: toNum(v.heightCm), weightKg: toNum(v.weightKg), activityLevel: v.activityLevel,
      goal: v.goal, mealsPerDay: +v.mealsPerDay, restrictions: v.restrictions, cookingSkill: v.cookingSkill,
      maxCookingMinutes: +v.maxCookingMinutes, budget: v.budget,
    },
    foods: [
      ...v.canCook.map((name) => ({ name, liked: true, canCook: true })),
      ...v.liked.map((name) => ({ name, liked: true, canCook: false })),
      ...v.disliked.map((name) => ({ name, liked: false, canCook: false })),
    ],
    gym: {
      experience: v.experience, daysPerWeek: +v.daysPerWeek, minutesPerSession: +v.minutesPerSession,
      equipment: v.equipment, goals: v.gymGoals, injuries: v.injuries,
    },
  };
}

// ---------- Campos reutilizables ----------
function Segmented({ value, options, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="segmented">
      {options.map(([v, label]) => (
        <button type="button" key={v} className={value === v ? 'active' : ''} onClick={() => onChange(v)}>{t(label)}</button>
      ))}
    </div>
  );
}

function Field({ label, help, children }) {
  const { t } = useTranslation();
  return (
    <Form.Group className="mb-3">
      <Form.Label>{t(label)}</Form.Label>
      {children}
      {help && <div className="field-help">{t(help)}</div>}
    </Form.Group>
  );
}

function Section({ title, desc, children }) {
  const { t } = useTranslation();
  return (
    <section className="profile-section">
      <div>
        <h5>{t(title)}</h5>
        <div className="desc">{t(desc)}</div>
      </div>
      <div>{children}</div>
    </section>
  );
}

export default function Onboarding() {
  const { t } = useTranslation();
  const [initial, setInitial] = useState(null);
  const [targets, setTargets] = useState(null);
  const [account, setAccount] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/profile')
      .then(({ data }) => {
        setInitial(toForm(data));
        setAccount({ email: data.email, username: data.username ?? '' });
        setTargets(data.targets);
      })
      .catch(() => setInitial(empty));
  }, []);

  const onSubmit = async (values, { resetForm }) => {
    const firstTime = !targets;
    try {
      const { data } = await api.put('/profile/onboarding', toPayload(values));
      dispatch(setOnboarded());
      setTargets(data.targets);
      resetForm({ values });
      toast.success(t('Perfil guardado · {{kcal}} kcal/día', { kcal: data.targets.calories }));
      if (firstTime) navigate('/');
    } catch (err) {
      showError(err);
    }
  };

  if (!initial) return <Spinner size="sm" />;

  return (
    <div className="profile-page">
      <h1 className="page-title">{t('Mi perfil')}</h1>
      <p className="page-sub">{t('Con esto se calculan tus calorías y la IA arma tu plan y tu rutina. Podés cambiarlo cuando quieras.')}</p>

      {account && <AccountSection email={account.email} username={account.username} />}

      {targets && (
        <div className="profile-targets">
          <div><div className="label">{t('Objetivo diario')}</div><div className="value">{targets.calories} kcal</div></div>
          <div><div className="label">{t('Proteína')}</div><div className="value">{targets.protein} g</div></div>
          <div><div className="label">{t('Carbohidratos')}</div><div className="value">{targets.carbs} g</div></div>
          <div><div className="label">{t('Grasas')}</div><div className="value">{targets.fat} g</div></div>
        </div>
      )}

      <Formik initialValues={initial} validationSchema={schema} onSubmit={onSubmit} enableReinitialize>
        {({ values, setFieldValue, getFieldProps: fp, errors, touched, isSubmitting, dirty }) => {
          const num = (name) => ({
            inputMode: 'decimal',
            ...fp(name),
            onChange: (e) => setFieldValue(name, cleanDecimal(e.target.value)),
            isInvalid: touched[name] && !!errors[name],
          });
          const select = (name, options) => (
            <Form.Select {...fp(name)}>
              {options.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
            </Form.Select>
          );

          return (
            <FForm noValidate onKeyDown={(e) => e.key === 'Enter' && e.target.tagName === 'INPUT' && e.preventDefault()}>
              <Section title="Sobre vos" desc="Se usa para calcular tus calorías y macros con la fórmula Mifflin-St Jeor.">
                <Field label="Sexo">
                  <Segmented value={values.sex} onChange={(v) => setFieldValue('sex', v)} options={[['male', 'Masculino'], ['female', 'Femenino']]} />
                </Field>
                <Row>
                  {[['age', 'Edad', 'años'], ['heightCm', 'Altura', 'cm'], ['weightKg', 'Peso', 'kg']].map(([name, label, unit]) => (
                    <Col xs={4} key={name}>
                      <Field label={`${t(label)} (${t(unit)})`}>
                        <Form.Control {...num(name)} />
                        <Form.Control.Feedback type="invalid">{t(errors[name] ?? '')}</Form.Control.Feedback>
                      </Field>
                    </Col>
                  ))}
                </Row>
                <Field label="Objetivo">
                  <Segmented value={values.goal} onChange={(v) => setFieldValue('goal', v)}
                    options={[['lose', '🔥 Bajar grasa'], ['maintain', '⚖️ Mantener'], ['gain', '💪 Ganar músculo']]} />
                </Field>
                <Field label="Actividad diaria (sin contar el gym)">
                  {select('activityLevel', [
                    ['sedentary', 'Sedentaria · oficina, poco movimiento'], ['light', 'Ligera · camino algo'],
                    ['moderate', 'Moderada · entreno 3-5 días'], ['active', 'Activa · entreno 6-7 días'],
                    ['very_active', 'Muy activa · trabajo físico'],
                  ])}
                </Field>
              </Section>

              <Section title="Alimentación" desc="Escribí y apretá Enter para agregar. Mientras más cargues, mejor te conoce la IA.">
                <Field label="👨‍🍳 Comidas que sabés cocinar" help="Ej: milanesas, tortilla, arroz con pollo">
                  <TagInput variant="green" value={values.canCook} onChange={(v) => setFieldValue('canCook', v)} placeholder={t('Agregá una comida…')} />
                </Field>
                <Field label="👍 Alimentos o comidas que te gustan">
                  <TagInput variant="blue" value={values.liked} onChange={(v) => setFieldValue('liked', v)} placeholder={t('Agregá algo que te guste…')} suggestions={FOOD_SUGGESTIONS.map((s) => t(s))} />
                </Field>
                <Field label="👎 Lo que no te gusta">
                  <TagInput variant="red" value={values.disliked} onChange={(v) => setFieldValue('disliked', v)} placeholder={t('La IA lo va a evitar…')} />
                </Field>
                <Field label="Restricciones o alergias">
                  <TagInput value={values.restrictions} onChange={(v) => setFieldValue('restrictions', v)} placeholder={t('Ninguna')} suggestions={RESTRICTION_SUGGESTIONS.map((s) => t(s))} />
                </Field>
                <Row>
                  <Col sm={6}><Field label="Comidas por día">{select('mealsPerDay', [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']])}</Field></Col>
                  <Col sm={6}><Field label="Tiempo máximo para cocinar">{select('maxCookingMinutes', [[15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 hora'], [90, 'Sin límite']])}</Field></Col>
                </Row>
                <Field label="Nivel de cocina">
                  <Segmented value={values.cookingSkill} onChange={(v) => setFieldValue('cookingSkill', v)} options={[['basic', 'Básico'], ['intermediate', 'Intermedio'], ['advanced', 'Avanzado']]} />
                </Field>
                <Field label="Presupuesto">
                  <Segmented value={values.budget} onChange={(v) => setFieldValue('budget', v)} options={[['low', 'Ajustado'], ['medium', 'Medio'], ['high', 'Holgado']]} />
                </Field>
              </Section>

              <Section title="Gimnasio" desc="La IA lo usa para generarte una rutina y para darte recomendaciones.">
                <Field label="Experiencia">
                  <Segmented value={values.experience} onChange={(v) => setFieldValue('experience', v)} options={[['beginner', 'Principiante'], ['intermediate', 'Intermedio'], ['advanced', 'Avanzado']]} />
                </Field>
                <Field label="Días por semana">
                  <Segmented value={Number(values.daysPerWeek)} onChange={(v) => setFieldValue('daysPerWeek', v)} options={[1, 2, 3, 4, 5, 6, 7].map((n) => [n, String(n)])} />
                </Field>
                <Row>
                  <Col sm={6}><Field label="Duración de la sesión">{select('minutesPerSession', [[30, '30 min'], [45, '45 min'], [60, '1 hora'], [90, '1 h 30'], [120, '2 horas']])}</Field></Col>
                  <Col sm={6}><Field label="Dónde entrenás">{select('equipment', [['full_gym', 'Gimnasio completo'], ['home_basic', 'Casa con mancuernas/barra'], ['bodyweight', 'Solo peso corporal']])}</Field></Col>
                </Row>
                <Field label="¿Qué querés lograr?">
                  <Form.Control as="textarea" rows={2} {...fp('gymGoals')} placeholder={t('Ej: subir mi press de banca, ganar espalda, marcar abdomen')} />
                </Field>
                <Field label="Lesiones o limitaciones">
                  <Form.Control as="textarea" rows={2} {...fp('injuries')} placeholder={t('Ej: molestia en hombro derecho')} />
                </Field>
              </Section>

              <div className="save-bar">
                <div className="inner">
                  {dirty && <span className="text-muted small">{t('Tenés cambios sin guardar')}</span>}
                  <Button type="submit" disabled={isSubmitting || (!dirty && !!targets)}>
                    {isSubmitting ? t('Guardando…') : targets ? t('Guardar cambios') : t('Guardar y empezar')}
                  </Button>
                </div>
              </div>
            </FForm>
          );
        }}
      </Formik>
    </div>
  );
}
