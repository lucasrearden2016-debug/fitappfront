import { useCallback, useEffect, useState } from 'react';
import { Button, Dropdown, Form, Modal, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { showError } from '../api/client';
import RecipeDrawer from '../components/meal/RecipeDrawer';
import ShoppingList from '../components/meal/ShoppingList';
import MealCard from '../components/meal/MealCard';
import FridgeView from '../components/meal/FridgeView';
import WeightView from '../components/meal/WeightView';
import MealEditor, { MEAL_TYPES } from '../components/meal/MealEditor';
import FavoritesView from '../components/meal/FavoritesView';
import FavoritePicker from '../components/meal/FavoritePicker';
import { isToday, shortDay, sumMacros, todayIndex } from '../components/meal/mealUtils';
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
  const [favorites, setFavorites] = useState([]);
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [swapping, setSwapping] = useState(null);
  const [editor, setEditor] = useState(null); // { meal?, type? }
  const [suggesting, setSuggesting] = useState(null);
  const [favEditor, setFavEditor] = useState(null); // { fav? }
  const [picker, setPicker] = useState(false);
  const closeRecipe = useCallback(() => setOpenMeal(null), []);

  useEffect(() => {
    api.get('/profile').then(({ data }) => {
      setFavorites(data.favorites ?? []);
      setMealsPerDay(data.profile?.mealsPerDay ?? 4);
    }).catch(() => {});
    api.get('/mealplans/current')
      .then(({ data }) => {
        setPlan(data.plan);
        setIsCurrentWeek(data.isCurrentWeek);
        setDayIndex(todayIndex(data.plan.days));
      })
      .catch((err) => err.response?.status !== 404 && showError(err))
      .finally(() => setLoading(false));
  }, []);

  // ---------- Acciones sobre comidas ----------
  const replaceInPlan = (mealId, meal, shoppingList) =>
    setPlan((p) => ({
      ...p,
      ...(shoppingList && { shoppingList }),
      days: p.days.map((d) => ({ ...d, meals: d.meals.map((m) => (m._id === mealId ? meal : m)) })),
    }));

  const toggleEaten = async (meal) => {
    replaceInPlan(meal._id, { ...meal, eaten: !meal.eaten }); // optimista
    try {
      await api.patch(`/mealplans/${plan._id}/meals/${meal._id}`, { eaten: !meal.eaten });
    } catch (err) {
      replaceInPlan(meal._id, meal);
      showError(err);
    }
  };

  const swapMeal = async (meal) => {
    setSwapping(meal._id);
    try {
      const { data } = await api.post(`/mealplans/${plan._id}/meals/${meal._id}/swap`, {});
      replaceInPlan(meal._id, data.meal, data.shoppingList);
      toast.success(`Nueva opción: ${data.meal.name}`);
    } catch (err) {
      showError(err);
    } finally {
      setSwapping(null);
    }
  };

  const useInPlan = async (meal, newMeal) => {
    const { data } = await api.put(`/mealplans/${plan._id}/meals/${meal._id}`, { meal: newMeal });
    replaceInPlan(meal._id, data.meal, data.shoppingList);
  };

  const favByName = (name) => favorites.find((f) => f.name.toLowerCase() === name?.toLowerCase());
  const toggleFavorite = async (meal) => {
    try {
      const fav = favByName(meal.name);
      if (fav) {
        const { data } = await api.delete(`/profile/favorites/${fav._id}`);
        setFavorites(data);
      } else {
        const { _id: _id1, eaten: _e, ...rest } = meal;
        const { data } = await api.post('/profile/favorites', {
          meal: { ...rest, ingredients: rest.ingredients.map(({ name, amount, unit, quantity, section }) => ({ name, amount, unit, quantity, section })) },
        });
        setFavorites(data);
        toast.success('⭐ Guardada: la IA la va a incluir en tus próximos planes');
      }
    } catch (err) {
      showError(err);
    }
  };

  // ---------- Armado manual ----------
  const setDay = (i, meals, shoppingList) =>
    setPlan((p) => ({ ...p, shoppingList, days: p.days.map((d, j) => (j === i ? { ...d, meals } : d)) }));

  const createBlank = async () => {
    if (plan && !confirm('Se va a reemplazar el plan de esta semana por uno vacío. ¿Seguimos?')) return;
    try {
      const { data } = await api.post('/mealplans/blank');
      setPlan(data);
      setIsCurrentWeek(true);
      setDayIndex(todayIndex(data.days));
      setView('week');
      toast.success('Plan en blanco listo: agregá tus comidas día por día');
    } catch (err) {
      showError(err);
    }
  };

  const saveMeal = async ({ meal, repeatDays }) => {
    try {
      if (editor.meal) {
        const { data } = await api.put(`/mealplans/${plan._id}/meals/${editor.meal._id}`, { meal, fit: false });
        replaceInPlan(editor.meal._id, data.meal, data.shoppingList);
      } else {
        for (const i of [dayIndex, ...repeatDays]) {
          const { data } = await api.post(`/mealplans/${plan._id}/days/${i}/meals`, { meal });
          setDay(i, data.meals, data.shoppingList);
        }
      }
      setEditor(null);
    } catch (err) {
      showError(err);
    }
  };

  const deleteMeal = async (meal) => {
    if (!confirm(`¿Eliminar "${meal.name}"?`)) return;
    try {
      const { data } = await api.delete(`/mealplans/${plan._id}/meals/${meal._id}`);
      setPlan((p) => ({
        ...p,
        shoppingList: data.shoppingList,
        days: p.days.map((d) => ({ ...d, meals: d.meals.filter((m) => m._id !== meal._id) })),
      }));
    } catch (err) {
      showError(err);
    }
  };

  const suggestMeal = async (type) => {
    setSuggesting(type);
    try {
      const { data } = await api.post(`/mealplans/${plan._id}/days/${dayIndex}/suggest`, { type });
      setDay(dayIndex, data.meals, data.shoppingList);
      toast.success(`Sugerencia: ${data.meal.name}`);
    } catch (err) {
      showError(err);
    } finally {
      setSuggesting(null);
    }
  };

  // ---------- Favoritas ----------
  const favToMeal = (f) => ({
    type: f.type,
    name: f.name,
    description: f.description ?? '',
    ingredients: (f.ingredients ?? []).map(({ name, amount, unit, quantity, section }) => ({ name, amount, unit, quantity, section })),
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    ...(f.recipe?.steps?.length && { recipe: { steps: f.recipe.steps, timeMinutes: f.recipe.timeMinutes ?? 0, tips: f.recipe.tips ?? '' } }),
  });

  const saveFavorite = async ({ meal }) => {
    try {
      const { data } = favEditor?.fav
        ? await api.put(`/profile/favorites/${favEditor.fav._id}`, { meal })
        : await api.post('/profile/favorites', { meal });
      setFavorites(data);
      setFavEditor(null);
      toast.success('⭐ Favorita guardada');
    } catch (err) {
      showError(err);
    }
  };

  const deleteFavorite = async (f) => {
    if (!confirm(`¿Eliminar "${f.name}" de tus favoritas?`)) return;
    try {
      const { data } = await api.delete(`/profile/favorites/${f._id}`);
      setFavorites(data);
    } catch (err) {
      showError(err);
    }
  };

  const addFavToDay = async (f, i) => {
    try {
      const { data } = await api.post(`/mealplans/${plan._id}/days/${i}/meals`, { meal: favToMeal(f) });
      setDay(i, data.meals, data.shoppingList);
      toast.success(`${f.name} → ${plan.days[i].day}`);
    } catch (err) {
      showError(err);
    }
  };

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
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Button onClick={() => setShowGenerate(true)} disabled={generating}>
              {generating ? <><Spinner size="sm" /> Generando tu semana…</> : '✨ Generar con IA'}
            </Button>
            <Button variant="light" onClick={createBlank} disabled={generating}>✎ Armarlo yo</Button>
          </div>
          {generating && <p className="text-muted small mt-3 mb-0">Esto tarda entre 15 y 40 segundos.</p>}
        </div>
        {generateModal}
      </div>
    );
  }

  const day = plan.days[Math.min(dayIndex, plan.days.length - 1)];
  const totals = sumMacros(day.meals);
  const allMeals = plan.days.flatMap((d) => d.meals);
  const eatenCount = allMeals.filter((m) => m.eaten).length;
  const dayEaten = day.meals.filter((m) => m.eaten).length;
  const todayMeals = plan.days[todayIndex(plan.days)]?.meals ?? [];
  const types = [...new Set(plan.days.flatMap((d) => d.meals.map((m) => m.type)))];
  const expected = { 2: ['almuerzo', 'cena'], 3: ['desayuno', 'almuerzo', 'cena'], 4: ['desayuno', 'almuerzo', 'merienda', 'cena'], 5: ['desayuno', 'colación', 'almuerzo', 'merienda', 'cena'], 6: MEAL_TYPES }[mealsPerDay] ?? ['desayuno', 'almuerzo', 'merienda', 'cena'];
  const missingTypes = expected.filter((t) => !day.meals.some((m) => m.type?.toLowerCase() === t));

  return (
    <div className="meal-page">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <div className="gym-crumb">Alimentación / Plan semanal</div>
          <h1 className="page-title-sm">Plan semanal</h1>
          <div className="gym-meta">
            <span>Semana del {fmtWeek(plan.weekStart)}</span>
            <span className="gym-badge" title="Comidas marcadas como hechas">
              ✓ {eatenCount}/{allMeals.length} hechas · {allMeals.length ? Math.round((eatenCount / allMeals.length) * 100) : 0}%
            </span>
            {plan.feedback && <span className="gym-badge" title={plan.feedback}>✎ con tus pedidos</span>}
          </div>
        </div>
        <Dropdown className="mt-3" align="end">
          <Dropdown.Toggle disabled={generating}>
            {generating ? <><Spinner size="sm" /> Generando…</> : 'Nuevo plan'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => setShowGenerate(true)}>✨ Generar con IA</Dropdown.Item>
            <Dropdown.Item onClick={createBlank}>✎ Empezar en blanco</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {!isCurrentWeek && !generating && (
        <div className="meal-banner">
          <span>📅</span>
          <div><b>Empezó una semana nueva.</b> Generá tu plan actualizado; podés pedirle cambios a la IA.</div>
          <Button size="sm" onClick={() => setShowGenerate(true)}>Generar</Button>
        </div>
      )}
      {generating && <div className="meal-banner"><Spinner size="sm" /><div>Armando tu semana con IA y ajustando porciones… tarda entre 20 y 50 segundos.</div></div>}

      {/* Vistas */}
      <div className="gym-views">
        <button className={`gym-view ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>▦ Semana</button>
        <button className={`gym-view ${view === 'favs' ? 'active' : ''}`} onClick={() => setView('favs')}>
          ⭐ Favoritas <span className="gym-badge">{favorites.length}</span>
        </button>
        <button className={`gym-view ${view === 'shopping' ? 'active' : ''}`} onClick={() => setView('shopping')}>
          🛒 Compras <span className="gym-badge">{plan.shoppingList.length}</span>
        </button>
        <button className={`gym-view ${view === 'fridge' ? 'active' : ''}`} onClick={() => setView('fridge')}>🧊 ¿Qué cocino?</button>
        <button className={`gym-view ${view === 'weight' ? 'active' : ''}`} onClick={() => setView('weight')}>⚖️ Peso</button>
      </div>

      {view === 'week' && (
        <>
          <div className="meal-days">
            {plan.days.map((d, i) => {
              const kcal = Math.round(sumMacros(d.meals).calories);
              const done = d.meals.length && d.meals.every((m) => m.eaten);
              return (
                <button key={d.day} className={`meal-day ${i === dayIndex ? 'active' : ''} ${done ? 'done' : ''}`} onClick={() => setDayIndex(i)}>
                  <span className="meal-day-name">{shortDay(d.day)}</span>
                  <span className="meal-day-kcal">{done ? '✓ completo' : kcal}</span>
                  {isToday(d.day) && <span className="meal-day-today">hoy</span>}
                </button>
              );
            })}
          </div>

          <div className="macro-grid">
            {MACROS.map(([k, label, unit]) => (
              <MacroBar key={k} label={label} unit={unit} value={totals[k]} target={plan.targets[k]} />
            ))}
          </div>

          <h5 className="meal-day-title">
            {day.day} <span className="text-muted fw-normal small">· {dayEaten} de {day.meals.length} hechas</span>
          </h5>
          <div className="meal-grid">
            {day.meals.map((m) => (
              <MealCard
                key={m._id}
                meal={m}
                onOpen={setOpenMeal}
                onToggleEaten={() => toggleEaten(m)}
                isFavorite={!!favByName(m.name)}
                onToggleFavorite={() => toggleFavorite(m)}
                onSwap={() => swapMeal(m)}
                swapping={swapping === m._id}
                onEdit={() => setEditor({ meal: m })}
                onDelete={() => deleteMeal(m)}
              />
            ))}
            <div className="meal-add">
              {!day.meals.length && <p className="text-muted small mb-2">Este día todavía no tiene comidas.</p>}
              <div className="d-flex gap-2 flex-wrap justify-content-center">
                <Button variant="light" size="sm" onClick={() => setEditor({ type: missingTypes[0] ?? 'almuerzo' })}>+ Agregar comida</Button>
                <Button variant="light" size="sm" onClick={() => setPicker(true)}>⭐ De favoritas</Button>
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" disabled={!!suggesting}>
                    {suggesting ? <><Spinner size="sm" /> Pensando {suggesting}…</> : '✨ Sugerir con IA'}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {[...missingTypes, ...MEAL_TYPES.filter((t) => !missingTypes.includes(t))].map((t) => (
                      <Dropdown.Item key={t} onClick={() => suggestMeal(t)} className="text-capitalize">
                        {t}{missingTypes.includes(t) ? ' · falta' : ''}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'favs' && (
        <FavoritesView
          favorites={favorites}
          days={plan.days.map((d) => d.day)}
          onNew={() => setFavEditor({})}
          onEdit={(fav) => setFavEditor({ fav })}
          onDelete={deleteFavorite}
          onAddToDay={addFavToDay}
        />
      )}

      {view === 'shopping' && <ShoppingList planId={plan._id} items={plan.shoppingList} />}

      {view === 'fridge' && (
        <FridgeView
          types={types.length ? types : expected}
          todayMeals={todayMeals}
          onUseInPlan={useInPlan}
          isFavorite={(name) => !!favByName(name)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {view === 'weight' && <WeightView onTargetsChange={() => {}} />}

      <RecipeDrawer planId={plan._id} meal={openMeal} onClose={closeRecipe} />
      <MealEditor
        show={!!editor}
        meal={editor?.meal}
        defaultType={editor?.type}
        days={plan.days.map((d) => d.day)}
        dayIndex={dayIndex}
        favorites={favorites}
        onHide={() => setEditor(null)}
        onSave={saveMeal}
      />
      <MealEditor
        mode="favorite"
        show={!!favEditor}
        meal={favEditor?.fav}
        defaultType={missingTypes[0] ?? 'desayuno'}
        onHide={() => setFavEditor(null)}
        onSave={saveFavorite}
      />
      <FavoritePicker
        show={picker}
        onHide={() => setPicker(false)}
        day={day}
        targets={plan.targets}
        favorites={favorites}
        defaultType={missingTypes[0]}
        onPick={(f) => addFavToDay(f, dayIndex)}
        onCreate={() => {
          setPicker(false);
          setFavEditor({});
        }}
      />
      {generateModal}
    </div>
  );
}
