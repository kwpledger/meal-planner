// Shared by Export JSON and cloud sync so the two can't silently drift
// apart on what shape of `days` they claim to be writing.
export const SCHEMA_VERSION = 2;

const UNITS = ['cup', 'cups', 'tbsp', 'tsp', 'oz', 'slice', 'slices', 'large'];

// Trailing clauses like "cooked in 1 cup 2% milk" describe a second
// ingredient the parser can't yet score on its own - split it off into
// prepNote instead of silently folding its nutrition into the primary
// ingredient's match.
const PREP_SEPARATORS = [' cooked in ', ' topped with ', ' with '];

const UNIT_ALIASES = {
  cups: 'cup',
  slices: 'slice',
};

const UNICODE_FRACTIONS = { '¼': 0.25, '½': 0.5, '¾': 0.75 };

function isAmountToken(token) {
  return !Number.isNaN(Number(token)) || UNICODE_FRACTIONS[token] !== undefined || token.includes('/');
}

function parseAmountToken(token) {
  if (UNICODE_FRACTIONS[token] !== undefined) {
    return UNICODE_FRACTIONS[token];
  }

  if (token.includes('/')) {
    const [numerator, denominator] = token.split('/').map(Number);
    if (denominator) {
      return numerator / denominator;
    }
  }

  const numeric = Number(token);
  return Number.isNaN(numeric) ? null : numeric;
}

function normalizeUnit(unit) {
  return UNIT_ALIASES[unit] || unit;
}

export function parseIngredientLine(rawLine) {
  const trimmed = rawLine.trim();
  const parts = trimmed.split(' ');

  if (parts.length < 2) {
    return { amount: null, unit: null, name: trimmed.toLowerCase(), prepNote: null };
  }

  const first = parts[0];
  const second = parts[1]?.toLowerCase();
  const hasUnit = UNITS.includes(second);
  const startsWithAmount = isAmountToken(first);

  let amount = null;
  let unit = null;
  let rest;

  if (startsWithAmount && hasUnit) {
    amount = parseAmountToken(first);
    unit = normalizeUnit(second);
    rest = parts.slice(2).join(' ');
  } else if (startsWithAmount) {
    amount = parseAmountToken(first);
    rest = parts.slice(1).join(' ');
  } else {
    rest = trimmed;
  }

  let name = rest;
  let prepNote = null;

  for (const separator of PREP_SEPARATORS) {
    const index = rest.toLowerCase().indexOf(separator);
    if (index !== -1) {
      name = rest.slice(0, index);
      prepNote = rest.slice(index + separator.length).trim();
      break;
    }
  }

  return {
    amount,
    unit,
    name: name.trim().toLowerCase(),
    prepNote: prepNote || null,
  };
}

// Cache-key normalization for the ingredient library (Step 3) - deliberately
// lossy (de-pluralizes, drops parentheticals) since a merged cache entry is
// low-stakes, unlike grocery-list display which uses ingredient.name as-is.
export function normalizeIngredientName(name) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .trim()
    .replace(/s$/, '');
}

export function formatIngredientAmount(ingredient) {
  if (ingredient.amount == null) {
    return ingredient.raw;
  }

  return ingredient.unit ? `${ingredient.amount} ${ingredient.unit}` : `${ingredient.amount}`;
}

let ingredientIdCounter = 0;

function nextIngredientId(mealId) {
  ingredientIdCounter += 1;
  return `${mealId}-ing-${ingredientIdCounter}`;
}

export function buildIngredientFromLine(rawLine, mealId) {
  const parsed = parseIngredientLine(rawLine);

  return {
    id: nextIngredientId(mealId),
    raw: rawLine,
    amount: parsed.amount,
    unit: parsed.unit,
    name: parsed.name,
    prepNote: parsed.prepNote,
    grams: null,
    gramsConfidence: 'unresolved',
    nutrientsPer100g: null,
    source: null,
    matchedFoodId: null,
    matchedFoodName: null,
    verified: false,
  };
}

// Preserves already-resolved ingredient objects whose raw text didn't
// change, and only re-parses lines that are new or edited - so re-saving a
// meal doesn't discard match data gathered in later phases.
export function mergeIngredientsFromLines(lines, previousIngredients, mealId) {
  const previousByRaw = new Map((previousIngredients || []).map((ingredient) => [ingredient.raw, ingredient]));

  return lines
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => previousByRaw.get(line) || buildIngredientFromLine(line, mealId));
}

export function migrateMealIngredients(meal) {
  if (Array.isArray(meal.ingredients)) {
    return meal;
  }

  const details = Array.isArray(meal.details) ? meal.details : [];

  return {
    ...meal,
    ingredients: details.map((line) => buildIngredientFromLine(line, meal.id)),
  };
}

export function migrateDaysToIngredients(days) {
  return days.map((day) => ({
    ...day,
    meals: day.meals.map((meal) => migrateMealIngredients(meal)),
  }));
}
