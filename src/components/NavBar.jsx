import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';

export default function NavBar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <Navbar bg="dark" data-bs-theme="dark" expand="md">
      <Container>
        <Navbar.Brand as={NavLink} to="/">💪 FitApp</Navbar.Brand>
        {user && (
          <>
            <Navbar.Toggle />
            <Navbar.Collapse>
              <Nav className="me-auto">
                <Nav.Link as={NavLink} to="/plan">Plan de comidas</Nav.Link>
                <Nav.Link as={NavLink} to="/gym">Gimnasio</Nav.Link>
                <Nav.Link as={NavLink} to="/onboarding">Mi perfil</Nav.Link>
              </Nav>
              <Navbar.Text className="me-3">Hola, {user.name}</Navbar.Text>
              <Button size="sm" variant="outline-light" onClick={() => { dispatch(logout()); navigate('/login'); }}>
                Salir
              </Button>
            </Navbar.Collapse>
          </>
        )}
      </Container>
    </Navbar>
  );
}
