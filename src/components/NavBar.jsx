import { Container, Dropdown, Nav, Navbar, Button } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/authSlice';
import { useTheme } from '../hooks/useTheme';
import { LANGS, setLanguage } from '../i18n';

const LINKS = [
  ['/plan', 'Comidas', '🥗'],
  ['/gym', 'Gimnasio', '🏋️'],
  ['/onboarding', 'Perfil', '👤'],
];

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;
  return (
    <Dropdown align="end">
      <Dropdown.Toggle as="button" className="theme-toggle lang-toggle" aria-label="Idioma">
        {current?.toUpperCase()}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {LANGS.map(([code, label]) => (
          <Dropdown.Item key={code} active={code === current} onClick={() => setLanguage(code)}>
            {label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default function NavBar() {
  const { t } = useTranslation();
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const exit = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      <Navbar className="app-navbar" sticky="top">
        <Container>
          <Navbar.Brand as={NavLink} to="/">
            <span className="app-logo">F</span> fitapp
          </Navbar.Brand>
          {user && (
            <Nav className="me-auto gap-1 nav-desktop">
              {LINKS.map(([to, label]) => <Nav.Link key={to} as={NavLink} to={to}>{t(label)}</Nav.Link>)}
            </Nav>
          )}
          <div className="d-flex align-items-center gap-1 ms-auto">
            <LanguagePicker />
            <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? t('Modo claro') : t('Modo oscuro')} aria-label={t('Cambiar tema')}>
              {theme === 'dark' ? '☀︎' : '☾'}
            </button>
            {user && (
              <>
                <span className="text-muted small mx-2 nav-desktop">{user.name}</span>
                <Button size="sm" variant="light" onClick={exit}>{t('Salir')}</Button>
              </>
            )}
          </div>
        </Container>
      </Navbar>

      {/* Barra inferior en celular */}
      {user && (
        <nav className="app-tabbar">
          <NavLink to="/" end><span className="ico">🏠</span>{t('Inicio')}</NavLink>
          {LINKS.map(([to, label, ico]) => (
            <NavLink key={to} to={to}><span className="ico">{ico}</span>{t(label)}</NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
