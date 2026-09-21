/*
 * Pure transforms over the `days` board array.
 *
 * Extracted from App.jsx so they can be tested without rendering a 2,400-line
 * component: the board logic is not UI rendering, which is where the
 * convention in AGENTS.md says it belongs. Every function here takes a board
 * and returns a new one, and must not mutate its input - `setDays` relies on
 * getting a fresh array, and a mutated one can leave React showing stale state.
 */

export const MEAL_ORDER = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

export function getMealSortValue(meal) {
  return MEAL_ORDER.indexOf(meal.type);
}

const byMealOrder = (a, b) => getMealSortValue(a) - getMealSortValue(b);

/**
 * Move a dragged meal onto `targetDayId`, returning a new board.
 *
 * Returns the board unchanged when there is nothing to do, which includes the
 * case that used to destroy data: **dropping a meal back on the day it already
 * belongs to.**
 *
 * That guard has to live here, before the map, and the reason is not obvious.
 * The map's two branches are mutually exclusive per day - the source branch
 * filters the meal out and returns, so the target branch, which is the only
 * thing that adds it back, never runs when the two ids are equal. The meal was
 * removed and never restored. An `alreadyExists` check sat inside that target
 * branch, clearly written for this exact case, in the one place it could never
 * fire.
 */
export function moveMealToDay(days, draggedMeal, targetDayId) {
  if (!draggedMeal) return days;
  if (draggedMeal.sourceDayId === targetDayId) return days;

  const movingMeal = draggedMeal.meal;

  return days.map((day) => {
    if (day.id === draggedMeal.sourceDayId) {
      return { ...day, meals: day.meals.filter((meal) => meal.id !== movingMeal.id) };
    }

    if (day.id === targetDayId) {
      // Defensive against a board carrying one meal id twice. This is NOT what
      // protects the same-day case - the guard above is.
      const alreadyExists = day.meals.some((meal) => meal.id === movingMeal.id);
      const updatedMeals = alreadyExists ? day.meals : [...day.meals, movingMeal];

      // Copy before sorting. `.sort()` mutates, and when `alreadyExists` is
      // true `updatedMeals` IS `day.meals` - sorting it in place would mutate
      // the board React is currently rendering.
      return { ...day, meals: [...updatedMeals].sort(byMealOrder) };
    }

    return day;
  });
}
