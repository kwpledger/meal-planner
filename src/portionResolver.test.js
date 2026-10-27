import { describe, expect, it } from 'vitest';
import { recomputeMealFromIngredients, mergeComputedMacros } from './portionResolver';

/*
 * Fiber. Every meal on the real board had already lost the dietician's fiber
 * (cloud copy, checked 2026-10-27): computed macros carried no fiber, and the
 * apply paths replaced macros wholesale. These pin both halves of the fix.
 */

const ing = (name, grams, per100g) => ({ name, grams, gramsConfidence: 'exact-weight', nutrientsPer100g: per100g });

// Per-100g figures from the board's real USDA matches.
const broccoli = { calories: 31, carbs: 6.27, protein: 2.57, fat: 0.34, fiber: 2.4 };
const quinoaDry = { calories: 368, carbs: 64.16, protein: 14.12, fat: 6.07, fiber: 7 };
const chicken = { calories: 120, carbs: 0, protein: 22.5, fat: 2.62, fiber: 0 };
const strawberriesNoFiber = { calories: 32, carbs: 9.29, protein: 0.7, fat: 0, fiber: null };
const matchedBeforeFiber = { calories: 31, carbs: 6.27, protein: 2.57, fat: 0.34 };

describe('recomputeMealFromIngredients: fiber', () => {
  it('sums fiber across ingredients and rounds the meal total, not each line', () => {
    // 30 g broccoli is 0.72 g, which rounds to 0 per line; three of them total
    // 2.16 g, which rounds to 2.
    const meal = { ingredients: [ing('broccoli', 30, broccoli), ing('broccoli', 30, broccoli), ing('broccoli', 30, broccoli)] };

    expect(recomputeMealFromIngredients(meal).macros.fiber).toBe(2);
  });

  it('counts a real zero as zero', () => {
    const meal = { ingredients: [ing('chicken', 142, chicken), ing('quinoa', 128, quinoaDry)] };

    expect(recomputeMealFromIngredients(meal).macros.fiber).toBe(9);
  });

  it('reports fiber unknown, not a partial sum, when one ingredient has no figure', () => {
    const meal = { ingredients: [ing('quinoa', 128, quinoaDry), ing('strawberries', 150, strawberriesNoFiber)] };
    const result = recomputeMealFromIngredients(meal);

    expect(result.macros.fiber).toBeNull();
    expect(result.fiberUnknown).toEqual(['strawberries']);
  });

  it('treats a match saved before fiber existed as unknown, never 0', () => {
    const meal = { ingredients: [ing('broccoli', 91, matchedBeforeFiber)] };

    expect(recomputeMealFromIngredients(meal).macros.fiber).toBeNull();
  });
});

describe('mergeComputedMacros', () => {
  it('writes computed fiber', () => {
    expect(mergeComputedMacros({ carbs: 1, protein: 1, fat: 1, fiber: 6 }, { carbs: 2, protein: 3, fat: 4, fiber: 9 }))
      .toEqual({ carbs: 2, protein: 3, fat: 4, fiber: 9 });
  });

  it('keeps the stored fiber when the computed one is unknown', () => {
    expect(mergeComputedMacros({ carbs: 1, protein: 1, fat: 1, fiber: 6 }, { carbs: 2, protein: 3, fat: 4, fiber: null }))
      .toEqual({ carbs: 2, protein: 3, fat: 4, fiber: 6 });
  });
});
