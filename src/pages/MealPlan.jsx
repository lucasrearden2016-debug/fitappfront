import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { showError } from '../api/client';
import RecipeDrawer from '../components/meal/RecipeDrawer';
import ShoppingList from '../components/meal/ShoppingList';
import { isToday, mealStyle, shortDay, sumMacros, todayIndex } from '../components/meal/mealUtils';
import '../components/gym/gym.css';
import '../components/meal/meal.css';

const QUICK_FEEDBACK = ['Más variedad', 'Cenas más rápidas', 'Menos pollo', 'Más pescado', 'Más económico', 'Más proteína', 'Desayunos dulces', 'Para llevar al trabajo'];
const MACROS = [
  ['calories', 'Calorías', 'kcal'],
  ['protein', 'Proteína', 'g'],
  ['carbs', 'Carbohidratos', 'g'],
  ['fat', 'Grasas', 'g'],
];
const fmtWeek = (d) => new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'long', timeZone: 'UTC' });

function MacroBar({ label, unit, value, target }) {
  const pct = target ? (value / target) * 100 : 0;
  const tone = pct > 110 ? 'over' : pct >= 90 ? 'ok' : 'under';
  return (
    <div className="macro">
      <div className="macro-top">
        <span>{label}</span>
        <span><b>{Math.round(value)}</b> / {target} {unit}</span>
      </div>
      <div className="macro-track"><div className={`macro-fill ${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
    </div>
  );
}

function MealCard({ meal, onOpen }) {
  const style = mealStyle(meal.type);
  const preview = meal.ingredients.map((i) => i.name).join(' · ');
  return (
    <button className="meal-card" onClick={() => onOpen(meal)}>
      <div className="meal-card-top">
        <span className="meal-type" style={{ background: style.bg, color: style.fg }}>{style.icon} {meal.type}</span>
        <span className="meal-kcal">{Math.round(meal.calories)} kcal</span>
      </div>
      <h6 className="meal-name">{meal.name}</h6>
      {meal.description && <p className="meal-desc">{meal.description}</p>}
      <p className="meal-ingredients" title={preview}>{preview}</p>
      <div className="meal-foot">
        <span className="meal-macros">
          <span>P {Math.round(meal.protein)}g</span>
          <span>C {Math.round(meal.carbs)}g</span>
          <span>G {Math.round(meal.fat)}g</span>
        </span>
        <span className="meal-open">{meal.recipe?.steps?.length ? 'Ver receta' : 'Receta'} →</span>
      </div>
    </button>
  );
}

export default function MealPlan() {
  const [plan, setPlan] = useState(null);
  const [isCurrentWeek, setIsCurrentWeek] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [dayIndex, setDayIndex] = useState(0);
  const [view, setView] = useState('week');
  const [openMeal, setOpenMeal] = useState(null);
  const closeRecipe = useCallback(() => setOpenMeal(null), []);

  useEffect(() => {
    api.get('/mealplans/current')
      .then(({ data }) => {
        setPlan(data.plan);
        setIsCurrentWeek(data.isCurrentWeek);
        setDayIndex(todayIndex(data.plan.days));
      })
      .catch((err) => err.response?.status !== 404 && showError(err))
      .finally(() => setLoading(false));
  }, []);

  const addChip = (text) => setFeedback((f) => (f.toLowerCase().includes(text.toLowerCase()) ? f : f ? `${f}, ${text.toLowerCase()}` : text));

  const generate = async () => {
    setShowGenerate(false);
    setGenerating(true);
    try {
      const { data } = await api.post('/mealplans/generate', { feedback });
      setPlan(data);
      setIsCurrentWeek(true);
      setDayIndex(todayIndex(data.days));
      setView('week');
      setFeedback('');
      toast.success('¡Plan semanal listo!');
    } catch (err) {
      showError(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <Spinner size="sm" />;

  const generateModal = (
    <Modal show={showGenerate} onHide={() => setShowGenerate(false)} centered>
      <Modal.Header closeButton><Modal.Title as="h5">{plan ? 'Nuevo plan semanal' : 'Tu primer plan'}</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="text-muted small">
          La IA usa tu perfil (comidas que te gustan, restricciones y objetivo). Si querés, decile qué cambiar esta semana.
        </p>
        <Form.Control
          as="textarea"
          rows={3}
          value={feedback}
          maxLength={500}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Ej: menos pollo, cenas rápidas, quiero comer pescado dos veces…"
        />
        <div className="tag-suggestions-inline">
          {QUICK_FEEDBACK.map((q) => <button key={q} type="button" onClick={() => addChip(q)}>+ {q}</button>)}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={() => setShowGenerate(false)}>Cancelar</Button>
        <Button onClick={generate}>✨ Generar plan</Button>
      </Modal.Footer>
    </Modal>
  );

  if (!plan) {
    return (
      <div className="meal-page">
        <div className="gym-empty meal-empty">
          <div className="gym-empty-icon">🥗</div>
          <h4>Tu plan de comidas</h4>
          <p className="text-muted mb-4">
            Un plan de 7 días con comidas que te gustan, ajustado a tus calorías, con recetas y lista de compras.
            ¿No cargaste tus comidas? Hacelo en <Link to="/onboarding">Mi perfil</Link>.
          </p>
          <Button onClick={() => setShowGenerate(true)} disabled={generating}>
            {generating ? <><Spinner size="sm" /> Generando tu semana…</> : '✨ Generar mi primer plan'}
          </Button>
          {generating && <p className="text-muted small mt-3 mb-0">Esto tarda entre 15 y 40 segundos.</p>}
        </div>
        {generateModal}
      </div>
    );
  }

  const day = plan.days[Math.min(dayIndex, plan.days.length - 1)];
  const totals = sumMacros(day.meals);

  return (
    <div className="meal-page">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <div className="gym-crumb">Alimentación / Plan semanal</div>
          <h1 className="page-title-sm">Plan semanal</h1>
          <div className="gym-meta">
            <span>Semana del {fmtWeek(plan.weekStart)}</span>
            {plan.feedback && <span className="gym-badge" title={plan.feedback}>✎ con tus pedidos</span>}
          </div>
        </div>
        <Button className="mt-3" onClick={() => setShowGenerate(true)} disabled={generating}>
          {generating ? <><Spinner size="sm" /> Generando…</> : '✨ Nuevo plan'}
        </Button>
      </div>

      {!isCurrentWeek && !generating && (
        <div className="meal-banner">
          <span>📅</span>
          <div><b>Empezó una semana nueva.</b> Generá tu plan actualizado; podés pedirle cambios a la IA.</div>
          <Button size="sm" onClick={() => setShowGenerate(true)}>Generar</Button>
        </div>
      )}
      {generating && <div className="meal-banner"><Spinner size="sm" /><div>Armando tu semana con IA… tarda entre 15 y 40 segundos.</div></div>}

      {/* Vistas */}
      <div className="gym-views">
        <button className={`gym-view ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>▦ Semana</button>
        <button className={`gym-view ${view === 'shopping' ? 'active' : ''}`} onClick={() => setView('shopping')}>
          🛒 Lista de compras <span className="gym-badge">{plan.shoppingList.length}</span>
        </button>
      </div>

      {view === 'week' ? (
        <>
          {/* Días */}
          <div className="meal-days">
            {plan.days.map((d, i) => {
              const kcal = Math.round(sumMacros(d.meals).calories);
              return (
                <button key={d.day} className={`meal-day ${i === dayIndex ? 'active' : ''}`} onClick={() => setDayIndex(i)}>
                  <span className="meal-day-name">{shortDay(d.day)}</span>
                  <span className="meal-day-kcal">{kcal}</span>
                  {isToday(d.day) && <span className="meal-day-today">hoy</span>}
                </button>
              );
            })}
          </div>

          {/* Resumen del día vs objetivo */}
          <div className="macro-grid">
            {MACROS.map(([k, label, unit]) => (
              <MacroBar key={k} label={label} unit={unit} value={totals[k]} target={plan.targets[k]} />
            ))}
          </div>

          <h5 className="meal-day-title">{day.day}</h5>
          <div className="meal-grid">
            {day.meals.map((m) => <MealCard key={m._id} meal={m} onOpen={setOpenMeal} />)}
          </div>
        </>
      ) : (
        <ShoppingList planId={plan._id} items={plan.shoppingList} />
      )}

      <RecipeDrawer planId={plan._id} meal={openMeal} onClose={closeRecipe} />
      {generateModal}
    </div>
  );
}
