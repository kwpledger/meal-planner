/*
 * A meal's display tags (`meal.items`, the card chips) and its ingredients were
 * two hand-maintained lists with no link, so renaming broccoli to cauliflower
 * left a "Broccoli" chip standing. Tags are now derived from the ingredients
 * at save time, but only where they have to be: a tag is meant to be its
 * ingredient minus the amount, yet Kevin's 2026-08-09 naming pass deliberately
 * pluralised some ("Navel Oranges" for "1 navel orange") and added the comma in
 * "Boneless, Skinless Chicken Breast". Regenerating every tag would undo that,
 * so an unchanged ingredient keeps its tag.
 *
 * The link is positional. Every meal on the real board had exactly one tag per
 * ingredient, in the same order (checked against the cloud copy, 2026-10-27),
 * so index i of the original lists pairs tag i with ingredient i, and the
 * ingredient's id carries that pairing through edits and reorders.
 */

// "salmon fillet, raw" -> "Salmon Fillet". The text after the first comma is a
// USDA qualifier (raw, dry, uncooked) that helps matching and is noise on a chip.
export function tagForIngredientName(name) {
  const base = String(name || '').split(',')[0].trim();
  return base.replace(/(^|\s)(\S)/g, (_, space, letter) => space + letter.toUpperCase());
}

// "Bananas" and "banana, raw" have to count as the same food, so compare
// lowercased words with a trailing plural s/es stripped.
function wordsOf(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .split(/[^a-z0-9%']+/)
      .filter(Boolean)
      .map((word) => word.replace(/(es|s)$/, ''))
  );
}

function sharesAWord(tag, name) {
  const nameWords = wordsOf(name);
  return [...wordsOf(tag)].some((word) => nameWords.has(word));
}

/*
 * originalMeal is the meal as stored when the editor opened ({ ingredients,
 * items }); ingredients is the edited list about to be saved. Returns one tag
 * per ingredient.
 *
 * An ingredient keeps its old tag only if its name is unchanged AND the tag
 * still shares a word with it. The second check repairs drift that predates
 * this module - a meal already saved as cauliflower under a "Broccoli" chip -
 * the next time that meal is saved.
 */
export function syncDisplayTags(originalMeal, ingredients) {
  const originalIngredients = originalMeal?.ingredients || [];
  const originalTags = originalMeal?.items || [];
  const paired = originalIngredients.length === originalTags.length;
  const originalById = new Map(originalIngredients.map((ingredient, index) => [ingredient.id, { ingredient, index }]));
  const unusedTags = new Set(originalTags.map((_, index) => index));

  return ingredients.map((ingredient) => {
    const original = originalById.get(ingredient.id);
    const unchanged = original && original.ingredient.name.trim().toLowerCase() === ingredient.name.trim().toLowerCase();

    if (unchanged) {
      // Unpaired lists (lengths differ) have no reliable index, so fall back
      // to the first unused tag that names the same food.
      const tagIndex = paired
        ? original.index
        : [...unusedTags].find((index) => sharesAWord(originalTags[index], ingredient.name));

      if (tagIndex !== undefined && unusedTags.has(tagIndex) && sharesAWord(originalTags[tagIndex], ingredient.name)) {
        unusedTags.delete(tagIndex);
        return originalTags[tagIndex];
      }
    }

    return tagForIngredientName(ingredient.name);
  });
}
