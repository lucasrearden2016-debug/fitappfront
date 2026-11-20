import { Formik, Form as FForm } from 'formik';
import * as Yup from 'yup';
import { Card, Form, Button, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api, { showError } from '../api/client';
import { loginSuccess } from '../store/authSlice';
import { USERNAME_HINT, useUsernameCheck } from '../components/AccountSection';
import { useTranslation } from 'react-i18next';

const schema = Yup.object({
  name: Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
  username: Yup.string()
    .matches(/^[a-z0-9._]{3,20}$/, '3 a 20 caracteres: letras, números, punto o guion bajo')
    .required('Requerido'),
  email: Yup.string().email('Email inválido').required('Requerido'),
  password: Yup.string().min(8, 'Mínimo 8 caracteres').required('Requerido'),
  confirm: Yup.string().oneOf([Yup.ref('password')], 'No coinciden').required('Requerido'),
});

const fields = [
  ['name', 'Nombre', 'text', 'name'],
  ['email', 'Email', 'email', 'email'],
  ['password', 'Contraseña', 'password', 'new-password'],
  ['confirm', 'Repetir contraseña', 'password', 'new-password'],
];

// Sugerencia de usuario a partir del nombre: "Lucas Rearden" → "lucas.rearden"
const suggest = (name) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, '.').replace(/[^a-z0-9._]/g, '').slice(0, 20);

function UsernameField({ formik }) {
  const { t } = useTranslation();
  const { values, errors, touched, setFieldValue, setFieldTouched } = formik;
  const check = useUsernameCheck(values.username);
  const bad = check === 'taken' || (touched.username && errors.username);
  return (
    <Form.Group className="mb-3">
      <Form.Label>{t('Nombre de usuario')}</Form.Label>
      <InputGroup hasValidation>
        <InputGroup.Text>@</InputGroup.Text>
        <Form.Control
          value={values.username}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          onFocus={() => !values.username && values.name && setFieldValue('username', suggest(values.name))}
          onChange={(e) => setFieldValue('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
          onBlur={() => setFieldTouched('username')}
          isInvalid={!!bad}
          isValid={check === 'ok'}
        />
        <Form.Control.Feedback type="invalid">{t(check === 'taken' ? USERNAME_HINT.taken : errors.username ?? '')}</Form.Control.Feedback>
      </InputGroup>
      <div className="field-help">{check === 'ok' ? t('✓ Disponible · con esto también podés entrar') : t('Con esto vas a poder entrar sin escribir el email.')}</div>
    </Form.Group>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async ({ confirm: _confirm, ...values }) => {
    try {
      const { data } = await api.post('/auth/register', values);
      dispatch(loginSuccess(data));
      navigate('/onboarding');
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
        <h3 className="mb-3">{t('Crear cuenta')}</h3>
        <Formik initialValues={{ name: '', username: '', email: '', password: '', confirm: '' }} validationSchema={schema} onSubmit={onSubmit}>
          {(formik) => {
            const { getFieldProps, errors, touched, isSubmitting } = formik;
            const field = ([name, label, type, autoComplete]) => (
              <Form.Group className="mb-3" key={name}>
                <Form.Label>{t(label)}</Form.Label>
                <Form.Control type={type} autoComplete={autoComplete} {...getFieldProps(name)} isInvalid={touched[name] && errors[name]} />
                <Form.Control.Feedback type="invalid">{t(errors[name] ?? '')}</Form.Control.Feedback>
              </Form.Group>
            );
            return (
              <FForm noValidate>
                {field(fields[0])}
                <UsernameField formik={formik} />
                {fields.slice(1).map(field)}
                <Button type="submit" className="w-100" disabled={isSubmitting}>{t('Registrarme')}</Button>
              </FForm>
            );
          }}
        </Formik>
        <p className="mt-3 mb-0 text-center">{t('¿Ya tenés cuenta?')} <Link to="/login">{t('Ingresá')}</Link></p>
      </Card.Body>
    </Card>
  );
}
