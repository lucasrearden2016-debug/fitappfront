import { useEffect, useState } from 'react';
import { Formik, Form as FForm } from 'formik';
import * as Yup from 'yup';
import { Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { showError } from '../api/client';
import { setOnboarded } from '../store/authSlice';

// Encuesta principal. Las comidas se cargan como listas separadas por coma
// y se transforman al formato { name, liked, canCook } del backend.
const split = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

const empty = {
  sex: 'male', age: '', heightCm: '', weightKg: '', activityLevel: 'moderate', goal: 'maintain',
  mealsPerDay: 4, restrictions: '', cookingSkill: 'basic', maxCookingMinutes: 30, budget: 'medium',
  liked: '', canCook: '', disliked: '',
  experience: 'beginner', daysPerWeek: 3, minutesPerSession: 60, equipment: 'full_gym', gymGoals: '', injuries: '',
};

const schema = Yup.object({
  age: Yup.number().min(14).max(100).required('Requerido'),
  heightCm: Yup.number().min(120).max(230).required('Requerido'),
  weightKg: Yup.number().min(35).max(300).required('Requerido'),
});

function toForm(u) {
  if (!u?.onboarded) return empty;
  const f = u.foods ?? [];
  return {
    ...empty,
    ...u.profile,
    restrictions: (u.profile.restrictions ?? []).join(', '),
    liked: f.filter((x) => x.liked && !x.canCook).map((x) => x.name).join(', '),
    canCook: f.filter((x) => x.liked && x.canCook).map((x) => x.name).join(', '),
    disliked: f.filter((x) => !x.liked).map((x) => x.name).join(', '),
    ...(u.gym?.experience && {
      experience: u.gym.experience, daysPerWeek: u.gym.daysPerWeek, minutesPerSession: u.gym.minutesPerSession ?? 60,
      equipment: u.gym.equipment, gymGoals: u.gym.goals ?? '', injuries: u.gym.injuries ?? '',
    }),
  };
}

function toPayload(v) {
  return {
    profile: {
      sex: v.sex, age: +v.age, heightCm: +v.heightCm, weightKg: +v.weightKg, activityLevel: v.activityLevel,
      goal: v.goal, mealsPerDay: +v.mealsPerDay, restrictions: split(v.restrictions), cookingSkill: v.cookingSkill,
      maxCookingMinutes: +v.maxCookingMinutes, budget: v.budget,
    },
    foods: [
      ...split(v.canCook).map((name) => ({ name, liked: true, canCook: true })),
      ...split(v.liked).map((name) => ({ name, liked: true, canCook: false })),
      ...split(v.disliked).map((name) => ({ name, liked: false, canCook: false })),
    ],
    gym: {
      experience: v.experience, daysPerWeek: +v.daysPerWeek, minutesPerSession: +v.minutesPerSession,
      equipment: v.equipment, goals: v.gymGoals, injuries: v.injuries,
    },
  };
}

function Sel({ name, label, options, fp }) {
  return (
  <Form.Group className="mb-3">
    <Form.Label>{label}</Form.Label>
    <Form.Select {...fp(name)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </Form.Select>
  </Form.Group>
  );
}
function Num({ name, label, fp, errors, touched }) {
  return (
  <Form.Group className="mb-3">
    <Form.Label>{label}</Form.Label>
    <Form.Control type="number" {...fp(name)} isInvalid={touched[name] && errors[name]} />
    <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
  </Form.Group>
  );
}
function Txt({ name, label, help, fp }) {
  return (
  <Form.Group className="mb-3">
    <Form.Label>{label}</Form.Label>
    <Form.Control as="textarea" rows={2} {...fp(name)} />
    {help && <Form.Text muted>{help}</Form.Text>}
  </Form.Group>
  );
}


export default function Onboarding() {
  const [initial, setInitial] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/profile').then(({ data }) => setInitial(toForm(data))).catch(() => setInitial(empty));
  }, []);

  const onSubmit = async (values) => {
    try {
      const { data } = await api.put('/profile/onboarding', toPayload(values));
      dispatch(setOnboarded());
      toast.success(`¡Listo! Tu objetivo: ${data.targets.calories} kcal/día`);
      navigate('/plan');
    } catch (err) {
      showError(err);
    }
  };

  if (!initial) return <Spinner />;

  return (
    <Formik initialValues={initial} validationSchema={schema} onSubmit={onSubmit} enableReinitialize>
      {({ getFieldProps: fp, errors, touched, isSubmitting }) => (
        <FForm noValidate>
          <Card className="mb-4"><Card.Body>
            <h4>Sobre vos</h4>
            <Row>
              <Col md={3}><Sel name="sex" label="Sexo" fp={fp} options={[['male', 'Masculino'], ['female', 'Femenino']]} /></Col>
              <Col md={3}><Num name="age" label="Edad" {...{ fp, errors, touched }} /></Col>
              <Col md={3}><Num name="heightCm" label="Altura (cm)" {...{ fp, errors, touched }} /></Col>
              <Col md={3}><Num name="weightKg" label="Peso (kg)" {...{ fp, errors, touched }} /></Col>
            </Row>
            <Row>
              <Col md={6}><Sel name="activityLevel" label="Actividad diaria" fp={fp} options={[
                ['sedentary', 'Sedentario'], ['light', 'Ligera (1-3 días/sem)'], ['moderate', 'Moderada (3-5 días/sem)'],
                ['active', 'Activa (6-7 días/sem)'], ['very_active', 'Muy activa / trabajo físico']]} /></Col>
              <Col md={6}><Sel name="goal" label="Objetivo" fp={fp} options={[
                ['lose', 'Bajar grasa'], ['maintain', 'Mantener'], ['gain', 'Ganar masa muscular']]} /></Col>
            </Row>
          </Card.Body></Card>

          <Card className="mb-4"><Card.Body>
            <h4>Tu comida</h4>
            <Txt name="canCook" label="Comidas que te gustan y sabés cocinar" help="Separadas por coma: milanesas, tortilla, arroz con pollo..." fp={fp} />
            <Txt name="liked" label="Otras comidas/alimentos que te gustan" fp={fp} />
            <Txt name="disliked" label="Lo que NO te gusta" fp={fp} />
            <Txt name="restrictions" label="Restricciones o alergias" help="vegetariano, sin gluten, sin lactosa..." fp={fp} />
            <Row>
              <Col md={3}><Num name="mealsPerDay" label="Comidas por día" {...{ fp, errors, touched }} /></Col>
              <Col md={3}><Sel name="cookingSkill" label="Nivel de cocina" fp={fp} options={[['basic', 'Básico'], ['intermediate', 'Intermedio'], ['advanced', 'Avanzado']]} /></Col>
              <Col md={3}><Num name="maxCookingMinutes" label="Minutos máx. por comida" {...{ fp, errors, touched }} /></Col>
              <Col md={3}><Sel name="budget" label="Presupuesto" fp={fp} options={[['low', 'Ajustado'], ['medium', 'Medio'], ['high', 'Holgado']]} /></Col>
            </Row>
          </Card.Body></Card>

          <Card className="mb-4"><Card.Body>
            <h4>Gimnasio</h4>
            <Row>
              <Col md={3}><Sel name="experience" label="Experiencia" fp={fp} options={[['beginner', 'Principiante'], ['intermediate', 'Intermedio'], ['advanced', 'Avanzado']]} /></Col>
              <Col md={3}><Num name="daysPerWeek" label="Días por semana" {...{ fp, errors, touched }} /></Col>
              <Col md={3}><Num name="minutesPerSession" label="Minutos por sesión" {...{ fp, errors, touched }} /></Col>
              <Col md={3}><Sel name="equipment" label="Equipamiento" fp={fp} options={[['full_gym', 'Gimnasio completo'], ['home_basic', 'Casa (mancuernas/barra)'], ['bodyweight', 'Peso corporal']]} /></Col>
            </Row>
            <Txt name="gymGoals" label="¿Qué querés lograr?" help="Ej: subir mi sentadilla, marcar abdomen, ganar espalda" fp={fp} />
            <Txt name="injuries" label="Lesiones o limitaciones" fp={fp} />
          </Card.Body></Card>

          <Button type="submit" size="lg" disabled={isSubmitting}>Guardar</Button>
        </FForm>
      )}
    </Formik>
  );
}
