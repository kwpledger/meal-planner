import { useEffect, useMemo, useState } from 'react';

const initialDays = [
  {
    id: 'day-1',
    day: 'Day 1',
    protein: 'Chicken',
    meals: [
      { id: 'd1-breakfast', type: 'Breakfast', name: 'Oatmeal Power Bowl', calories: 610, macros: { carbs: 78, protein: 22, fat: 22 }, details: ['¾ cup oats cooked in 1 cup 2% milk', '1 banana', '1 Tbsp chia', '1 Tbsp peanut butter'], items: ['Oats + milk', 'Banana', 'Chia', 'Peanut butter'] },
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
      { id: 'd2-breakfast', type: 'Breakfast', name: 'Coconut Yogurt Bowl', calories: 520, macros: { carbs: 60, protein: 8, fat: 24 }, details: ['1 cup coconut yogurt', '½ cup granola', '½ cup strawberries', '1 Tbsp chia'], items: ['Coconut yogurt', 'Granola', 'Strawberries', 'Chia'] },
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
      { id: 'd4-breakfast', type: 'Breakfast', name: 'Oatmeal Bowl', calories: 520, macros: { carbs: 65, protein: 18, fat: 14 }, details: ['¾ cup oats', '1 cup 2% milk', '1 Tbsp chia', '½ cup strawberries'], items: ['Oats', 'Milk', 'Chia', 'Strawberries'] },
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
      { id: 'd5-breakfast', type: 'Breakfast', name: 'Coconut Yogurt Bowl', calories: 480, macros: { carbs: 55, protein: 7, fat: 20 }, details: ['1 cup coconut yogurt', '½ cup granola', '½ cup strawberries'], items: ['Coconut yogurt', 'Granola', 'Strawberries'] },
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
      { id: 'd7-breakfast', type: 'Breakfast', name: 'Oatmeal Bowl', calories: 520, macros: { carbs: 65, protein: 18, fat: 14 }, details: ['¾ cup oats', '1 cup 2% milk', '1 Tbsp chia', '½ cup strawberries'], items: ['Oats', 'Milk', 'Chia', 'Strawberries'] },
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

function getMealSortValue(meal) {
  return mealOrder.indexOf(meal.type);
}

function parseIngredient(detail) {
  const units = ['cup', 'cups', 'tbsp', 'tsp', 'oz', 'slice', 'slices', 'large'];
  const parts = detail.split(' ');

  if (parts.length < 2) {
    return { ingredient: detail.toLowerCase(), amount: detail };
  }

  const first = parts[0];
  const second = parts[1]?.toLowerCase();
  const hasUnit = units.includes(second);
  const startsWithAmount = !Number.isNaN(Number(first)) || ['¼', '½', '¾'].includes(first) || first.includes('/');

  if (startsWithAmount && hasUnit) {
    return {
      amount: `${first} ${parts[1]}`,
      ingredient: parts.slice(2).join(' ').toLowerCase(),
    };
  }

  if (startsWithAmount) {
    return {
      amount: first,
      ingredient: parts.slice(1).join(' ').toLowerCase(),
    };
  }

  return { ingredient: detail.toLowerCase(), amount: detail };
}

const STORAGE_KEY = 'kevin-meal-planner-state-v2';

export default function MealPlanBoard() {
  const [days, setDays] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load saved meal plan:', error);
      }
    }

    return initialDays;
  });
  const [draggedMeal, setDraggedMeal] = useState(null);
  const [dragOverDayId, setDragOverDayId] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [collapsedDays, setCollapsedDays] = useState([]);
  const [proteinFilter, setProteinFilter] = useState('All');
  const [swapMode, setSwapMode] = useState(false);
  const [selectedSwapMeal, setSelectedSwapMeal] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
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
        meal.details.forEach((detail) => {
          const parsed = parseIngredient(detail);
          const existingUses = groceryMap.get(parsed.ingredient) || [];

          groceryMap.set(parsed.ingredient, [
            ...existingUses,
            {
              day: day.day,
              mealType: meal.type,
              mealName: meal.name,
              amount: parsed.amount,
              original: detail,
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
          const ingredients = meal.details
            .map((detail) => `    - ${detail}`)
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

  function toggleCollapsed(dayId) {
    setCollapsedDays((current) => {
      if (current.includes(dayId)) {
        return current.filter((id) => id !== dayId);
      }

      return [...current, dayId];
    });
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    setDays(initialDays);
    setDraggedMeal(null);
    setDragOverDayId(null);
    setSelectedMeal(null);
    setSelectedSwapMeal(null);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      <div className="w-full overflow-x-auto print:hidden">
        <div className="min-w-[1750px]">
          <div className="mb-6 flex items-start justify-between gap-6">
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
                onClick={handleReset}
                className="rounded-2xl bg-slate-800 text-white px-5 py-3 font-semibold shadow hover:bg-slate-700 active:scale-95 transition"
              >
                Reset board
              </button>
            </div>
          </div>

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

            <div className="grid grid-cols-4 gap-4">
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
                {selectedMeal.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2 text-slate-700">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-slate-600 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
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
