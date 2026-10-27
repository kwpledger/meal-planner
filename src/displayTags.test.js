import { describe, expect, it } from 'vitest';
import { syncDisplayTags, tagForIngredientName } from './displayTags';

/*
 * Day 1 lunch as it is on the real board. The first case is the bug Kevin hit:
 * renaming broccoli to cauliflower left the "Broccoli" chip on the card.
 */

const ing = (id, name) => ({ id, name });

const lunch = () => ({
  ingredients: [
    ing('a', 'boneless skinless chicken breast'),
    ing('b', 'quinoa, dry'),
    ing('c', 'broccoli'),
    ing('d', 'olive oil'),
  ],
  items: ['Boneless, Skinless Chicken Breast', 'Quinoa', 'Broccoli', 'Olive Oil'],
});

describe('syncDisplayTags', () => {
  it('replaces the tag of a renamed ingredient and keeps the hand-written rest', () => {
    const meal = lunch();
    const edited = meal.ingredients.map((i) => (i.id === 'c' ? { ...i, name: 'Cauliflower' } : i));

    expect(syncDisplayTags(meal, edited)).toEqual(['Boneless, Skinless Chicken Breast', 'Quinoa', 'Cauliflower', 'Olive Oil']);
  });

  it('repairs a tag that was already stale when the editor opened', () => {
    const meal = lunch();
    meal.ingredients[2] = ing('c', 'Cauliflower');

    expect(syncDisplayTags(meal, meal.ingredients)[2]).toBe('Cauliflower');
  });

  it('adds a tag for a new ingredient and drops the tag of a removed one', () => {
    const meal = lunch();
    const edited = [...meal.ingredients.filter((i) => i.id !== 'd'), ing('new', 'lemon juice')];

    expect(syncDisplayTags(meal, edited)).toEqual(['Boneless, Skinless Chicken Breast', 'Quinoa', 'Broccoli', 'Lemon Juice']);
  });

  it('follows an ingredient by id when the order changes', () => {
    const meal = lunch();

    expect(syncDisplayTags(meal, [...meal.ingredients].reverse())).toEqual(['Olive Oil', 'Broccoli', 'Quinoa', 'Boneless, Skinless Chicken Breast']);
  });

  it('treats a plural tag as the same food', () => {
    const meal = { ingredients: [ing('a', 'banana, raw')], items: ['Bananas'] };

    expect(syncDisplayTags(meal, meal.ingredients)).toEqual(['Bananas']);
  });

  it('matches by word when the original lists were not one-to-one', () => {
    const meal = { ingredients: [ing('a', 'eggs'), ing('b', 'strawberries')], items: ['Strawberries'] };

    expect(syncDisplayTags(meal, meal.ingredients)).toEqual(['Eggs', 'Strawberries']);
  });
});

describe('tagForIngredientName', () => {
  it('drops the USDA qualifier and title-cases', () => {
    expect(tagForIngredientName('salmon fillet, raw')).toBe('Salmon Fillet');
    expect(tagForIngredientName("dave's killer thin")).toBe("Dave's Killer Thin");
    expect(tagForIngredientName('2% milk')).toBe('2% Milk');
  });
});
