import { Formik, Form as FForm } from 'formik';
import * as Yup from 'yup';
import { Card, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api, { showError } from '../api/client';
import { loginSuccess } from '../store/authSlice';

const schema = Yup.object({
  email: Yup.string().email('Email inválido').required('Requerido'),
  password: Yup.string().required('Requerido'),
});

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    try {
      const { data } = await api.post('/auth/login', values);
      dispatch(loginSuccess(data));
      navigate(data.onboarded ? '/plan' : '/onboarding');
    } catch (err) {
      showError(err);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
        <h3 className="mb-3">Ingresar</h3>
        <Formik initialValues={{ email: '', password: '' }} validationSchema={schema} onSubmit={onSubmit}>
          {({ getFieldProps, errors, touched, isSubmitting }) => (
            <FForm noValidate>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" {...getFieldProps('email')} isInvalid={touched.email && errors.email} />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control type="password" {...getFieldProps('password')} isInvalid={touched.password && errors.password} />
                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" className="w-100" disabled={isSubmitting}>Entrar</Button>
            </FForm>
          )}
        </Formik>
        <p className="mt-3 mb-0 text-center">¿No tenés cuenta? <Link to="/register">Registrate</Link></p>
      </Card.Body>
    </Card>
  );
}
