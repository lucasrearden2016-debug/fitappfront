// Ícono de diamante dorado (Premium)
export const Diamond = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 3h12l4 6-10 12L2 9z" />
    <path d="M2 9h20M9 3l3 6 3-6M12 9v12" strokeLinecap="round" />
  </svg>
);

// Qué incluye Premium (claves en español, se traducen con t())
export const PREMIUM_FEATURES = [
  'Plan semanal de comidas armado por IA',
  'Recetas, sugerencias y "¿qué cocino con lo que tengo?"',
  'Calcular calorías de una comida con IA',
  'Rutina de gimnasio y recomendaciones del coach IA',
  'Sin anuncios, siempre',
];
