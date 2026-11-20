import { Container, Dropdown, Nav, Navbar, Button } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { logout } from '../store/authSlice';
import { useTheme } from '../hooks/useTheme';
import { LANGS, setLanguage } from '../i18n';

// Íconos de línea para la barra de abajo (toman el color del texto)
const Ico = ({ children }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const HomeIco = () => <Ico><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /><path d="M10 20v-6h4v6" /></Ico>;
const FoodIco = () => (
  <Ico>
    <path d="M12 7c-2-1.6-7-1-7 4.5C5 17 8.5 21 12 19.6 15.5 21 19 17 19 11.5 19 6 14 5.4 12 7z" />
    <path d="M12 7c0-1.5.6-2.6 1.8-3.4" />
  </Ico>
);
const GymIco = () => <Ico><path d="M7 7v10M17 7v10M4 9v6M20 9v6M7 12h10" /></Ico>;
const UserIco = () => <Ico><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" /></Ico>;

const LINKS = [
  ['/plan', 'Comidas', <FoodIco key="f" />],
  ['/gym', 'Gimnasio', <GymIco key="g" />],
  ['/onboarding', 'Perfil', <UserIco key="u" />],
];

// Logo FittingUp: manzana con mancuerna (toma el color de .app-logo-mark)
export const LogoMark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M60 34 C46 24 18 30 18 60 C18 92 42 112 60 104 C78 112 102 92 102 60 C102 30 74 24 60 34 Z" strokeWidth="8" />
    <path d="M60 34 C60 26 63 20 67 16" strokeWidth="6" />
    <path d="M66 22 C71 10 84 8 90 11 C86 21 75 25 66 22 Z" fill="currentColor" stroke="none" />
    <line x1="43" y1="68" x2="77" y2="68" strokeWidth="7" />
    <rect x="29" y="55" width="9" height="26" rx="3" fill="currentColor" stroke="none" />
    <rect x="82" y="55" width="9" height="26" rx="3" fill="currentColor" stroke="none" />
  </svg>
);

// Ícono "traducir" (A / 文), dibujado con el color del texto
const TranslateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5h8" />
    <path d="M8 3v2" />
    <path d="M5.5 5c.8 3.5 3.2 6.2 6.5 7.5" />
    <path d="M11 5c-.8 3.6-3.3 6.4-7 8" />
    <path d="M13 21l4-10 4 10" />
    <path d="M14.5 17.5h5" />
  </svg>
);

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;
  return (
    <Dropdown align="end">
      <Dropdown.Toggle as="button" className="theme-toggle lang-toggle" aria-label="Idioma / Language" title={LANGS.find(([c]) => c === current)?.[1]}>
        <TranslateIcon />
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
            <span className="app-logo-mark"><LogoMark /></span>
            <span className="app-brand">Fitting<span className="app-brand-up">Up</span></span>
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
          <NavLink to="/" end><span className="ico"><HomeIco /></span>{t('Inicio')}</NavLink>
          {LINKS.map(([to, label, ico]) => (
            <NavLink key={to} to={to}><span className="ico">{ico}</span>{t(label)}</NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
