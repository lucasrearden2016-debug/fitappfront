import { useState } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { showError } from '../api/client';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/auth/forgot', { identifier: identifier.trim() });
      setSent(true);
    } catch (err) {
      showError(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
        <h3 className="mb-2">{t('Recuperar contraseña')}</h3>
        {sent ? (
          <>
            <p className="text-muted">{t('Si la cuenta existe, te llegó un email con un link para elegir una contraseña nueva. Revisá también spam.')}</p>
            <Link to="/login">{t('← Volver a ingresar')}</Link>
          </>
        ) : (
          <Form onSubmit={submit}>
            <p className="text-muted small">{t('Escribí tu usuario o email y te mandamos un link para cambiarla.')}</p>
            <Form.Group className="mb-3">
              <Form.Label>{t('Usuario o email')}</Form.Label>
              <Form.Control value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" autoCapitalize="none" autoFocus required />
            </Form.Group>
            <Button type="submit" className="w-100" disabled={sending || !identifier.trim()}>
              {sending ? <Spinner size="sm" /> : t('Enviar link')}
            </Button>
            <p className="mt-3 mb-0 text-center"><Link to="/login">{t('← Volver a ingresar')}</Link></p>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}