import { Container, Nav, Navbar, Button } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { useTheme } from '../hooks/useTheme';

const LINKS = [
  ['/plan', 'Comidas', '🥗'],
  ['/gym', 'Gimnasio', '🏋️'],
  ['/onboarding', 'Perfil', '👤'],
];

export default function NavBar() {
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
              {LINKS.map(([to, label]) => <Nav.Link key={to} as={NavLink} to={to}>{label}</Nav.Link>)}
            </Nav>
          )}
          <div className="d-flex align-items-center gap-1 ms-auto">
            <button className="theme-toggle" onClick={toggle} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} aria-label="Cambiar tema">
              {theme === 'dark' ? '☀︎' : '☾'}
            </button>
            {user && (
              <>
                <span className="text-muted small mx-2 nav-desktop">{user.name}</span>
                <Button size="sm" variant="light" onClick={exit}>Salir</Button>
              </>
            )}
          </div>
        </Container>
      </Navbar>

      {/* Barra inferior en celular */}
      {user && (
        <nav className="app-tabbar">
          <NavLink to="/" end><span className="ico">🏠</span>Inicio</NavLink>
          {LINKS.map(([to, label, ico]) => (
            <NavLink key={to} to={to}><span className="ico">{ico}</span>{label}</NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
