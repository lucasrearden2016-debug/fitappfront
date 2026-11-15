import { Formik, Form as FForm } from 'formik';
import * as Yup from 'yup';
import { Card, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api, { showError } from '../api/client';
import { loginSuccess } from '../store/authSlice';

const schema = Yup.object({
  name: Yup.string().min(2, 'Mínimo 2 caracteres').required('Requerido'),
  email: Yup.string().email('Email inválido').required('Requerido'),
  password: Yup.string().min(8, 'Mínimo 8 caracteres').required('Requerido'),
  confirm: Yup.string().oneOf([Yup.ref('password')], 'No coinciden').required('Requerido'),
});

const fields = [
  ['name', 'Nombre', 'text'],
  ['email', 'Email', 'email'],
  ['password', 'Contraseña', 'password'],
  ['confirm', 'Repetir contraseña', 'password'],
];

export default function Register() {
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
        <h3 className="mb-3">Crear cuenta</h3>
        <Formik initialValues={{ name: '', email: '', password: '', confirm: '' }} validationSchema={schema} onSubmit={onSubmit}>
          {({ getFieldProps, errors, touched, isSubmitting }) => (
            <FForm noValidate>
              {fields.map(([name, label, type]) => (
                <Form.Group className="mb-3" key={name}>
                  <Form.Label>{label}</Form.Label>
                  <Form.Control type={type} {...getFieldProps(name)} isInvalid={touched[name] && errors[name]} />
                  <Form.Control.Feedback type="invalid">{errors[name]}</Form.Control.Feedback>
                </Form.Group>
              ))}
              <Button type="submit" className="w-100" disabled={isSubmitting}>Registrarme</Button>
            </FForm>
          )}
        </Formik>
        <p className="mt-3 mb-0 text-center">¿Ya tenés cuenta? <Link to="/login">Ingresá</Link></p>
      </Card.Body>
    </Card>
  );
}
