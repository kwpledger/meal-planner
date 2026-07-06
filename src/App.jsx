import { useEffect, useMemo, useRef, useState } from 'react';
import { searchUsdaFoods, searchOpenFoodFacts, getUsdaFoodDetail } from './nutritionApi';
import { migrateDaysToIngredients, mergeIngredientsFromLines, formatIngredientAmount, parseIngredientLine, SCHEMA_VERSION } from './ingredientParser';
import { resolvePortionToGrams, computeNutrientsForIngredient, recomputeMealFromIngredients } from './portionResolver';
import { loadLibrary, matchIngredient } from './ingredientLibrary';
import { pushToCloud, pullFromCloud } from './cloudSync';

const initialDays = [
  {
    id: 'day-1',
    day: 'Day 1',
    protein: 'Chicken',
    meals: [
      { id: 'd1-breakfast', type: 'Breakfast', name: 'Oatmeal Power Bowl', calories: 610, macros: { carbs: 78, protein: 22, fat: 22 }, details: ['0.75 cup oats cooked in 1 cup 2% milk', '1 banana', '1 Tbsp chia', '1 Tbsp peanut butter'], items: ['Oats + milk', 'Banana', 'Chia', 'Peanut butter'] },
      { id: 'd1-lunch', type: 'Lunch', name: 'Chicken Quinoa Bowl', calories: 650, macros: { carbs: 55, protein: 48, fat: 22 }, details: ['6 oz grilled chicken', '1 cup quinoa', '1 cup broccoli', '1 Tbsp olive oil'], items: ['Chicken', 'Quinoa', 'Broccoli', 'Olive oil'] },
      { id: 'd1-snack', type: 'Snack', name: 'Orange + Almonds', calories: 330, macros: { carbs: 32, protein: 7, fat: 18 }, details: ['1 orange', '1 oz almonds', '1 slice Dave\'s Killer Thin'], items: ['Orange', 'Almonds', 'Dave\'s Killer Thin'] },
      { id: 'd1-dinner', type: 'Dinner', name: 'Chicken + Sweet Potato', calories: 670, macros: { carbs: 60, protein: 45, fat: 16 }, details: ['6 oz chicken', '1 large sweet potato', '1 cup green beans', '1 tsp olive oil'], items: ['Chicken', 'Sweet potato', 'Green beans'] },
    ],
  },
  {
    id: 'day-2',
    day: 'Day 2',
    protein: 'Fish',
    meals: [
      { id: 'd2-breakfast', type: 'Breakfast', name: 'Coconut Yogurt Bowl', calories: 520, macros: { carbs: 60, protein: 8, fat: 24 }, details: ['1 cup coconut yogurt', '0.5 cup granola', '0.5 cup strawberries', '1 Tbsp chia'], items: ['Coconut yogurt', 'Granola', 'Strawberries', 'Chia'] },
      { id: 'd2-lunch', type: 'Lunch', name: 'Cod + Brown Rice', calories: 640, macros: { carbs: 70, protein: 42, fat: 18 }, details: ['6 oz cod', '1.25 cups brown rice', '1 cup spinach', '1 Tbsp olive oil'], items: ['Cod', 'Brown rice', 'Spinach'] },
      { id: 'd2-snack', type: 'Snack', name: 'Banana + PB Toast', calories: 330, macros: { carbs: 40, protein: 8, fat: 14 }, details: ['1 banana', '1 Dave\'s Killer Thin', '1 Tbsp peanut butter'], items: ['Banana', 'Dave\'s Killer Thin', 'Peanut butter'] },
      { id: 'd2-dinner', type: 'Dinner', name: 'Salmon + Veggies', calories: 740, macros: { carbs: 48, protein: 40, fat: 38 }, details: ['6 oz salmon', '1 cup roasted sweet potato', '1 cup zucchini', '1 tsp olive oil'], items: ['Salmon', 'Sweet potato', 'Zucchini'] },
    ],
  },
  {
    id: 'day-3',
    day: 'Day 3',
    protein: 'Chicken',
    meals: [
      { id: 'd3-breakfast', type: 'Breakfast', name: 'Egg + Grain Plate', calories: 560, macros: { carbs: 48, protein: 28, fat: 24 }, details: ['3 eggs', '2 slices Dave\'s Killer Thin', '1 cup strawberries'], items: ['Eggs', 'Dave\'s Killer Thin', 'Strawberries'] },
      { id: 'd3-lunch', type: 'Lunch', name: 'Chicken Wrap', calories: 620, macros: { carbs: 45, protein: 45, fat: 24 }, details: ['6 oz chicken', '1 whole-grain wrap', 'Spinach', '1 Tbsp olive oil'], items: ['Chicken', 'Wrap', 'Spinach'] },
      { id: 'd3-snack', type: 'Snack', name: 'Orange + Cashews', calories: 260, macros: { carbs: 22, protein: 5, fat: 16 }, details: ['1 orange', '1 oz cashews'], items: ['Orange', 'Cashews'] },
      { id: 'd3-dinner', type: 'Dinner', name: 'Chicken + Rice', calories: 800, macros: { carbs: 75, protein: 45, fat: 18 }, details: ['6 oz chicken', '1.25 cups brown rice', '1 cup broccoli'], items: ['Chicken', 'Brown rice', 'Broccoli'] },
    ],
  },
  {
    id: 'day-4',
    day: 'Day 4',
    protein: 'Ground Turkey',
    meals: [
      { id: 'd4-breakfast', type: 'Breakfast', name: 'Oatmeal Bowl', calories: 520, macros: { carbs: 65, protein: 18, fat: 14 }, details: ['0.75 cup oats', '1 cup 2% milk', '1 Tbsp chia', '0.5 cup strawberries'], items: ['Oats', 'Milk', 'Chia', 'Strawberries'] },
      { id: 'd4-lunch', type: 'Lunch', name: 'Turkey Quinoa Bowl', calories: 720, macros: { carbs: 65, protein: 48, fat: 22 }, details: ['6 oz ground turkey', '1.25 cups quinoa', '1 cup spinach', '1 Tbsp olive oil'], items: ['Ground turkey', 'Quinoa', 'Spinach'] },
      { id: 'd4-snack', type: 'Snack', name: 'Banana + Almonds', calories: 330, macros: { carbs: 38, protein: 7, fat: 16 }, details: ['1 banana', '1 oz almonds', '1 Dave\'s Killer Thin'], items: ['Banana', 'Almonds', 'Dave\'s Killer Thin'] },
      { id: 'd4-dinner', type: 'Dinner', name: 'Turkey + Sweet Potato', calories: 680, macros: { carbs: 60, protein: 45, fat: 16 }, details: ['6 oz turkey', '1 large sweet potato', '1 cup green beans'], items: ['Turkey', 'Sweet potato', 'Green beans'] },
    ],
  },
  {
    id: 'day-5',
    day: 'Day 5',
    protein: 'Chicken',
    meals: [
      { id: 'd5-breakfast', type: 'Breakfast', name: 'Coconut Yogurt Bowl', calories: 480, macros: { carbs: 55, protein: 7, fat: 20 }, details: ['1 cup coconut yogurt', '0.5 cup granola', '0.5 cup strawberries'], items: ['Coconut yogurt', 'Granola', 'Strawberries'] },
      { id: 'd5-lunch', type: 'Lunch', name: 'Chicken + Brown Rice', calories: 700, macros: { carbs: 75, protein: 45, fat: 18 }, details: ['6 oz chicken', '1.25 cups brown rice', '1 cup broccoli'], items: ['Chicken', 'Brown rice', 'Broccoli'] },
      { id: 'd5-snack', type: 'Snack', name: 'Orange + PB Toast', calories: 300, macros: { carbs: 30, protein: 7, fat: 14 }, details: ['1 orange', '1 Dave\'s Killer Thin', '1 Tbsp peanut butter'], items: ['Orange', 'Dave\'s Killer Thin', 'Peanut butter'] },
      { id: 'd5-dinner', type: 'Dinner', name: 'Chicken + Sweet Potato', calories: 740, macros: { carbs: 60, protein: 45, fat: 22 }, details: ['6 oz chicken', '1 large sweet potato', '1 cup spinach'], items: ['Chicken', 'Sweet potato', 'Spinach'] },
    ],
  },
  {
    id: 'day-6',
    day: 'Day 6',
    protein: 'Fish',
    meals: [
      { id: 'd6-breakfast', type: 'Breakfast', name: 'Egg + Grain Plate', calories: 560, macros: { carbs: 48, protein: 28, fat: 24 }, details: ['3 eggs', '2 slices Dave\'s Killer Thin', '1 cup strawberries'], items: ['Eggs', 'Dave\'s Killer Thin', 'Strawberries'] },
      { id: 'd6-lunch', type: 'Lunch', name: 'Cod + Quinoa', calories: 700, macros: { carbs: 70, protein: 42, fat: 18 }, details: ['6 oz cod', '1.25 cups quinoa', '1 cup spinach'], items: ['Cod', 'Quinoa', 'Spinach'] },
      { id: 'd6-snack', type: 'Snack', name: 'Banana + Almonds', calories: 260, macros: { carbs: 28, protein: 6, fat: 14 }, details: ['1 banana', '1 oz almonds'], items: ['Banana', 'Almonds'] },
      { id: 'd6-dinner', type: 'Dinner', name: 'Salmon + Veggies', calories: 780, macros: { carbs: 48, protein: 40, fat: 38 }, details: ['6 oz salmon', '1 cup sweet potato', '1 cup green beans', '1 tsp olive oil'], items: ['Salmon', 'Sweet potato', 'Green beans', 'Olive oil'] },
    ],
  },
  {
    id: 'day-7',
    day: 'Day 7',
    protein: 'Red Meat',
    meals: [
      { id: 'd7-breakfast', type: 'Breakfast', name: 'Oatmeal Bowl', calories: 520, macros: { carbs: 65, protein: 18, fat: 14 }, details: ['0.75 cup oats', '1 cup 2% milk', '1 Tbsp chia', '0.5 cup strawberries'], items: ['Oats', 'Milk', 'Chia', 'Strawberries'] },
      { id: 'd7-lunch', type: 'Lunch', name: 'Chicken Wrap', calories: 620, macros: { carbs: 45, protein: 45, fat: 24 }, details: ['6 oz chicken', '1 whole-grain wrap', 'Spinach', '1 Tbsp olive oil'], items: ['Chicken', 'Wrap', 'Spinach'] },
      { id: 'd7-snack', type: 'Snack', name: 'Orange + Almonds', calories: 260, macros: { carbs: 22, protein: 6, fat: 14 }, details: ['1 orange', '1 oz almonds'], items: ['Orange', 'Almonds'] },
      { id: 'd7-dinner', type: 'Dinner', name: 'Lean Beef Plate', calories: 840, macros: { carbs: 60, protein: 45, fat: 30 }, details: ['6 oz lean beef', '1.25 cups sweet potato', '1 cup broccoli'], items: ['Lean beef', 'Sweet potato', 'Broccoli'] },
    ],
  },
];

