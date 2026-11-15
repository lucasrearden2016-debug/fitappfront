import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';
import './pages.css';

export default function Home() {
  const { token, onboarded } = useSelector((s) => s.auth);

  return (
    <div className="home">
      <section className="home-hero">
        <span className="home-eyebrow">Dieta + gimnasio · todo en uno</span>
        <h1>Tu alimentación y tu entrenamiento, en un solo lugar.</h1>
        <p>
          Contale a fitapp qué te gusta comer y cómo entrenás. La IA te arma el plan de comidas semanal y la rutina;
          vos solo vas anotando y viendo cómo progresás.
        </p>
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          {!token && (
            <>
              <Button as={Link} to="/register">Crear cuenta gratis</Button>
              <Button as={Link} to="/login" variant="light">Ya tengo cuenta</Button>
            </>
          )}
          {token && !onboarded && <Button as={Link} to="/onboarding">Completar mi perfil →</Button>}
          {token && onboarded && (
            <>
              <Button as={Link} to="/plan">Ver mi plan de comidas</Button>
              <Button as={Link} to="/gym" variant="light">Ir al gimnasio</Button>
            </>
          )}
        </div>
      </section>

      <div className="home-cards">
        <article className="home-card">
          <div className="home-card-icon" style={{ background: '#dafbe1' }}>🥗</div>
          <h3>Plan alimenticio</h3>
          <p>Un plan de 7 días hecho con las comidas que te gustan y sabés cocinar, ajustado a tus calorías.</p>
          <ol className="home-steps">
            <li><span>Cargá en <b>Mi perfil</b> tus comidas favoritas, lo que no te gusta y tus restricciones.</span></li>
            <li><span>Generá tu <b>plan semanal</b>: desayuno, almuerzo, merienda y cena con sus macros.</span></li>
            <li><span>Tocá cualquier comida para ver la <b>receta paso a paso</b> y usá la lista de compras.</span></li>
            <li><span>Cada semana regenerás el plan y le decís qué cambiar: <i>“menos pollo, cenas más rápidas”</i>.</span></li>
          </ol>
          <div className="home-preview">
            <div className="home-meal"><div><div className="type">desayuno</div>Avena con banana y maní</div><span className="kcal">520 kcal</span></div>
            <div className="home-meal"><div><div className="type">almuerzo</div>Arroz con pollo y verduras</div><span className="kcal">710 kcal</span></div>
            <div className="home-meal"><div><div className="type">cena</div>Tortilla de papa y ensalada</div><span className="kcal">640 kcal</span></div>
          </div>
          {token && onboarded && <Link to="/plan" className="small fw-medium">Ir al plan de comidas →</Link>}
        </article>

        <article className="home-card">
          <div className="home-card-icon" style={{ background: '#ddf4ff' }}>🏋️</div>
          <h3>Gimnasio</h3>
          <p>Tu rutina como una tabla: la editás mientras entrenás y la app guarda tu historial sola.</p>
          <ol className="home-steps">
            <li><span><b>Generá tu rutina con IA</b> (ideal si arrancás) o empezá en blanco y cargá la tuya.</span></li>
            <li><span>En cada serie escribí <b>peso×reps</b>, por ejemplo <code>80x10</code>. Se guarda automáticamente.</span></li>
            <li><span>En <b>Progreso</b> ves cuánto subiste en cada ejercicio, en % y por día.</span></li>
            <li><span>Pedí <b>recomendaciones</b>: la IA analiza tu historial y tus notas y te dice qué ajustar.</span></li>
          </ol>
          <div className="home-preview">
            <div className="home-preview-row head"><span>Ejercicio</span><span>Serie 1</span><span>Serie 2</span><span>Serie 3</span></div>
            <div className="home-preview-row"><span>Press plano</span><span>100×12</span><span>100×10</span><span>100×8</span></div>
            <div className="home-preview-row"><span>Dominadas</span><span>8</span><span>8</span><span>6</span></div>
            <div className="home-preview-row"><span>Remo en T</span><span className="muted">× 12</span><span className="muted">× 12</span><span className="muted">× 12</span></div>
          </div>
          {token && onboarded && <Link to="/gym" className="small fw-medium">Ir al gimnasio →</Link>}
        </article>
      </div>

      <section className="home-how">
        <div>
          <h6>1 · Completá tu perfil</h6>
          <p>Datos básicos, comidas y cómo entrenás. Tus calorías se calculan con una fórmula, no las inventa la IA.</p>
        </div>
        <div>
          <h6>2 · Generá con IA</h6>
          <p>Plan de comidas y rutina personalizados en segundos. Podés editarlos o regenerarlos cuando quieras.</p>
        </div>
        <div>
          <h6>3 · Seguí tu progreso</h6>
          <p>Actualizá pesos y planes cada semana. Mientras más usás la app, mejores son las recomendaciones.</p>
        </div>
      </section>
    </div>
  );
}
