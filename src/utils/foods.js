// Cálculo de macros a partir de la base de alimentos (valores por 100 g / 100 ml)

export const isLinked = (ing) => !!(ing?.foodId && ing?.per100);

// Gramos (o ml) reales del ingrediente según la unidad elegida
export function gramsOf(ing) {
  const amount = Number(String(ing.amount ?? '').replace(',', '.')) || 0;
  if (!isLinked(ing)) return 0;
  if (ing.unit === ing.unitName && ing.unitGrams) return amount * ing.unitGrams;
  return amount; // g o ml
}

export function macrosOf(ing) {
  const f = gramsOf(ing) / 100;
  const p = ing.per100 ?? {};
  return {
    calories: (p.calories || 0) * f,
    protein: (p.protein || 0) * f,
    carbs: (p.carbs || 0) * f,
    fat: (p.fat || 0) * f,
  };
}

export function sumIngredients(ings) {
  return ings.filter(isLinked).reduce(
    (a, i) => {
      const m = macrosOf(i);
      return { calories: a.calories + m.calories, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Lo que se copia del alimento al ingrediente al vincularlo
export const linkFood = (food) => ({
  foodId: food._id,
  name: food.name,
  brand: food.brand,
  per100: { calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat },
  baseUnit: food.baseUnit,
  unitName: food.unitName || '',
  unitGrams: food.unitGrams || null,
  section: food.section,
  unit: food.unitName ? food.unitName : food.baseUnit,
  amount: food.unitName ? 1 : 100,
});

export const unlink = (ing) => {
  const { foodId: _f, brand: _b, per100: _p, baseUnit: _u, unitName: _n, unitGrams: _g, ...rest } = ing;
  return rest;
};

// Misma regla que el back: que kcal y macros cierren
export function checkFood({ calories, protein, carbs, fat, fiber, baseUnit }) {
  const [k, p, c, f] = [calories, protein, carbs, fat].map((v) => Number(v) || 0);
  if (!k && !p && !c && !f) return null;
  if (baseUnit === 'g' && p + c + f + (Number(fiber) || 0) > 101) return 'Proteína + carbos + grasas no pueden pasar de 100 g.';
  const atwater = p * 4 + c * 4 + f * 9;
  if (Math.abs(atwater - k) > Math.max(25, k * 0.2)) return `Con esos macros serían ~${Math.round(atwater)} kcal. ¿Está todo por 100 ${baseUnit}?`;
  return null;
}

export const foodLabel = (f) => (f.brand && f.brand !== 'Genérico' ? `${f.name} · ${f.brand}` : f.name);
