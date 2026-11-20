import { Formik, Form as FForm } from 'formik';
import * as Yup from 'yup';
import { Card, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api, { showError } from '../api/client';
import { loginSuccess } from '../store/authSlice';
import { useTranslation } from 'react-i18next';

const schema = Yup.object({
  identifier: Yup.string().trim().required('Requerido'),
  password: Yup.string().required('Requerido'),
});

export default function Login() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/auth/login', { ...values, identifier: values.identifier.trim() });
      dispatch(loginSuccess(data));
      navigate(data.onboarded ? '/plan' : '/onboarding');
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
        <h3 className="mb-3">{t('Ingresar')}</h3>
        <Formik initialValues={{ identifier: '', password: '' }} validationSchema={schema} onSubmit={onSubmit}>
          {({ getFieldProps, errors, touched, isSubmitting }) => (
            <FForm noValidate>
              <Form.Group className="mb-3">
                <Form.Label>{t('Usuario o email')}</Form.Label>
                <Form.Control
                  {...getFieldProps('identifier')}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoFocus
                  isInvalid={touched.identifier && errors.identifier}
                />
                <Form.Control.Feedback type="invalid">{t(errors.identifier ?? '')}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>{t('Contraseña')}</Form.Label>
                <Form.Control type="password" autoComplete="current-password" {...getFieldProps('password')} isInvalid={touched.password && errors.password} />
                <Form.Control.Feedback type="invalid">{t(errors.password ?? '')}</Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" className="w-100" disabled={isSubmitting}>{t('Entrar')}</Button>
            </FForm>
          )}
        </Formik>
        <p className="mt-3 mb-0 text-center">{t('¿No tenés cuenta?')} <Link to="/register">{t('Registrate')}</Link></p>
      </Card.Body>
    </Card>
  );
}
