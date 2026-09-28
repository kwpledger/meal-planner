import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./nutritionApi', () => ({
  searchUsdaFoods: vi.fn(),
  getUsdaFoodDetail: vi.fn(),
  searchOpenFoodFacts: vi.fn(),
}));

const { searchUsdaFoods, getUsdaFoodDetail, searchOpenFoodFacts } = await import('./nutritionApi');
const { matchIngredient } = await import('./ingredientLibrary');

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
