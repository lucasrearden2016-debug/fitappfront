import { useEffect, useRef, useState } from 'react';
import { Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api, { showError } from '../api/client';
import { useTranslation } from 'react-i18next';

const VALID = /^[a-z0-9._]{3,20}$/;

// Hook: chequea en vivo si un nombre de usuario está libre
export function useUsernameCheck(value, current = '') {
  const [state, setState] = useState(null); // null | 'checking' | 'ok' | 'taken' | 'invalid'
  const timer = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    const u = value.trim().toLowerCase();
    if (!u || u === current) return setState(null);
    if (!VALID.test(u)) return setState('invalid');
    setState('checking');
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/username/${encodeURIComponent(u)}`);
        setState(data.available ? 'ok' : 'taken');
      } catch {
        setState(null);
      }
    }, 350);
    return () => clearTimeout(timer.current);
  }, [value, current]);
  return state;
}

export const USERNAME_HINT = {
  checking: 'Revisando…',
  ok: '✓ Disponible',
  taken: 'Ya está tomado',
  invalid: '3 a 20 caracteres: letras, números, punto o guion bajo',
};

// Mi perfil → Cuenta: email + nombre de usuario para entrar
export default function AccountSection({ email, username: initial }) {
  const { t } = useTranslation();
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const check = useUsernameCheck(value, saved);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/profile/username', { username: value.trim().toLowerCase() });
      setSaved(data.username);
      setValue(data.username);
      toast.success(t('Listo: ya podés entrar como @{{u}}', { u: data.username }));
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`account-box ${saved ? '' : 'needs'}`}>
      <div className="account-row">
        <span className="label">{t('Email')}</span>
        <span>{email}</span>
      </div>
      <div className="account-row">
        <span className="label">{t('Usuario')}</span>
        <div className="flex-grow-1">
          <InputGroup size="sm">
            <InputGroup.Text>@</InputGroup.Text>
            <Form.Control
              value={value}
              placeholder={t('elegí tu usuario')}
              autoCapitalize="none"
              autoCorrect="off"
              onChange={(e) => setValue(e.target.value.toLowerCase().replace(/\s/g, ''))}
            />
            <Button variant="light" disabled={check !== 'ok' || saving} onClick={save}>
              {saving ? <Spinner size="sm" /> : t('Guardar')}
            </Button>
          </InputGroup>
          <div className={`field-help ${check === 'ok' ? 'text-success' : check === 'taken' || check === 'invalid' ? 'text-danger' : ''}`}>
            {check ? t(USERNAME_HINT[check]) : saved ? t('Podés entrar con tu usuario o tu email.') : t('Elegí un usuario para entrar sin escribir el email.')}
          </div>
        </div>
      </div>
    </div>
  );
}
