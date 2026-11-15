import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';

export default function NavBar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <Navbar expand="md" className="app-navbar">
      <Container>
        <Navbar.Brand as={NavLink} to="/">
          <span className="app-logo">F</span> fitapp
        </Navbar.Brand>
        {user && (
          <>
            <Navbar.Toggle />
            <Navbar.Collapse>
              <Nav className="me-auto gap-1">
                <Nav.Link as={NavLink} to="/plan">Plan de comidas</Nav.Link>
                <Nav.Link as={NavLink} to="/gym">Gimnasio</Nav.Link>
                <Nav.Link as={NavLink} to="/onboarding">Mi perfil</Nav.Link>
              </Nav>
              <span className="text-muted small me-3">{user.name}</span>
              <Button size="sm" variant="light" onClick={() => { dispatch(logout()); navigate('/login'); }}>
                Salir
              </Button>
            </Navbar.Collapse>
          </>
        )}
      </Container>
    </Navbar>
  );
}
