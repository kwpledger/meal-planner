// Converts a recipe-line portion (amount + unit) into grams using the best
// available data for the matched food, then scales per-100g nutrients to
// that weight. See docs/plans - "Portion-size normalization" for the design.

const OUNCE_TO_GRAMS = 28.3495;
const POUND_TO_GRAMS = 453.592;

// Last-resort only, used when the matched food has no usable portion/serving
// data of its own - deliberately crude, and always flagged 'generic-fallback'
// so it never gets confused with a real per-food measurement.
const GENERIC_UNIT_TO_GRAMS = {
  cup: { default: 150, grain: 190, liquid: 240, leafy: 30, fruit: 150 },
  tbsp: { default: 15 },
  tsp: { default: 5 },
  slice: { default: 30 },
  large: { default: 50 },
  // Real live test caught "3 eggs" landing at 300g via a flat 100g/each
  // default (should be ~150g) - split out an egg-specific weight rather
  // than leaning on one generic bucket for every unitless, countable food.
  each: { default: 100, egg: 50, fruit: 118 },
};

const CATEGORY_KEYWORDS = {
  grain: ['oat', 'rice', 'quinoa', 'granola', 'wheat'],
  liquid: ['milk', 'oil', 'yogurt'],
  leafy: ['spinach', 'broccoli', 'greens', 'lettuce'],
  fruit: ['banana', 'strawberr', 'orange', 'apple'],
  egg: ['egg'],
};

function categoryOf(name) {
  const lower = (name || '').toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }

  return 'default';
}

function normalizeUnitToken(unit) {
  if (!unit) {
    return null;
  }

  const lower = unit.toLowerCase();

  if (['g', 'gram', 'grams'].includes(lower)) return 'g';
  if (['oz', 'ounce', 'ounces'].includes(lower)) return 'oz';
  if (['lb', 'lbs', 'pound', 'pounds'].includes(lower)) return 'lb';

  return lower;
}

// USDA foodPortions frequently sets measureUnit.name to the literal string
// "undetermined" - the actually-useful description (e.g. "large (8\" to
// 8-7/8\" long)", "NLEA serving") lives in `modifier`. Confirmed against the
// live API before wiring this in, rather than assumed from docs.
function findBestPortionMatch(foodPortions, unit) {
  if (!Array.isArray(foodPortions) || foodPortions.length === 0 || !unit) {
    return null;
  }

  const unitLower = unit.toLowerCase();

  const candidates = foodPortions.filter((portion) => portion.gramWeight);

  const exact = candidates.find((portion) => {
    const measure = (portion.measureUnit?.name || '').toLowerCase();
    return measure !== 'undetermined' && measure === unitLower;
  });
  if (exact) return exact;

  const modifierMatch = candidates.find((portion) => (portion.modifier || '').toLowerCase().includes(unitLower));
  if (modifierMatch) return modifierMatch;

  return null;
}

export function resolvePortionToGrams({ amount, unit, name, matchedFood }) {
  const normalizedUnit = normalizeUnitToken(unit);
  const safeAmount = amount == null ? 1 : amount;

  if (normalizedUnit === 'g') {
    return { grams: safeAmount, confidence: 'exact-weight' };
  }
  if (normalizedUnit === 'oz') {
    return { grams: safeAmount * OUNCE_TO_GRAMS, confidence: 'exact-weight' };
  }
  if (normalizedUnit === 'lb') {
    return { grams: safeAmount * POUND_TO_GRAMS, confidence: 'exact-weight' };
  }

  if (matchedFood?.source === 'usda' && Array.isArray(matchedFood.foodPortions)) {
    const portion = findBestPortionMatch(matchedFood.foodPortions, normalizedUnit || 'each');
    if (portion && portion.gramWeight) {
      const referenceAmount = portion.amount || 1;
      const grams = (safeAmount / referenceAmount) * portion.gramWeight;
      return { grams, confidence: 'food-portion' };
    }
  }

  if (matchedFood?.source === 'off' && matchedFood.servingQuantity) {
    return { grams: safeAmount * matchedFood.servingQuantity, confidence: 'food-portion' };
  }

  const fallbackKey = normalizedUnit || 'each';
  if (GENERIC_UNIT_TO_GRAMS[fallbackKey]) {
    const table = GENERIC_UNIT_TO_GRAMS[fallbackKey];
    const grams = table[categoryOf(name)] ?? table.default;
    return { grams: safeAmount * grams, confidence: 'generic-fallback' };
  }

  return { grams: null, confidence: 'unresolved' };
}

export function computeNutrientsForIngredient(ingredient) {
  if (ingredient.grams == null || !ingredient.nutrientsPer100g) {
    return null;
  }

  const factor = ingredient.grams / 100;
  const per100g = ingredient.nutrientsPer100g;

  return {
    calories: Math.round((per100g.calories || 0) * factor),
    carbs: Math.round((per100g.carbs || 0) * factor),
    protein: Math.round((per100g.protein || 0) * factor),
    fat: Math.round((per100g.fat || 0) * factor),
  };
}

export function recomputeMealFromIngredients(meal) {
  const totals = { calories: 0, carbs: 0, protein: 0, fat: 0 };

  meal.ingredients.forEach((ingredient) => {
    const nutrients = computeNutrientsForIngredient(ingredient);
    if (!nutrients) {
      return;
    }

    totals.calories += nutrients.calories;
    totals.carbs += nutrients.carbs;
    totals.protein += nutrients.protein;
    totals.fat += nutrients.fat;
  });

  return {
    calories: totals.calories,
    macros: { carbs: totals.carbs, protein: totals.protein, fat: totals.fat },
  };
}
