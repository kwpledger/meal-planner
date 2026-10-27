import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./nutritionApi', () => ({
  searchUsdaFoods: vi.fn(),
  getUsdaFoodDetail: vi.fn(),
  searchOpenFoodFacts: vi.fn(),
}));

const { searchUsdaFoods, getUsdaFoodDetail, searchOpenFoodFacts } = await import('./nutritionApi');
const { matchIngredient, fiberPer100g } = await import('./ingredientLibrary');

const emptyLibrary = () => ({ version: 1, entries: {} });

// The real OFF answer for "banana" with USDA unavailable (HISTORY item 4).
const bananaChips = {
  code: '0001',
  product_name: 'Banana chips',
  nutriments: { 'energy-kcal_100g': 519, proteins_100g: 2.3, carbohydrates_100g: 58, fat_100g: 34 },
};

const bananaRaw = {
  fdcId: 1105314,
  description: 'Bananas, raw',
  dataType: 'SR Legacy',
  foodNutrients: [{ nutrientName: 'Energy', unitName: 'KCAL', value: 89 }],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  searchOpenFoodFacts.mockResolvedValue({ products: [bananaChips] });
});

describe('matchIngredient: Open Food Facts fallback', () => {
  it('refuses OFF when USDA errored, and reports the USDA failure', async () => {
    searchUsdaFoods.mockRejectedValue(new Error('Missing USDA API key.'));

    const result = await matchIngredient('1 medium banana', emptyLibrary());

    expect(result.entry).toBeNull();
    expect(result.failure).toMatch(/USDA lookup failed: Missing USDA API key/);
    expect(searchOpenFoodFacts).not.toHaveBeenCalled();
  });

  it('refuses OFF when USDA knew the food but every detail fetch failed', async () => {
    searchUsdaFoods.mockResolvedValue({ foods: [bananaRaw] });
    getUsdaFoodDetail.mockRejectedValue(new Error('404'));

    const result = await matchIngredient('1 medium banana', emptyLibrary());

    expect(result.entry).toBeNull();
    expect(result.failure).toMatch(/USDA found "medium banana" but its details could not be fetched/);
    expect(searchOpenFoodFacts).not.toHaveBeenCalled();
  });

  it('still uses OFF when USDA answered with nothing (a branded name)', async () => {
    searchUsdaFoods.mockResolvedValue({ foods: [] });
    searchOpenFoodFacts.mockResolvedValue({
      products: [{ code: '0002', product_name: "Dave's Killer Thin", nutriments: { 'energy-kcal_100g': 250 } }],
    });

    const result = await matchIngredient("1 slice Dave's Killer Thin", emptyLibrary());

    expect(result.entry?.source).toBe('off');
    expect(result.entry?.matchedFoodName).toBe("Dave's Killer Thin");
  });

  it('prefers USDA when it resolves, without asking OFF', async () => {
    searchUsdaFoods.mockResolvedValue({ foods: [bananaRaw] });
    getUsdaFoodDetail.mockResolvedValue({ foodPortions: [] });

    const result = await matchIngredient('1 medium banana', emptyLibrary());

    expect(result.entry?.source).toBe('usda');
    expect(searchOpenFoodFacts).not.toHaveBeenCalled();
  });
});

/*
 * Fiber shapes from live USDA records on the real board (2026-10-27). Search
 * results use { nutrientId, value }; the /food/{id} detail uses
 * { nutrient: { id }, amount }.
 */
describe('fiberPer100g', () => {
  it('reads nutrient 1079 from a search result', () => {
    expect(fiberPer100g([{ nutrientId: 1079, value: 2.4 }], 6.27)).toBe(2.4);
  });

  it('reads nutrient 1079 from a detail record', () => {
    expect(fiberPer100g([{ nutrient: { id: 1079 }, amount: 7 }], 64.16)).toBe(7);
  });

  it('prefers 1079 over the AOAC 2011.25 total when both exist', () => {
    // Foundation "Rice, brown, long grain, unenriched, raw".
    expect(fiberPer100g([{ nutrient: { id: 2033 }, amount: 4.296 }, { nutrient: { id: 1079 }, amount: 3.021 }], 76.69)).toBe(3.021);
  });

  it('infers 0 when the record has no fiber but reports 0 g carbohydrate', () => {
    // Foundation "Chicken, breast, boneless, skinless, raw" (fdcId 2646170).
    expect(fiberPer100g([{ nutrient: { id: 1005 }, amount: 0 }], 0)).toBe(0);
  });

  it('returns null, not 0, when fiber is absent and carbohydrate is not zero', () => {
    // Branded "STRAWBERRIES" (fdcId 2377355): 9.29 g carbs, no fiber entry.
    expect(fiberPer100g([{ nutrient: { id: 1005 }, amount: 9.29 }], 9.29)).toBeNull();
  });
});

describe('matchIngredient: cache entries saved before fiber', () => {
  it('fetches again instead of serving an entry with no fiber key', async () => {
    const library = { version: 1, entries: { banana: { source: 'usda', nutrientsPer100g: { calories: 89 } } } };
    searchUsdaFoods.mockResolvedValue({ foods: [{ ...bananaRaw, foodNutrients: [...bananaRaw.foodNutrients, { nutrientId: 1079, value: 2.6 }] }] });
    getUsdaFoodDetail.mockResolvedValue({ foodPortions: [] });

    const result = await matchIngredient('1 banana', library);

    expect(result.fromCache).toBe(false);
    expect(result.entry.nutrientsPer100g.fiber).toBe(2.6);
  });

  it('still serves a cached entry whose fiber is a known null', async () => {
    const library = { version: 1, entries: { banana: { source: 'usda', nutrientsPer100g: { calories: 89, fiber: null } } } };

    const result = await matchIngredient('1 banana', library);

    expect(result.fromCache).toBe(true);
    expect(searchUsdaFoods).not.toHaveBeenCalled();
  });
});
