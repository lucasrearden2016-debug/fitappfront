import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from 'react-bootstrap';
import { Trans, useTranslation } from 'react-i18next';
import { mealTypeLabel } from '../i18n/labels';
import './pages.css';

// Texto con <b>, <i> o <code> adentro, traducible
const Rich = ({ k }) => <Trans i18nKey={k} components={{ b: <b />, i: <i />, code: <code /> }} />;

export default function Home() {
  const { t } = useTranslation();
  const { token, onboarded } = useSelector((s) => s.auth);

  return (
    <div className="home">
      <section className="home-hero">
        <span className="home-eyebrow">{t('Dieta + gimnasio · todo en uno')}</span>
        <h1>{t('Tu alimentación y tu entrenamiento, en un solo lugar.')}</h1>
        <p>{t('Armá tu plan de comidas con tus alimentos y favoritas, o dejá que la IA lo haga. Anotá tu rutina mientras entrenás y mirá cómo progresás.')}</p>
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          {!token && (
            <>
              <Button as={Link} to="/register">{t('Crear cuenta gratis')}</Button>
              <Button as={Link} to="/login" variant="light">{t('Ya tengo cuenta')}</Button>
            </>
          )}
          {token && !onboarded && <Button as={Link} to="/onboarding">{t('Completar mi perfil →')}</Button>}
          {token && onboarded && (
            <>
              <Button as={Link} to="/plan">{t('Ver mi plan de comidas')}</Button>
              <Button as={Link} to="/gym" variant="light">{t('Ir al gimnasio')}</Button>
            </>
          )}
        </div>
      </section>

      <div className="home-cards">
        <article className="home-card">
          <div className="home-card-icon" style={{ background: '#dafbe1' }}>🥗</div>
          <h3>{t('Plan alimenticio')}</h3>
          <p>{t('Tu semana de comidas ajustada a tus calorías: armala a mano o generala con IA.')}</p>
          <ol className="home-steps">
            <li><span><Rich k="Cargá tus <b>alimentos</b> con los datos de la etiqueta: las calorías se calculan solas." /></span></li>
            <li><span><Rich k="Guardá tus comidas de siempre en <b>Favoritas</b> y combinalas para llegar a tu objetivo." /></span></li>
            <li><span><Rich k="O pedile a la IA un <b>plan semanal</b> con recetas y lista de compras." /></span></li>
            <li><span><Rich k="Marcá lo que comiste y registrá tu <b>peso</b>: las calorías se ajustan solas." /></span></li>
          </ol>
          <div className="home-preview">
            <div className="home-meal"><div><div className="type">{mealTypeLabel('desayuno')}</div>{t('Avena con banana y maní')}</div><span className="kcal">520 kcal</span></div>
            <div className="home-meal"><div><div className="type">{mealTypeLabel('almuerzo')}</div>{t('Arroz con pollo y verduras')}</div><span className="kcal">710 kcal</span></div>
            <div className="home-meal"><div><div className="type">{mealTypeLabel('cena')}</div>{t('Tortilla de papa y ensalada')}</div><span className="kcal">640 kcal</span></div>
          </div>
          {token && onboarded && <Link to="/plan" className="small fw-medium">{t('Ir al plan de comidas →')}</Link>}
        </article>

        <article className="home-card">
          <div className="home-card-icon" style={{ background: '#ddf4ff' }}>🏋️</div>
          <h3>{t('Gimnasio')}</h3>
          <p>{t('Tu rutina como una tabla: la editás mientras entrenás y la app guarda tu historial sola.')}</p>
          <ol className="home-steps">
            <li><span><Rich k="<b>Generá tu rutina con IA</b> (ideal si arrancás) o empezá en blanco y cargá la tuya." /></span></li>
            <li><span><Rich k="En cada serie escribí <b>peso×reps</b>, por ejemplo <code>80x10</code>. Se guarda automáticamente." /></span></li>
            <li><span><Rich k="En <b>Progreso</b> ves cuánto subiste en cada ejercicio, en % y por día." /></span></li>
            <li><span><Rich k="Pedí <b>recomendaciones</b>: la IA analiza tu historial y tus notas y te dice qué ajustar." /></span></li>
          </ol>
          <div className="home-preview">
            <div className="home-preview-row head"><span>{t('Ejercicio')}</span><span>{t('Serie {{n}}', { n: 1 })}</span><span>{t('Serie {{n}}', { n: 2 })}</span><span>{t('Serie {{n}}', { n: 3 })}</span></div>
            <div className="home-preview-row"><span>{t('Press plano')}</span><span>100×12</span><span>100×10</span><span>100×8</span></div>
            <div className="home-preview-row"><span>{t('Dominadas')}</span><span>8</span><span>8</span><span>6</span></div>
            <div className="home-preview-row"><span>{t('Remo en T')}</span><span className="muted">× 12</span><span className="muted">× 12</span><span className="muted">× 12</span></div>
          </div>
          {token && onboarded && <Link to="/gym" className="small fw-medium">{t('Ir al gimnasio →')}</Link>}
        </article>
      </div>

      <section className="home-how">
        <div>
          <h6>{t('1 · Completá tu perfil')}</h6>
          <p>{t('Datos básicos, comidas y cómo entrenás. Tus calorías se calculan con una fórmula, no las inventa la IA.')}</p>
        </div>
        <div>
          <h6>{t('2 · Armá tu semana')}</h6>
          <p>{t('Con tus alimentos y favoritas, o con IA en segundos. Podés editar todo cuando quieras.')}</p>
        </div>
        <div>
          <h6>{t('3 · Seguí tu progreso')}</h6>
          <p>{t('Actualizá pesos y planes cada semana. Mientras más usás la app, mejores son las recomendaciones.')}</p>
        </div>
      </section>
    </div>
  );
}
