import { describe, expect, it } from 'vitest';
import { getMealSortValue, moveMealToDay, MEAL_ORDER } from './boardOperations';

/*
 * The first three cases here are a regression test for a real data-loss bug:
 * dropping a meal back on the day it already belonged to deleted it. See
 * docs/BACKLOG.md (Shipped) for why the guard has to sit before the map.
 *
 * Deliberately no component rendering. These are pure board transforms, so
 * testing them needs no DOM, no jsdom, and no drag simulation - which is the
 * whole reason they were extracted out of App.jsx.
 */

const board = () => [
  {
    id: 'mon',
    meals: [
      { id: 'm1', name: 'Oatmeal', type: 'Breakfast' },
      { id: 'm2', name: 'Salad', type: 'Lunch' },
    ],
  },
  { id: 'tue', meals: [{ id: 'm3', name: 'Cod', type: 'Dinner' }] },
];

const mealCount = (days) => days.reduce((n, day) => n + day.meals.length, 0);
const namesOn = (days, id) => days.find((d) => d.id === id).meals.map((m) => m.name);

const dragOatmeal = {
  meal: { id: 'm1', name: 'Oatmeal', type: 'Breakfast' },
  sourceDayId: 'mon',
};

describe('moveMealToDay', () => {
  it('keeps the meal when dropped back on its own day', () => {
    const after = moveMealToDay(board(), dragOatmeal, 'mon');

    expect(mealCount(after)).toBe(3);
    expect(namesOn(after, 'mon')).toEqual(['Oatmeal', 'Salad']);
  });

  it('returns the identical board reference for a same-day drop', () => {
    // Not just equal - the same object, so React skips a pointless re-render.
    const before = board();
    expect(moveMealToDay(before, dragOatmeal, 'mon')).toBe(before);
  });

  it('never loses a meal, whichever day it is dropped on', () => {
    for (const target of ['mon', 'tue']) {
      expect(mealCount(moveMealToDay(board(), dragOatmeal, target))).toBe(3);
    }
  });

  it('moves the meal across days, emptying source and filling target', () => {
    const after = moveMealToDay(board(), dragOatmeal, 'tue');

    expect(namesOn(after, 'mon')).toEqual(['Salad']);
    expect(namesOn(after, 'tue')).toContain('Oatmeal');
    expect(mealCount(after)).toBe(3);
  });

  it('sorts the target day into meal order rather than appending', () => {
    // Oatmeal is Breakfast and must land before Cod (Dinner), not after it.
    const after = moveMealToDay(board(), dragOatmeal, 'tue');
    expect(namesOn(after, 'tue')).toEqual(['Oatmeal', 'Cod']);
  });

  it('does not mutate the board it was given', () => {
    const before = board();
    const snapshot = JSON.stringify(before);

    moveMealToDay(before, dragOatmeal, 'tue');

    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('does not mutate the target day when the meal id is already present', () => {
    // Guards the `.sort()` trap: when `alreadyExists` is true the array under
    // sort used to BE day.meals, so sorting it in place mutated live state.
    const withDupe = [
      { id: 'mon', meals: [{ id: 'm1', name: 'Oatmeal', type: 'Breakfast' }] },
      {
        id: 'tue',
        meals: [
          { id: 'm3', name: 'Cod', type: 'Dinner' },
          { id: 'm1', name: 'Oatmeal', type: 'Breakfast' },
        ],
      },
    ];
    const tueMealsBefore = withDupe[1].meals;
    const orderBefore = tueMealsBefore.map((m) => m.name);

    moveMealToDay(withDupe, dragOatmeal, 'tue');

    expect(tueMealsBefore.map((m) => m.name)).toEqual(orderBefore);
  });

  it('is a no-op with no dragged meal', () => {
    const before = board();
    expect(moveMealToDay(before, null, 'tue')).toBe(before);
  });
});

describe('getMealSortValue', () => {
  it('orders the four meal types as the board displays them', () => {
    const sorted = [
      { type: 'Dinner' },
      { type: 'Breakfast' },
      { type: 'Snack' },
      { type: 'Lunch' },
    ].sort((a, b) => getMealSortValue(a) - getMealSortValue(b));

    expect(sorted.map((m) => m.type)).toEqual(MEAL_ORDER);
  });
});
