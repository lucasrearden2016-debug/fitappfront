import { useEffect, useState } from 'react';
import { Card, Button, Tabs, Tab, Badge, Modal, Spinner, Form, Alert, ListGroup, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api, { showError } from '../api/client';

const sum = (meals, k) => Math.round(meals.reduce((a, m) => a + (m[k] || 0), 0));

export default function MealPlan() {
  const [plan, setPlan] = useState(null);
  const [isCurrentWeek, setIsCurrentWeek] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [recipe, setRecipe] = useState(null); // { loading, data }

  useEffect(() => {
    api.get('/mealplans/current')
      .then(({ data }) => { setPlan(data.plan); setIsCurrentWeek(data.isCurrentWeek); })
      .catch((err) => err.response?.status !== 404 && showError(err))
      .finally(() => setLoading(false));
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/mealplans/generate', { feedback });
      setPlan(data);
      setIsCurrentWeek(true);
      setFeedback('');
      toast.success('¡Plan semanal listo!');
    } catch (err) {
      showError(err);
    } finally {
      setGenerating(false);
    }
  };

  const openRecipe = async (meal) => {
    setRecipe({ loading: true, title: meal.name });
    try {
      const { data } = await api.get(`/mealplans/${plan._id}/meals/${meal._id}/recipe`);
      setRecipe({ loading: false, title: meal.name, data });
    } catch (err) {
      showError(err);
      setRecipe(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <Card className="mb-4">
        <Card.Body>
          <h4>Plan semanal</h4>
          {plan && !isCurrentWeek && <Alert variant="warning">Empezó una semana nueva: ¡generá tu plan actualizado!</Alert>}
          <Form.Control
            as="textarea" rows={2} className="mb-2" value={feedback} onChange={(e) => setFeedback(e.target.value)}
            placeholder="Opcional: ¿qué querés cambiar? Ej: menos pollo, más pescado, cenas más rápidas..."
          />
          <Button onClick={generate} disabled={generating}>
            {generating ? <><Spinner size="sm" /> Generando (puede tardar ~30s)...</> : plan ? 'Generar plan de esta semana' : 'Generar mi primer plan'}
          </Button>
        </Card.Body>
      </Card>

      {plan && (
        <>
          <p>
            Objetivo diario: <Badge bg="primary">{plan.targets.calories} kcal</Badge>{' '}
            <Badge bg="secondary">P {plan.targets.protein}g</Badge>{' '}
            <Badge bg="secondary">C {plan.targets.carbs}g</Badge>{' '}
            <Badge bg="secondary">G {plan.targets.fat}g</Badge>
          </p>
          <Tabs defaultActiveKey={plan.days[0]?.day} className="mb-3">
            {plan.days.map((d) => (
              <Tab eventKey={d.day} title={d.day} key={d.day}>
                <p className="text-muted">
                  Total: {sum(d.meals, 'calories')} kcal · P {sum(d.meals, 'protein')}g · C {sum(d.meals, 'carbs')}g · G {sum(d.meals, 'fat')}g
                </p>
                <Row xs={1} md={2} className="g-3">
                  {d.meals.map((m) => (
                    <Col key={m._id}>
                      <Card className="h-100">
                        <Card.Body>
                          <Card.Subtitle className="text-muted text-capitalize mb-1">{m.type}</Card.Subtitle>
                          <Card.Title>{m.name}</Card.Title>
                          <Card.Text>{m.description}</Card.Text>
                          <small className="d-block mb-2">{Math.round(m.calories)} kcal · P {Math.round(m.protein)}g · C {Math.round(m.carbs)}g · G {Math.round(m.fat)}g</small>
                          <Button size="sm" variant="outline-primary" onClick={() => openRecipe(m)}>Ver receta</Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Tab>
            ))}
            <Tab eventKey="compras" title="🛒 Lista de compras">
              <ListGroup>{plan.shoppingList.map((i) => <ListGroup.Item key={i}>{i}</ListGroup.Item>)}</ListGroup>
            </Tab>
          </Tabs>
        </>
      )}

      <Modal show={!!recipe} onHide={() => setRecipe(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>{recipe?.title}</Modal.Title></Modal.Header>
        <Modal.Body>
          {recipe?.loading ? <Spinner /> : recipe?.data && (
            <>
              <p className="text-muted">⏱ {recipe.data.timeMinutes} min</p>
              <h6>Ingredientes</h6>
              <ul>{recipe.data.ingredients.map((i) => <li key={i.name}>{i.quantity} {i.name}</li>)}</ul>
              <h6>Pasos</h6>
              <ol>{recipe.data.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
              {recipe.data.tips && <Alert variant="info">💡 {recipe.data.tips}</Alert>}
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
