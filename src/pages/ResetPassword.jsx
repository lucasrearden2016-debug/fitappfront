import { useState } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api, { showError } from '../api/client';
import { loginSuccess } from '../store/authSlice';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/auth/reset', { token, password });
      dispatch(loginSuccess(data));
      toast.success(t('Contraseña cambiada'));
      navigate(data.onboarded ? '/' : '/onboarding');
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <Card className="mx-auto" style={{ maxWidth: 420 }}>
        <Card.Body>
          <p>{t('El link no es válido o ya venció. Pedí uno nuevo.')}</p>
          <Link to="/forgot-password">{t('Pedir un link nuevo')}</Link>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
        <h3 className="mb-3">{t('Nueva contraseña')}</h3>
        <Form onSubmit={submit}>
          <Form.Group className="mb-3">
            <Form.Label>{t('Contraseña')}</Form.Label>
            <Form.Control type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} isInvalid={tooShort} autoFocus />
            <Form.Control.Feedback type="invalid">{t('Mínimo 8 caracteres')}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{t('Repetir contraseña')}</Form.Label>
            <Form.Control type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} isInvalid={mismatch} />
            <Form.Control.Feedback type="invalid">{t('No coinciden')}</Form.Control.Feedback>
          </Form.Group>
          <Button type="submit" className="w-100" disabled={saving || password.length < 8 || confirm !== password}>
            {saving ? <Spinner size="sm" /> : t('Guardar contraseña')}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}