const colorMap = {
  Breakfast: 'bg-amber-100 border-amber-300',
  Lunch: 'bg-sky-100 border-sky-300',
  Snack: 'bg-green-100 border-green-300',
  Dinner: 'bg-rose-100 border-rose-300',
};

const mealOrder = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

const macroTargets = {
  carbs: 40,
  protein: 30,
  fat: 30,
};

const CONFIDENCE_LABELS = {
  'exact-weight': { label: 'exact weight', className: 'bg-green-100 text-green-800' },
  'food-portion': { label: 'matched portion', className: 'bg-green-100 text-green-800' },
  'generic-fallback': { label: 'rough estimate', className: 'bg-yellow-100 text-yellow-800' },
  unresolved: { label: 'unresolved', className: 'bg-red-100 text-red-800' },
};

function PortionResolutionPreview({ resolution }) {
  if (resolution.status === 'loading') {
    return <div className="mt-2 text-xs text-slate-500">Resolving portion...</div>;
  }

  if (resolution.status === 'error') {
    return <div className="mt-2 text-xs text-red-600">{resolution.message}</div>;
  }

  const confidence = CONFIDENCE_LABELS[resolution.confidence] || CONFIDENCE_LABELS.unresolved;

  return (
    <div className="mt-2 rounded-lg bg-white border border-slate-200 p-2 text-xs">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full font-semibold ${confidence.className}`}>
          {confidence.label}
        </span>
        <span className="text-slate-600">
          {resolution.grams != null ? `${Math.round(resolution.grams)} g` : 'no grams resolved'}
        </span>
      </div>

      {resolution.nutrients && (
        <div className="mt-1 text-slate-600">
          {resolution.nutrients.calories} cal • C {resolution.nutrients.carbs}g • P{' '}
          {resolution.nutrients.protein}g • F {resolution.nutrients.fat}g
        </div>
      )}
    </div>
  );
}

function AutoMatchPreview({ result }) {
  if (result.status === 'loading') {
    return <div className="mb-3 text-xs text-slate-500">Matching...</div>;
  }

  if (result.status === 'error') {
    return <div className="mb-3 text-xs text-red-600">{result.message}</div>;
  }

  const confidence = CONFIDENCE_LABELS[result.confidence] || CONFIDENCE_LABELS.unresolved;

  return (
    <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-slate-800">{result.entry.matchedFoodName}</span>
        <span className="text-slate-500">{result.fromCache ? 'from cache' : 'newly matched'}</span>
      </div>

      <div className="text-slate-500 mt-1">
        Source: {result.entry.source === 'usda' ? `USDA${result.entry.dataType ? ` • ${result.entry.dataType}` : ''}` : 'Open Food Facts'}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className={`px-2 py-0.5 rounded-full font-semibold ${confidence.className}`}>{confidence.label}</span>
        <span className="text-slate-600">{result.grams != null ? `${Math.round(result.grams)} g` : 'no grams resolved'}</span>
      </div>

      {result.nutrients && (
        <div className="mt-1 text-slate-600">
          {result.nutrients.calories} cal • C {result.nutrients.carbs}g • P {result.nutrients.protein}g • F {result.nutrients.fat}g
        </div>
      )}
    </div>
  );
}

function getMealSortValue(meal) {
  return mealOrder.indexOf(meal.type);
}

const STORAGE_KEY = 'kevin-meal-planner-state-v2';
const STORAGE_UPDATED_AT_KEY = 'kevin-meal-planner-state-v2-updated-at';

export default function MealPlanBoard() {
  const [days, setDays] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        return migrateDaysToIngredients(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved meal plan:', error);
      }
    }

    return migrateDaysToIngredients(initialDays);
  });
  const [draggedMeal, setDraggedMeal] = useState(null);
  const [dragOverDayId, setDragOverDayId] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState([]);
  const [proteinFilter, setProteinFilter] = useState('All');
  const [swapMode, setSwapMode] = useState(false);
  const [selectedSwapMeal, setSelectedSwapMeal] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    ingredients: [],
    items: [],
  });
  const [nutritionQuery, setNutritionQuery] = useState("");
  const [nutritionResults, setNutritionResults] = useState([]);
  const [nutritionLookupStatus, setNutritionLookupStatus] = useState("");
  const [portionResolutions, setPortionResolutions] = useState({});
  const [ingredientLibrary, setIngredientLibrary] = useState(() => loadLibrary());
  const [autoMatchResult, setAutoMatchResult] = useState(null);
  const [recomputePreview, setRecomputePreview] = useState(null);
  const [pastedIngredients, setPastedIngredients] = useState("");
  const [normalizeState, setNormalizeState] = useState(null);
  const normalizeCancelRef = useRef(false);
  const [syncBusy, setSyncBusy] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [pullPreview, setPullPreview] = useState(null);

  function handleEditField(field, value) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateIngredientRow(index, updates) {
    setEditForm((current) => {
      const ingredients = [...current.ingredients];
      const existing = ingredients[index];
      const updated = { ...existing, ...updates };

      // Editing amount/unit/name means the row no longer describes the
      // portion its match was resolved for - clear stale match data rather
      // than silently keep showing grams/macros for the old text.
      if ('amount' in updates || 'unit' in updates || 'name' in updates) {
        updated.raw = [formatIngredientAmount(updated), updated.name].filter(Boolean).join(' ').trim();
        updated.grams = null;
        updated.gramsConfidence = 'unresolved';
        updated.nutrientsPer100g = null;
        updated.source = null;
        updated.matchedFoodId = null;
        updated.matchedFoodName = null;
        updated.verified = false;
      }

      ingredients[index] = updated;
      return { ...current, ingredients };
    });
  }

  function addIngredientRow() {
    setEditForm((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        {
          id: `${editingMeal?.id || 'meal'}-ing-new-${Date.now()}`,
          raw: '',
          amount: null,
          unit: null,
          name: '',
          prepNote: null,
          grams: null,
          gramsConfidence: 'unresolved',
          nutrientsPer100g: null,
          source: null,
          matchedFoodId: null,
          matchedFoodName: null,
          verified: false,
        },
      ],
    }));
  }

  function removeIngredientRow(index) {
    setEditForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, i) => i !== index),
    }));
  }

  function applyPastedIngredients() {
    const lines = pastedIngredients.split('\n');

    setEditForm((current) => ({
      ...current,
      ingredients: mergeIngredientsFromLines(lines, current.ingredients, editingMeal?.id || 'meal'),
    }));

    setPastedIngredients('');
  }

  async function handleMatchRow(index) {
    const ingredient = editForm.ingredients[index];

    if (!ingredient.name) {
      return;
    }

    const { entry, library } = await matchIngredient(ingredient.raw || ingredient.name, ingredientLibrary);
    setIngredientLibrary(library);

    if (!entry) {
      return;
    }

    const matchedFood = entry.source === 'usda'
      ? { source: 'usda', foodPortions: entry.foodPortions }
      : { source: 'off', servingQuantity: entry.servingQuantity };

    const { grams, confidence } = resolvePortionToGrams({
      amount: ingredient.amount,
      unit: ingredient.unit,
      name: ingredient.name,
      matchedFood,
    });

    updateIngredientRow(index, {
      grams,
      gramsConfidence: confidence,
      nutrientsPer100g: entry.nutrientsPer100g,
      source: entry.source,
      matchedFoodId: entry.matchedFoodId,
      matchedFoodName: entry.matchedFoodName,
      // Auto-match, flag for review: always land unverified so Kevin knows
      // to spot-check it, regardless of how confident the resolution was.
      verified: false,
    });
  }

  async function handleMatchAllRows() {
    let library = ingredientLibrary;

    for (let index = 0; index < editForm.ingredients.length; index += 1) {
      const ingredient = editForm.ingredients[index];

      if (!ingredient.name || ingredient.gramsConfidence !== 'unresolved') {
        continue;
      }

      const { entry, library: nextLibrary } = await matchIngredient(ingredient.raw || ingredient.name, library);
      library = nextLibrary;

      if (!entry) {
        continue;
      }

      const matchedFood = entry.source === 'usda'
        ? { source: 'usda', foodPortions: entry.foodPortions }
        : { source: 'off', servingQuantity: entry.servingQuantity };

      const { grams, confidence } = resolvePortionToGrams({
        amount: ingredient.amount,
        unit: ingredient.unit,
        name: ingredient.name,
        matchedFood,
      });

      updateIngredientRow(index, {
        grams,
        gramsConfidence: confidence,
        nutrientsPer100g: entry.nutrientsPer100g,
        source: entry.source,
        matchedFoodId: entry.matchedFoodId,
        matchedFoodName: entry.matchedFoodName,
        verified: false,
      });
    }

    setIngredientLibrary(library);
  }

  function handleRecomputeFromIngredients() {
    setRecomputePreview(recomputeMealFromIngredients({ ingredients: editForm.ingredients }));
  }

  function applyRecomputedTotals() {
    if (!recomputePreview) {
      return;
    }

    setEditForm((current) => ({
      ...current,
      calories: recomputePreview.calories,
      carbs: recomputePreview.macros.carbs,
      protein: recomputePreview.macros.protein,
      fat: recomputePreview.macros.fat,
    }));

    setRecomputePreview(null);
  }

  // Resolves grams/matches for every not-yet-resolved ingredient across the
  // whole board in one pass, reusing the ingredient library cache (so a
  // repeated ingredient like "chicken" only hits the network once). This
  // writes ingredient match data immediately - that part is safe, since it
  // doesn't change any calorie/macro number currently on screen. It does
  // NOT touch meal.calories/macros itself; those go through the review step
  // below so nothing changes without an explicit apply.
  async function handleNormalizeBoard() {
    const targets = [];

    days.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.ingredients.forEach((ingredient) => {
          if (ingredient.name && ingredient.gramsConfidence === 'unresolved') {
            targets.push({ dayId: day.id, mealId: meal.id, ingredientId: ingredient.id });
          }
        });
      });
    });

    if (targets.length === 0) {
      setNormalizeState({ status: 'no-targets' });
      return;
    }

    normalizeCancelRef.current = false;
    setNormalizeState({ status: 'running', current: 0, total: targets.length });

    let library = ingredientLibrary;
    const workingDays = structuredClone(days);

    for (let i = 0; i < targets.length; i += 1) {
      if (normalizeCancelRef.current) {
        break;
      }

      const target = targets[i];
      const day = workingDays.find((d) => d.id === target.dayId);
      const meal = day.meals.find((m) => m.id === target.mealId);
      const ingredient = meal.ingredients.find((ing) => ing.id === target.ingredientId);

      // eslint-disable-next-line no-await-in-loop
      const { entry, library: nextLibrary } = await matchIngredient(ingredient.raw, library);
      library = nextLibrary;

      if (entry) {
        const matchedFood = entry.source === 'usda'
          ? { source: 'usda', foodPortions: entry.foodPortions }
          : { source: 'off', servingQuantity: entry.servingQuantity };

        const { grams, confidence } = resolvePortionToGrams({
          amount: ingredient.amount,
          unit: ingredient.unit,
          name: ingredient.name,
          matchedFood,
        });

        ingredient.grams = grams;
        ingredient.gramsConfidence = confidence;
        ingredient.nutrientsPer100g = entry.nutrientsPer100g;
        ingredient.source = entry.source;
        ingredient.matchedFoodId = entry.matchedFoodId;
        ingredient.matchedFoodName = entry.matchedFoodName;
        ingredient.verified = false;
      }

      setNormalizeState({ status: 'running', current: i + 1, total: targets.length });

      // Sequential with a short delay - a good API citizen, and safer
      // against transient failures than firing requests in parallel.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIngredientLibrary(library);
    setDays(workingDays);

    // Only compare meals where every ingredient actually resolved. A
    // partially-matched meal (e.g. a cancelled run, or one ingredient with
    // no match at all) would otherwise "compute" to a near-zero total that
    // looks like a real, applicable number - it isn't, it's just missing
    // data, and applying it would wipe out that meal's calories.
    const comparisons = [];
    let skippedCount = 0;

    workingDays.forEach((day) => {
      day.meals.forEach((meal) => {
        const allResolved = meal.ingredients.length > 0
          && meal.ingredients.every((ingredient) => ingredient.gramsConfidence !== 'unresolved');

        if (!allResolved) {
          skippedCount += 1;
          return;
        }

        const computed = recomputeMealFromIngredients(meal);
        const delta = computed.calories - meal.calories;

        if (Math.abs(delta) >= 1) {
          comparisons.push({
            dayId: day.id,
            dayName: day.day,
            mealId: meal.id,
            mealName: meal.name,
            mealType: meal.type,
            stored: { calories: meal.calories, macros: meal.macros },
            computed,
            delta,
          });
        }
      });
    });

    comparisons.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    setNormalizeState({ status: 'review', comparisons, cancelled: normalizeCancelRef.current, skippedCount });
  }

  function cancelNormalizeBoard() {
    normalizeCancelRef.current = true;
  }

  function applyNormalizeComparison(comparison) {
    setDays((currentDays) => currentDays.map((day) => {
      if (day.id !== comparison.dayId) {
        return day;
      }

      return {
        ...day,
        meals: day.meals.map((meal) => (
          meal.id === comparison.mealId
            ? { ...meal, calories: comparison.computed.calories, macros: comparison.computed.macros }
            : meal
        )),
      };
    }));

    setNormalizeState((current) => current && {
      ...current,
      comparisons: current.comparisons.filter((c) => c.mealId !== comparison.mealId),
    });
  }

  function applyAllNormalizeComparisons() {
    if (!normalizeState?.comparisons) {
      return;
    }

    const byMealId = new Map(normalizeState.comparisons.map((c) => [c.mealId, c]));

    setDays((currentDays) => currentDays.map((day) => ({
      ...day,
      meals: day.meals.map((meal) => {
        const comparison = byMealId.get(meal.id);
        return comparison
          ? { ...meal, calories: comparison.computed.calories, macros: comparison.computed.macros }
          : meal;
      }),
    })));

    setNormalizeState((current) => current && { ...current, comparisons: [] });
  }

  async function handleSyncToCloud() {
    setSyncBusy('push');
    setSyncStatus(null);

    try {
      const { pushedAt } = await pushToCloud(days);
      setSyncStatus({ type: 'success', message: `Synced to cloud at ${new Date(pushedAt).toLocaleString()}.` });
    } catch (error) {
      setSyncStatus({ type: 'error', message: `Sync to cloud failed: ${error.message}` });
    } finally {
      setSyncBusy(null);
    }
  }

  // Pull is two-step: fetch what's in the cloud and show it alongside the
  // local last-saved time first, rather than immediately overwriting the
  // board - the only sync direction that can destroy unsaved local work.
  async function handleSyncFromCloud() {
    setSyncBusy('pull');
    setSyncStatus(null);

    try {
      const result = await pullFromCloud();

      if (result.status === 'empty') {
        setSyncStatus({ type: 'info', message: 'No cloud backup yet - use "Sync to Cloud" first.' });
        return;
      }

      if (result.status === 'incompatible') {
        setSyncStatus({
          type: 'error',
          message: `Cloud data uses a newer format (schema v${result.cloudSchemaVersion}) than this app version supports. Update the app before pulling.`,
        });
        return;
      }

      setPullPreview({
        days: result.days,
        cloudUpdatedAt: result.updatedAt,
        localUpdatedAt: localStorage.getItem(STORAGE_UPDATED_AT_KEY),
      });
    } catch (error) {
      setSyncStatus({ type: 'error', message: `Sync from cloud failed: ${error.message}` });
    } finally {
      setSyncBusy(null);
    }
  }

  function confirmPullFromCloud() {
    if (!pullPreview) {
      return;
    }

    setDays(migrateDaysToIngredients(pullPreview.days));
    setSyncStatus({ type: 'success', message: `Pulled cloud data from ${new Date(pullPreview.cloudUpdatedAt).toLocaleString()}.` });
    setPullPreview(null);
  }

useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    localStorage.setItem(STORAGE_UPDATED_AT_KEY, new Date().toISOString());
  }, [days]);

  const filteredDays = useMemo(() => {
    if (proteinFilter === 'All') {
      return days;
    }

    return days.filter((day) => day.protein === proteinFilter);
  }, [days, proteinFilter]);

  const weeklyCalories = useMemo(() => {
    return days.reduce((weekTotal, day) => {
      return weekTotal + day.meals.reduce((dayTotal, meal) => dayTotal + meal.calories, 0);
    }, 0);
  }, [days]);

  const groceryList = useMemo(() => {
    const groceryMap = new Map();

    days.forEach((day) => {
      day.meals.forEach((meal) => {
        meal.ingredients.forEach((ingredient) => {
          const existingUses = groceryMap.get(ingredient.name) || [];

          groceryMap.set(ingredient.name, [
            ...existingUses,
            {
              day: day.day,
              mealType: meal.type,
              mealName: meal.name,
              amount: formatIngredientAmount(ingredient),
              original: ingredient.raw,
            },
          ]);
        });
      });
    });

    return Array.from(groceryMap.entries())
      .map(([ingredient, uses]) => ({ ingredient, uses }))
      .sort((a, b) => a.ingredient.localeCompare(b.ingredient));
  }, [days]);

  const prepGroups = useMemo(() => {
    const groups = {
      Proteins: ['chicken', 'cod', 'salmon', 'turkey', 'lean beef', 'eggs'],
      'Grains & Starches': ['oats', 'quinoa', 'brown rice', 'bread', 'wrap', 'sweet potato', 'granola'],
      Produce: ['banana', 'orange', 'strawberries', 'spinach', 'broccoli', 'zucchini', 'green beans'],
      Pantry: ['olive oil', 'chia', 'peanut butter', 'almonds', 'cashews'],
      Other: [],
    };

    const grouped = {
      Proteins: [],
      'Grains & Starches': [],
      Produce: [],
      Pantry: [],
      Other: [],
    };

    groceryList.forEach((entry) => {
      const matchingGroup = Object.entries(groups).find(([groupName, keywords]) => {
        if (groupName === 'Other') return false;
        return keywords.some((keyword) => entry.ingredient.includes(keyword));
      });

      const groupName = matchingGroup ? matchingGroup[0] : 'Other';
      grouped[groupName].push(entry);
    });

    return grouped;
  }, [groceryList]);

  const cronometerText = useMemo(() => {
    return days
      .map((day) => {
        const mealLines = day.meals.map((meal) => {
          const ingredients = meal.ingredients
            .map((ingredient) => `    - ${ingredient.raw}`)
            .join('\n');

          return `  ${meal.type}: ${meal.name}\n${ingredients}\n    Planner estimate: ${meal.calories} cal | C ${meal.macros.carbs}g | P ${meal.macros.protein}g | F ${meal.macros.fat}g`;
        });

        return `${day.day} — ${day.protein}\n${mealLines.join('\n\n')}`;
      })
      .join('\n\n---\n\n');
  }, [days]);

  function copyCronometerText() {
    navigator.clipboard.writeText(cronometerText);
  }

  function handleDragStart(meal, sourceDayId) {
    setDraggedMeal({ meal, sourceDayId });
  }

  function handleMealClick(meal, dayId, dayName) {
    if (!swapMode) {
      setSelectedMeal({ ...meal, day: dayName });
      return;
    }

    if (!selectedSwapMeal) {
      setSelectedSwapMeal({ meal, dayId });
      return;
    }

    if (selectedSwapMeal.meal.id === meal.id) {
      setSelectedSwapMeal(null);
      return;
    }

    setDays((currentDays) => {
      const updatedDays = structuredClone(currentDays);

      const sourceDay = updatedDays.find((day) => day.id === selectedSwapMeal.dayId);
      const targetDay = updatedDays.find((day) => day.id === dayId);

      const sourceIndex = sourceDay.meals.findIndex((item) => item.id === selectedSwapMeal.meal.id);
      const targetIndex = targetDay.meals.findIndex((item) => item.id === meal.id);

      const tempMeal = sourceDay.meals[sourceIndex];
      sourceDay.meals[sourceIndex] = targetDay.meals[targetIndex];
      targetDay.meals[targetIndex] = tempMeal;

      sourceDay.meals.sort((a, b) => getMealSortValue(a) - getMealSortValue(b));
      targetDay.meals.sort((a, b) => getMealSortValue(a) - getMealSortValue(b));

      return updatedDays;
    });

    setSelectedSwapMeal(null);
  }

  function handleDrop(targetDayId) {
    if (!draggedMeal) return;

    setDays((currentDays) => {
      const movingMeal = draggedMeal.meal;

      return currentDays.map((day) => {
        if (day.id === draggedMeal.sourceDayId) {
          return {
            ...day,
            meals: day.meals.filter((meal) => meal.id !== movingMeal.id),
          };
        }

        if (day.id === targetDayId) {
          const alreadyExists = day.meals.some((meal) => meal.id === movingMeal.id);
          const updatedMeals = alreadyExists ? day.meals : [...day.meals, movingMeal];

          return {
            ...day,
            meals: updatedMeals.sort((a, b) => getMealSortValue(a) - getMealSortValue(b)),
          };
        }

        return day;
      });
    });

    setDraggedMeal(null);
    setDragOverDayId(null);
  }

  async function handleNutritionLookup(source = "usda") {
    const query = nutritionQuery.trim();

    if (!query) {
      setNutritionLookupStatus("Enter a food to search first.");
      return;
    }

    setNutritionLookupStatus(`Searching ${source === "usda" ? "USDA" : "Open Food Facts"}...`);
    setNutritionResults([]);

    try {
      if (source === "usda") {
        const data = await searchUsdaFoods(query);
        setNutritionResults(
          (data.foods || []).map((food) => ({
            source: "USDA",
            id: food.fdcId,
            name: food.description,
            dataType: food.dataType,
            brand: food.brandOwner || food.brandName || "",
            calories:
              food.foodNutrients?.find((n) => n.nutrientName === "Energy")?.value ?? null,
            protein:
              food.foodNutrients?.find((n) => n.nutrientName === "Protein")?.value ?? null,
            carbs:
              food.foodNutrients?.find((n) => n.nutrientName === "Carbohydrate, by difference")?.value ?? null,
            fat:
              food.foodNutrients?.find((n) => n.nutrientName === "Total lipid (fat)")?.value ?? null,
          }))
        );
      } else {
        const data = await searchOpenFoodFacts(query);
        setNutritionResults(
          (data.products || []).map((product) => ({
            source: "Open Food Facts",
            id: product.code,
            name: product.product_name || "Unnamed product",
            brand: product.brands || "",
            servingSize: product.serving_size || "",
            servingQuantity: product.serving_quantity ?? null,
            calories: product.nutriments?.["energy-kcal_100g"] ?? null,
            protein: product.nutriments?.proteins_100g ?? null,
            carbs: product.nutriments?.carbohydrates_100g ?? null,
            fat: product.nutriments?.fat_100g ?? null,
          }))
        );
      }

      setNutritionLookupStatus("Lookup complete. Values are usually per 100g unless otherwise noted.");
    } catch (error) {
      setNutritionLookupStatus(error.message);
    }
  }

  // Type an ingredient line into the search box (e.g. "0.75 cup oats") and
  // resolve it against a specific search result - proves the portion/gram
  // pipeline against real API data before it's wired into full ingredient
  // rows. Not applied to any meal yet; informational only.
  async function handleResolvePortion(result) {
    const key = `${result.source}-${result.id}`;
    const parsedLine = parseIngredientLine(nutritionQuery.trim() || result.name);

    setPortionResolutions((current) => ({ ...current, [key]: { status: 'loading' } }));

    try {
      let matchedFood;

      if (result.source === 'USDA') {
        const detail = await getUsdaFoodDetail(result.id);
        matchedFood = { source: 'usda', foodPortions: detail.foodPortions || [] };
      } else {
        matchedFood = { source: 'off', servingQuantity: result.servingQuantity };
      }

      const { grams, confidence } = resolvePortionToGrams({
        amount: parsedLine.amount,
        unit: parsedLine.unit,
        name: parsedLine.name || result.name,
        matchedFood,
      });

      const nutrients = grams == null
        ? null
        : computeNutrientsForIngredient({
            grams,
            nutrientsPer100g: {
              calories: result.calories,
              carbs: result.carbs,
              protein: result.protein,
              fat: result.fat,
            },
          });

      setPortionResolutions((current) => ({
        ...current,
        [key]: { status: 'done', grams, confidence, nutrients, parsedLine },
      }));
    } catch (error) {
      setPortionResolutions((current) => ({
        ...current,
        [key]: { status: 'error', message: error.message },
      }));
    }
  }

  // Auto-picks the best USDA/OFF match for a plain ingredient name (no
  // manual result-clicking), reusing the ingredient library cache. This is
  // the same orchestrator the future per-row editor and bulk-normalize
  // action will call - exercising it here first proves cache reuse works
  // before it's wired into meal data.
  async function handleAutoMatch() {
    const query = nutritionQuery.trim();

    if (!query) {
      setAutoMatchResult({ status: 'error', message: 'Enter an ingredient line first.' });
      return;
    }

    setAutoMatchResult({ status: 'loading' });

    const { entry, library, fromCache } = await matchIngredient(query, ingredientLibrary);
    setIngredientLibrary(library);

    if (!entry) {
      setAutoMatchResult({ status: 'error', message: 'No USDA or Open Food Facts match found.' });
      return;
    }

    const parsedLine = parseIngredientLine(query);
    const matchedFood = entry.source === 'usda'
      ? { source: 'usda', foodPortions: entry.foodPortions }
      : { source: 'off', servingQuantity: entry.servingQuantity };

    const { grams, confidence } = resolvePortionToGrams({
      amount: parsedLine.amount,
      unit: parsedLine.unit,
      name: parsedLine.name,
      matchedFood,
    });

    const nutrients = grams == null ? null : computeNutrientsForIngredient({ grams, nutrientsPer100g: entry.nutrientsPer100g });

    setAutoMatchResult({ status: 'done', entry, fromCache, grams, confidence, nutrients });
  }

  function toggleCollapsed(dayId) {
    setCollapsedDays((current) => {
      if (current.includes(dayId)) {
        return current.filter((id) => id !== dayId);
      }

      return [...current, dayId];
    });
  }

  function importMealPlan(event) {
    const file = event.target.files?.[0];
  
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        const importedData = JSON.parse(loadEvent.target.result);

        const importedDays = Array.isArray(importedData)
          ? importedData
          : importedData.days;

        if (!Array.isArray(importedDays)) {
          throw new Error("Imported file does not contain a valid days array.");
        }

        setDays(migrateDaysToIngredients(importedDays));
        setSelectedMeal(null);
        setEditingMeal(null);
        setDraggedMeal(null);
        setDragOverDayId(null);
        setSelectedSwapMeal(null);
      } catch (error) {
        console.error("Failed to import meal plan:", error);
        alert("That file could not be imported. Please choose a valid meal plan JSON export.");
      } finally {
        event.target.value = "";
      }
   };

    reader.readAsText(file);
  }

  function exportMealPlan() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      appVersion: "2.0-structured-ingredients",
      schemaVersion: SCHEMA_VERSION,
      days,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const dateStamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");

    link.href = url;
    link.download = `kevin-meal-plan-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setDays(migrateDaysToIngredients(initialDays));
    setDraggedMeal(null);
    setDragOverDayId(null);
    setSelectedMeal(null);
    setSelectedSwapMeal(null);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="print:hidden">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-slate-800">Kevin’s Visual Meal Planner</h1>
              <p className="text-slate-600 mt-2 max-w-3xl">
                Drag meals between days, or enable swap mode to exchange meals by clicking two cards. Click a meal normally to view ingredient amounts.
              </p>
            </div>

            <div className="flex gap-3 items-center flex-wrap justify-end">
              <div className="bg-white rounded-2xl shadow px-5 py-3 border border-slate-200 text-right">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Weekly total</div>
                <div className="text-2xl font-bold text-slate-800">{weeklyCalories.toLocaleString()} cal</div>
              </div>

              <select
                value={proteinFilter}
                onChange={(event) => setProteinFilter(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 font-medium shadow-sm"
              >
                <option value="All">All Proteins</option>
                <option value="Chicken">Chicken</option>
                <option value="Fish">Fish</option>
                <option value="Ground Turkey">Ground Turkey</option>
                <option value="Red Meat">Red Meat</option>
              </select>

              <button
                onClick={() => setSwapMode((current) => !current)}
                className={`rounded-2xl px-5 py-3 font-semibold shadow border transition ${swapMode ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'}`}
              >
                {swapMode ? 'Swap mode ON' : 'Swap mode OFF'}
              </button>

              <button
                onClick={() => window.print()}
                className="rounded-2xl bg-white text-slate-800 px-5 py-3 font-semibold shadow border border-slate-300 hover:bg-slate-50 active:scale-95 transition"
              >
                Print prep sheet
              </button>

              <button
                onClick={exportMealPlan}
                className="rounded-2xl bg-white text-slate-800 px-5 py-3 font-semibold shadow border border-slate-300 hover:bg-slate-50 active:scale-95 transition"
              >
                Export JSON
              </button>

              <label className="rounded-2xl bg-white text-slate-800 px-5 py-3 font-semibold shadow border border-slate-300 hover:bg-slate-50 active:scale-95 transition cursor-pointer">
                Import JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={importMealPlan}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleSyncToCloud}
                disabled={syncBusy !== null}
                className="rounded-2xl bg-white text-slate-800 px-5 py-3 font-semibold shadow border border-slate-300 hover:bg-slate-50 active:scale-95 transition disabled:opacity-50"
              >
                {syncBusy === 'push' ? 'Syncing...' : 'Sync to Cloud'}
              </button>

              <button
                onClick={handleSyncFromCloud}
                disabled={syncBusy !== null}
                className="rounded-2xl bg-white text-slate-800 px-5 py-3 font-semibold shadow border border-slate-300 hover:bg-slate-50 active:scale-95 transition disabled:opacity-50"
              >
                {syncBusy === 'pull' ? 'Syncing...' : 'Sync from Cloud'}
              </button>

              <button
                onClick={handleNormalizeBoard}
                className="rounded-2xl bg-indigo-600 text-white px-5 py-3 font-semibold shadow hover:bg-indigo-500 active:scale-95 transition"
              >
                Normalize portions (beta)
              </button>

              <button
                onClick={handleReset}
                className="rounded-2xl bg-slate-800 text-white px-5 py-3 font-semibold shadow hover:bg-slate-700 active:scale-95 transition"
              >
                Reset board
              </button>
            </div>
          </div>

          {syncStatus && (
            <div
              className={`mb-6 -mt-2 text-sm rounded-2xl px-4 py-2 border ${
                syncStatus.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : syncStatus.type === 'info'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {syncStatus.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
            {filteredDays.map((day) => {
              const isCollapsed = collapsedDays.includes(day.id);
              const dailyCalories = day.meals.reduce((total, meal) => total + meal.calories, 0);
              const isDragOver = dragOverDayId === day.id;

              const dayMacros = day.meals.reduce(
                (totals, meal) => ({
                  carbs: totals.carbs + (meal.macros?.carbs || 0),
                  protein: totals.protein + (meal.macros?.protein || 0),
                  fat: totals.fat + (meal.macros?.fat || 0),
                }),
                { carbs: 0, protein: 0, fat: 0 }
              );

              const totalMacroGrams = dayMacros.carbs + dayMacros.protein + dayMacros.fat;

              const macroPercents = {
                carbs: totalMacroGrams ? Math.round((dayMacros.carbs / totalMacroGrams) * 100) : 0,
                protein: totalMacroGrams ? Math.round((dayMacros.protein / totalMacroGrams) * 100) : 0,
                fat: totalMacroGrams ? Math.round((dayMacros.fat / totalMacroGrams) * 100) : 0,
              };

              return (
                <div
                  key={day.id}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverDayId(day.id);
                  }}
                  onDragLeave={() => setDragOverDayId(null)}
                  onDrop={() => handleDrop(day.id)}
                  className={`bg-white rounded-3xl shadow-lg p-4 border-2 min-h-[720px] transition ${
                    isDragOver ? 'border-slate-500 bg-slate-50 scale-[1.01]' : 'border-slate-200'
                  }`}
                >
                  <div className="mb-4 sticky top-0 bg-white/95 backdrop-blur rounded-2xl pb-3 z-10">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">{day.day}</h2>
                        <p className="text-sm text-slate-500">{day.protein}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs bg-slate-200 px-3 py-1 rounded-full text-slate-700 font-semibold">
                          {dailyCalories} cal
                        </div>
                        <div className="text-[11px] text-slate-400">{day.meals.length} cards</div>

                        <button
                          onClick={() => toggleCollapsed(day.id)}
                          className="text-xs rounded-full bg-slate-200 hover:bg-slate-300 px-3 py-1 font-semibold text-slate-700 transition"
                        >
                          {isCollapsed ? 'Expand' : 'Collapse'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {!isCollapsed && (
                  <>
                  <div className="mb-4 bg-slate-50 rounded-2xl p-3 border border-slate-200">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                      Daily Macro Balance
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Carbs</span>
                          <span>{macroPercents.carbs}% • {dayMacros.carbs}g</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full transition-all"
                            style={{ width: `${macroPercents.carbs}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Protein</span>
                          <span>{macroPercents.protein}% • {dayMacros.protein}g</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-red-400 rounded-full transition-all"
                            style={{ width: `${macroPercents.protein}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Fat</span>
                          <span>{macroPercents.fat}% • {dayMacros.fat}g</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${macroPercents.fat}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-[10px] text-slate-400">
                      Target: {macroTargets.carbs}% carbs • {macroTargets.protein}% protein • {macroTargets.fat}% fat
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {day.meals.length === 0 && (
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center text-slate-400">
                        Drop meals here
                      </div>
                    )}

                    {day.meals.map((meal) => (
                      <div
                        key={meal.id}
                        draggable
                        onClick={() => handleMealClick(meal, day.id, day.day)}
                        onDragStart={() => handleDragStart(meal, day.id)}
                        onDragEnd={() => {
                          setDraggedMeal(null);
                          setDragOverDayId(null);
                        }}
                        className={`rounded-2xl border-2 p-3 transition shadow-sm hover:shadow-md ${swapMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} active:scale-[0.98] ${selectedSwapMeal?.meal.id === meal.id ? 'ring-4 ring-indigo-400 scale-[1.02]' : ''} ${colorMap[meal.type]}`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-bold">
                              {meal.type}
                            </div>
                            <h3 className="font-bold text-base leading-tight text-slate-800">
                              {meal.name}
                            </h3>
                          </div>
                          <div className="text-xs font-bold text-slate-700 whitespace-nowrap">
                            {meal.calories} cal
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {meal.items.map((item) => (
                            <span
                              key={`${meal.id}-${item}`}
                              className="bg-white/70 text-slate-700 text-[11px] px-2 py-1 rounded-full"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Auto Grocery Aggregation</h2>
              <p className="text-sm text-slate-500 mb-4">
                Built from the current board. Rearrange meals and this list follows the new weekly layout.
              </p>

              <div className="max-h-[520px] overflow-y-auto pr-2 space-y-3">
                {groceryList.map(({ ingredient, uses }) => (
                  <details key={ingredient} className="bg-slate-50 rounded-2xl border border-slate-200 p-3">
                    <summary className="cursor-pointer font-bold text-slate-800 capitalize flex justify-between gap-3">
                      <span>{ingredient}</span>
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        {uses.length} use{uses.length === 1 ? '' : 's'}
                      </span>
                    </summary>

                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {uses.map((use) => (
                        <li key={`${use.day}-${use.mealType}-${use.original}`} className="border-t border-slate-200 pt-2 first:border-t-0 first:pt-0">
                          <div className="font-semibold text-slate-700">{use.amount}</div>
                          <div className="text-xs text-slate-500">
                            {use.day} • {use.mealType} • {use.mealName}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Cronometer Helper</h2>
              <p className="text-sm text-slate-500 mb-4">
                Use this as a copy/paste checklist for entering foods manually. The calories and macros are planner estimates, not verified Cronometer values.
              </p>

              <button
                onClick={copyCronometerText}
                className="rounded-2xl bg-slate-800 text-white px-5 py-3 font-semibold shadow hover:bg-slate-700 active:scale-95 transition mb-4"
              >
                Copy Cronometer text
              </button>

              <textarea
                readOnly
                value={cronometerText}
                className="w-full h-[360px] rounded-2xl border border-slate-300 bg-slate-50 p-4 text-xs font-mono text-slate-700"
              />
            </div>

            <div className="bg-white rounded-3xl shadow-lg p-6 border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Quick Visual Rules</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-amber-100 rounded-2xl p-4 border border-amber-300">
                <div className="text-sm text-slate-500">Breakfast</div>
                <div className="font-bold text-slate-800">8:30 AM</div>
              </div>

              <div className="bg-sky-100 rounded-2xl p-4 border border-sky-300">
                <div className="text-sm text-slate-500">Lunch</div>
                <div className="font-bold text-slate-800">12–1 PM</div>
              </div>

              <div className="bg-green-100 rounded-2xl p-4 border border-green-300">
                <div className="text-sm text-slate-500">Snack</div>
                <div className="font-bold text-slate-800">3:30–4 PM</div>
              </div>

              <div className="bg-rose-100 rounded-2xl p-4 border border-rose-300">
                <div className="text-sm text-slate-500">Dinner</div>
                <div className="font-bold text-slate-800">Before 7 PM</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-medium">40% Carbs</div>
              <div className="px-4 py-2 rounded-full bg-red-100 text-red-800 font-medium">30% Protein</div>
              <div className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 font-medium">30% Fat</div>
              <div className="px-4 py-2 rounded-full bg-green-100 text-green-800 font-medium">25g Fiber Goal</div>
            </div>
            </div>
          </div>
      </div>
      <div className="hidden print:block bg-white text-slate-900 p-8">
        <div className="border-b border-slate-300 pb-4 mb-6">
          <h1 className="text-3xl font-bold">Sunday Meal-Prep Sheet</h1>
          <p className="text-sm text-slate-600 mt-1">Generated from the current meal board layout.</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-bold mb-3">Prep Priorities</h2>
            <ul className="space-y-2 text-sm">
              <li>☐ Cook or portion proteins for the week</li>
              <li>☐ Batch cook quinoa / brown rice as needed</li>
              <li>☐ Roast or prep sweet potatoes</li>
              <li>☐ Wash and portion produce</li>
              <li>☐ Portion snacks into grab-and-go servings</li>
              <li>☐ Confirm breakfast items are ready</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Weekly Targets</h2>
            <div className="text-sm space-y-1">
              <div>Total planned calories: {weeklyCalories.toLocaleString()}</div>
              <div>Macro target: 40% carbs • 30% protein • 30% fat</div>
              <div>Fiber target: 25g/day</div>
              <div>Meal rhythm: breakfast, lunch, snack, dinner</div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-3">Grocery / Prep Checklist</h2>
        <div className="grid grid-cols-2 gap-6">
          {Object.entries(prepGroups).map(([groupName, entries]) => (
            <div key={groupName} className="break-inside-avoid border border-slate-300 rounded-xl p-4">
              <h3 className="font-bold text-lg mb-3">{groupName}</h3>
              {entries.length === 0 ? (
                <div className="text-sm text-slate-500">No items</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {entries.map(({ ingredient, uses }) => (
                    <li key={ingredient}>
                      ☐ <span className="capitalize font-semibold">{ingredient}</span>
                      <span className="text-slate-500"> — {uses.length} use{uses.length === 1 ? '' : 's'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mt-8 mb-3">Day-by-Day Meal Check</h2>
        <div className="grid grid-cols-2 gap-4">
          {days.map((day) => (
            <div key={day.id} className="break-inside-avoid border border-slate-300 rounded-xl p-4">
              <h3 className="font-bold text-lg">{day.day} — {day.protein}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {day.meals.map((meal) => (
                  <li key={meal.id}>☐ {meal.type}: {meal.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {editingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
      
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Edit Meal
              </h2>
      
              <button
                onClick={() => setEditingMeal(null)}
                className="text-slate-500 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>
      
            <div className="space-y-4">
      
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Meal Name
                </label>
      
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => handleEditField("name", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </div>
      
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Calories
                  </label>
      
                  <input
                    type="number"
                    value={editForm.calories}
                    onChange={(e) =>
                      handleEditField("calories", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>
      
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Carbs
                  </label>
      
                  <input
                    type="number"
                    value={editForm.carbs}
                    onChange={(e) =>
                      handleEditField("carbs", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>
      
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Protein
                  </label>
      
                  <input
                    type="number"
                    value={editForm.protein}
                    onChange={(e) =>
                      handleEditField("protein", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>
      
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Fat
                  </label>
      
                  <input
                    type="number"
                    value={editForm.fat}
                    onChange={(e) =>
                      handleEditField("fat", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>
      
              </div>
      
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-600">Ingredients</label>
                  <button
                    type="button"
                    onClick={handleMatchAllRows}
                    className="text-xs rounded-lg bg-indigo-600 text-white px-3 py-1 font-semibold hover:bg-indigo-500"
                  >
                    Match all unresolved
                  </button>
                </div>

                <div className="space-y-2">
                  {editForm.ingredients.map((ingredient, index) => {
                    const confidence = CONFIDENCE_LABELS[ingredient.gramsConfidence] || CONFIDENCE_LABELS.unresolved;

                    return (
                      <div key={ingredient.id} className="rounded-xl border border-slate-300 p-2">
                        <div className="flex gap-2 items-start">
                          <input
                            type="number"
                            step="any"
                            value={ingredient.amount ?? ''}
                            onChange={(e) => updateIngredientRow(index, { amount: e.target.value === '' ? null : Number(e.target.value) })}
                            placeholder="amt"
                            className="w-16 rounded-lg border border-slate-300 p-2 text-sm"
                          />
                          <input
                            type="text"
                            value={ingredient.unit ?? ''}
                            onChange={(e) => updateIngredientRow(index, { unit: e.target.value || null })}
                            placeholder="unit"
                            className="w-20 rounded-lg border border-slate-300 p-2 text-sm"
                          />
                          <input
                            type="text"
                            value={ingredient.name}
                            onChange={(e) => updateIngredientRow(index, { name: e.target.value })}
                            placeholder="ingredient name"
                            className="flex-1 rounded-lg border border-slate-300 p-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeIngredientRow(index)}
                            className="text-slate-400 hover:text-red-600 px-2"
                            aria-label="Remove ingredient"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${confidence.className}`}>
                            {confidence.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {ingredient.grams != null ? `${Math.round(ingredient.grams)} g` : 'no grams yet'}
                          </span>
                          {ingredient.matchedFoodName && (
                            <span className="text-xs text-slate-400">· {ingredient.matchedFoodName}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleMatchRow(index)}
                            className="text-xs rounded-lg bg-white border border-slate-300 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Match
                          </button>
                          <label className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
                            <input
                              type="checkbox"
                              checked={ingredient.verified}
                              onChange={(e) => updateIngredientRow(index, { verified: e.target.checked })}
                            />
                            verified
                          </label>
                        </div>

                        {ingredient.prepNote && (
                          <div className="text-[11px] text-slate-400 mt-1">note: {ingredient.prepNote}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="mt-2 text-xs rounded-lg border border-dashed border-slate-300 px-3 py-2 text-slate-500 hover:bg-slate-50 w-full"
                >
                  + Add ingredient
                </button>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Or paste ingredients as text (one per line, replaces the list above)
                  </label>
                  <textarea
                    rows={3}
                    value={pastedIngredients}
                    onChange={(e) => setPastedIngredients(e.target.value)}
                    placeholder={"0.75 cup oats\n1 banana"}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={applyPastedIngredients}
                    className="mt-1 text-xs rounded-lg bg-slate-800 text-white px-3 py-1 font-semibold"
                  >
                    Replace ingredients from text
                  </button>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleRecomputeFromIngredients}
                    className="text-xs rounded-lg bg-white border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Recompute calories/macros from ingredients
                  </button>
                </div>

                {recomputePreview && (
                  <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs">
                    <div className="text-slate-600">
                      Stored: {editForm.calories} cal · C {editForm.carbs}g P {editForm.protein}g F {editForm.fat}g
                    </div>
                    <div className="text-slate-800 font-semibold mt-1">
                      Computed: {recomputePreview.calories} cal · C {recomputePreview.macros.carbs}g P{' '}
                      {recomputePreview.macros.protein}g F {recomputePreview.macros.fat}g
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={applyRecomputedTotals}
                        className="rounded-lg bg-indigo-600 text-white px-3 py-1 font-semibold hover:bg-indigo-500"
                      >
                        Apply to form
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecomputePreview(null)}
                        className="rounded-lg border border-slate-300 px-3 py-1 font-semibold text-slate-700"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Display Tags (one per line)
              </label>

              <textarea
                rows={4}
                value={editForm.items.join("\n")}
                onChange={(e) =>
                  handleEditField(
                    "items",
                    e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter((line) => line !== "")
                  )
                }
                className="w-full rounded-xl border border-slate-300 p-3"
              />

              <p className="text-xs text-slate-500 mt-1">
                These are the short labels shown on the meal card. They do not affect grocery aggregation.
              </p>
            </div>
      
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-bold text-slate-800 mb-2">Nutrition Lookup</h3>

              <p className="text-sm text-slate-500 mb-3">
                Search for a food, then manually copy values into the meal fields if they look useful.
                These results are estimates and may be per 100g.
              </p>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={nutritionQuery}
                  onChange={(e) => setNutritionQuery(e.target.value)}
                  placeholder="Search food, e.g. chicken breast or Dave's Killer Thin"
                  className="flex-1 rounded-xl border border-slate-300 p-3"
                />

                <button
                  type="button"
                  onClick={() => handleNutritionLookup("usda")}
                  className="rounded-xl bg-slate-800 text-white px-4 py-2 font-semibold"
                >
                  USDA
                </button>

                <button
                  type="button"
                  onClick={() => handleNutritionLookup("off")}
                  className="rounded-xl bg-white border border-slate-300 text-slate-800 px-4 py-2 font-semibold"
                >
                  Open Food Facts
                </button>

                <button
                  type="button"
                  onClick={handleAutoMatch}
                  className="rounded-xl bg-indigo-600 text-white px-4 py-2 font-semibold hover:bg-indigo-500"
                >
                  Auto-match & cache
                </button>
              </div>

              {autoMatchResult && <AutoMatchPreview result={autoMatchResult} />}

              {nutritionLookupStatus && (
                <div className="text-sm text-slate-500 mb-3">{nutritionLookupStatus}</div>
              )}

              {nutritionResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {nutritionResults.map((result) => (
                    <div
                      key={`${result.source}-${result.id}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="font-bold text-slate-800">{result.name}</div>
                      {result.brand && (
                        <div className="text-xs text-slate-500">{result.brand}</div>
                      )}

                      <div className="text-sm text-slate-600 mt-2">
                        {result.calories ?? "?"} kcal • C {result.carbs ?? "?"}g • P{" "}
                        {result.protein ?? "?"}g • F {result.fat ?? "?"}g
                        <span className="text-slate-400"> (per 100g)</span>
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        Source: {result.source}
                        {result.dataType && ` • ${result.dataType}`}
                        {result.servingSize && ` • serving: ${result.servingSize}`}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleResolvePortion(result)}
                        className="mt-2 text-xs rounded-lg bg-white border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Resolve portion for "{nutritionQuery || result.name}"
                      </button>

                      {portionResolutions[`${result.source}-${result.id}`] && (
                        <PortionResolutionPreview
                          resolution={portionResolutions[`${result.source}-${result.id}`]}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
      
              <button
                onClick={() => setEditingMeal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300"
              >
                Cancel
              </button>
      
              <button
                onClick={() => {
                  setDays((currentDays) =>
                    currentDays.map((day) => ({
                      ...day,
                      meals: day.meals.map((meal) => {
                        if (meal.id !== editingMeal.id) {
                          return meal;
                        }

                        return {
                          ...meal,
                          name: editForm.name,
                          calories: Number(editForm.calories),
                          macros: {
                            carbs: Number(editForm.carbs),
                            protein: Number(editForm.protein),
                            fat: Number(editForm.fat),
                          },
                          ingredients: editForm.ingredients.filter((ingredient) => ingredient.name.trim() !== ''),
                          items: editForm.items,
                        };
                      }),
                    }))
                  );

                  setEditingMeal(null);
                  setRecomputePreview(null);
                  setPastedIngredients('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white"
              >
                Save
              </button>
      
            </div>
      
          </div>
        </div>
      )}

      {normalizeState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Normalize portions</h2>
              <button
                onClick={() => setNormalizeState(null)}
                className="text-slate-500 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>

            {normalizeState.status === 'no-targets' && (
              <p className="text-sm text-slate-600">
                Every ingredient on the board already has a resolved match. Edit a meal and use "Match" again
                if you want to re-resolve a specific ingredient.
              </p>
            )}

            {normalizeState.status === 'running' && (
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  Matching ingredients against USDA / Open Food Facts... {normalizeState.current}/{normalizeState.total}
                </p>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-4">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.round((normalizeState.current / normalizeState.total) * 100)}%` }}
                  />
                </div>
                <button
                  onClick={cancelNormalizeBoard}
                  className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {normalizeState.status === 'review' && (
              <div>
                <p className="text-sm text-slate-600 mb-4">
                  {normalizeState.cancelled && 'Stopped early - '}
                  Ingredient grams/matches for the board have been saved. These are the fully-resolved meals where
                  computed calories differ from the stored value - nothing here has been applied to the visible
                  cards yet.
                </p>

                {normalizeState.skippedCount > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4">
                    {normalizeState.skippedCount} meal{normalizeState.skippedCount === 1 ? '' : 's'} skipped -
                    still {normalizeState.cancelled ? 'unmatched from the cancelled run' : 'have at least one unresolved ingredient'}.
                    Run Normalize again{normalizeState.cancelled ? '' : ', or resolve them from the meal edit modal,'} to include them here.
                  </p>
                )}

                {normalizeState.comparisons.length === 0 ? (
                  <p className="text-sm text-slate-500 mb-4">No meaningful differences found.</p>
                ) : (
                  <>
                    <button
                      onClick={applyAllNormalizeComparisons}
                      className="mb-3 rounded-xl bg-indigo-600 text-white px-4 py-2 font-semibold hover:bg-indigo-500"
                    >
                      Apply all to meal cards
                    </button>

                    <div className="space-y-2">
                      {normalizeState.comparisons.map((comparison) => (
                        <div key={comparison.mealId} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-800">{comparison.mealName}</div>
                              <div className="text-xs text-slate-500">{comparison.dayName} • {comparison.mealType}</div>
                            </div>
                            <div className={`text-sm font-semibold ${comparison.delta > 0 ? 'text-amber-600' : 'text-sky-600'}`}>
                              {comparison.delta > 0 ? '+' : ''}{comparison.delta} cal
                            </div>
                          </div>

                          <div className="text-xs text-slate-500 mt-2">
                            Stored: {comparison.stored.calories} cal · C {comparison.stored.macros.carbs}g P{' '}
                            {comparison.stored.macros.protein}g F {comparison.stored.macros.fat}g
                          </div>
                          <div className="text-xs text-slate-700 font-semibold mt-1">
                            Computed: {comparison.computed.calories} cal · C {comparison.computed.macros.carbs}g P{' '}
                            {comparison.computed.macros.protein}g F {comparison.computed.macros.fat}g
                          </div>

                          <button
                            onClick={() => applyNormalizeComparison(comparison)}
                            className="mt-2 text-xs rounded-lg bg-white border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Apply this meal
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {pullPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Pull from cloud?</h2>

            <p className="text-sm text-slate-600 mb-4">
              This will replace your current board with the cloud copy. Nothing has been changed yet.
            </p>

            <div className="space-y-2 text-sm mb-6">
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Cloud copy</div>
                <div className="text-slate-800">
                  {pullPreview.cloudUpdatedAt ? new Date(pullPreview.cloudUpdatedAt).toLocaleString() : 'Unknown'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Your local copy</div>
                <div className="text-slate-800">
                  {pullPreview.localUpdatedAt ? new Date(pullPreview.localUpdatedAt).toLocaleString() : 'Unknown'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPullPreview(null)}
                className="px-4 py-2 rounded-xl border border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmPullFromCloud}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
              >
                Replace board with cloud copy
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMeal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelectedMeal(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 font-bold">
                  {selectedMeal.day} • {selectedMeal.type}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">{selectedMeal.name}</h2>
                <div className="text-sm text-slate-500 mt-1">{selectedMeal.calories} calories</div>
              </div>

              <button
                onClick={() => setSelectedMeal(null)}
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 w-9 h-9 font-bold"
                aria-label="Close meal details"
              >
                ×
              </button>
            </div>

            <div className={`rounded-2xl border-2 p-4 ${colorMap[selectedMeal.type]}`}>
              <h3 className="font-bold text-slate-800 mb-3">Ingredient amounts</h3>
              <ul className="space-y-2">
                {selectedMeal.ingredients.map((ingredient) => (
                  <li key={ingredient.id} className="flex items-start gap-2 text-slate-700">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-slate-600 shrink-0" />
                    <span>{ingredient.raw}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  setEditingMeal(selectedMeal);

                  setEditForm({
                    name: selectedMeal.name,
                    calories: selectedMeal.calories,
                    carbs: selectedMeal.macros.carbs,
                    protein: selectedMeal.macros.protein,
                    fat: selectedMeal.macros.fat,
                    ingredients: selectedMeal.ingredients.map((ingredient) => ({ ...ingredient })),
                    items: [...selectedMeal.items],
                  });

                  setRecomputePreview(null);
                  setPastedIngredients('');
                  setSelectedMeal(null);
                }}
                className="rounded-2xl bg-slate-800 text-white px-4 py-2 font-semibold shadow hover:bg-slate-700 transition"
              >
                Edit meal
              </button>
            </div>

            <div className="mt-5 text-sm text-slate-500">
              Tip: click outside this card or press the × to close it.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
