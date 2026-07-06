import { searchUsdaFoods, searchOpenFoodFacts, getUsdaFoodDetail } from './nutritionApi';
import { parseIngredientLine, normalizeIngredientName } from './ingredientParser';

const LIBRARY_KEY = 'kevin-meal-planner-ingredient-library-v1';

// Generic ingredient names (chicken, oats, banana) match much better against
// USDA's reference data types than "Branded" entries, which are specific
// packaged products with usually-empty foodPortions - confirmed live against
// the API in Step 2 (searching "chicken breast" returned only zero-portion
// Branded rows). Branded/Open Food Facts remain the fallback path for
// actually-branded ingredients like "Dave's Killer Thin".

// Picking "first result of the most-preferred dataType" isn't enough on its
// own - confirmed live that searching "oats" ranks "Oil, oat" (SR Legacy)
// ahead of "Oats, raw" (Survey/FNDDS) by USDA's own relevance order, so a
// pure dataType-first pick grabs the wrong food. Score textual relevance
// first, and only use dataType to decide whether Branded results should be
// considered at all.
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[(),]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scoreTextRelevance(description, searchName) {
  const desc = description.toLowerCase();
  const name = searchName.toLowerCase();

  if (desc === name) return 100;
  if (desc.startsWith(`${name},`) || desc.startsWith(`${name} `)) return 80;
  if (desc.startsWith(name)) return 60;

  const nameWords = tokenize(name);
  const descWords = tokenize(desc);

  if (nameWords.length > 1) {
    const matchedWords = nameWords.filter((word) => descWords.includes(word));

    if (matchedWords.length === nameWords.length) {
      // Pure prefix matching misses cases where USDA reorders into a
      // "Noun, modifier" convention - confirmed live that "coconut yogurt"
      // only turns up "Yogurt, coconut milk" this way, which a
      // prefix-only check would score 0. Reward every search word
      // appearing somewhere, and prefer the description with the fewest
      // extra/unrelated words among ties (so "Milk, reduced fat (2%)"
      // outranks "Egg custards, dry mix, prepared with 2% milk" for a
      // search of "2% milk" - both contain the words, but one is mostly
      // about something else).
      const extraWords = Math.max(descWords.length - nameWords.length, 0);
      return 50 - Math.min(extraWords, 9);
    }
  }

  const firstWord = nameWords[0];
  if (firstWord && (desc.startsWith(`${firstWord},`) || desc.startsWith(`${firstWord} `))) return 40;
  if (desc.includes(name)) return 20;

  return 0;
}

export function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) {
      return { version: 1, entries: {} };
    }

    const parsed = JSON.parse(raw);
    return parsed && parsed.entries ? parsed : { version: 1, entries: {} };
  } catch (error) {
    console.error('Failed to load ingredient library:', error);
    return { version: 1, entries: {} };
  }
}

export function saveLibrary(library) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function getCachedMatch(library, normalizedName) {
  return library.entries[normalizedName] || null;
}

export function setCachedMatch(library, normalizedName, entry) {
  const next = { ...library, entries: { ...library.entries, [normalizedName]: entry } };
  saveLibrary(next);
  return next;
}

// USDA records commonly carry TWO "Energy" entries - one in kJ, one in
// KCAL (confirmed live: "Broccoli, raw" reports Energy=132 kJ AND
// Energy=31 KCAL as separate array entries with no guaranteed order).
// A plain nutrientName match can silently grab the kJ figure and treat it
// as calories, overstating everything by roughly 4x.
//
// "Foundation" type records (USDA's most detailed/most-preferred data
// type) can skip plain "Energy" (nutrient 208) entirely and only report
// "Energy (Atwater General/Specific Factors)" instead - confirmed live on
// "Chicken, breast, boneless, skinless, raw" (fdcId 2646170), which has no
// 208 entry at all. Missing this silently defaulted calories to 0 while
// protein/carbs/fat (unaffected by this naming quirk) came through fine -
// exactly the "39g protein but 28 total calories" bug a user caught live.
const ENERGY_NUTRIENT_NAMES = ['Energy', 'Energy (Atwater General Factors)', 'Energy (Atwater Specific Factors)'];

function energyOf(food) {
  for (const name of ENERGY_NUTRIENT_NAMES) {
    const match = food.foodNutrients?.find(
      (item) => item.nutrientName === name && (item.unitName || '').toUpperCase() === 'KCAL'
    );
    if (match) {
      return match.value;
    }
  }

  return undefined;
}

function extractUsdaNutrients(food) {
  const nutrient = (name) => food.foodNutrients?.find((item) => item.nutrientName === name)?.value ?? 0;

  return {
    calories: energyOf(food) ?? 0,
    protein: nutrient('Protein'),
    carbs: nutrient('Carbohydrate, by difference'),
    fat: nutrient('Total lipid (fat)'),
  };
}

// A meal-prep recipe line like "1.25 cups brown rice" alongside a protein
// almost always means the cooked serving, but USDA's plain-name search
// ranks raw/dry entries first (confirmed live: "brown rice" -> 357 kcal/100g
// raw vs "brown rice cooked" -> ~124 kcal/100g cooked - nearly 3x apart).
// Oats are deliberately excluded: recipes phrase those as a dry measure
// that gets cooked ("0.75 cup oats cooked in milk"), the opposite
// convention, and are already matching correctly as raw/dry.
const COOKED_BY_DEFAULT_KEYWORDS = ['rice', 'quinoa', 'pasta', 'noodle', 'orzo', 'couscous', 'barley'];
const EXPLICIT_RAW_KEYWORDS = ['raw', 'dry', 'dried', 'uncooked'];

function buildUsdaSearchQuery(name) {
  const lower = name.toLowerCase();
  const impliesCookedByDefault = COOKED_BY_DEFAULT_KEYWORDS.some((keyword) => lower.includes(keyword));
  const explicitlyRaw = EXPLICIT_RAW_KEYWORDS.some((keyword) => lower.includes(keyword));

  return impliesCookedByDefault && !explicitlyRaw ? `${name} cooked` : name;
}

function pickBestOffProduct(products, searchName) {
  if (!products || products.length === 0) {
    return null;
  }

  const scored = products
    .map((product) => ({ product, score: scoreTextRelevance(product.product_name || '', searchName) }))
    .sort((a, b) => b.score - a.score);

  // Open Food Facts is community-submitted free text search with no
  // reliable "generic ingredient" data type to fall back on the way USDA
  // has - if nothing scores above 0, every result is an unrelated branded
  // product (confirmed live: "broccoli" fell through to a USDA 404 and an
  // unfiltered OFF pick landed on a vegan quiche). Better to report no
  // match than silently attach an unrelated product's nutrition.
  return scored[0].score > 0 ? scored[0].product : null;
}

// Ranks candidates best-first instead of picking just one: USDA's detail
// endpoint can 404 on a food that its own search endpoint just returned
// (confirmed live for a "Broccoli, raw" Foundation entry) - matchIngredient
// tries candidates in this order until one's detail fetch actually
// succeeds, rather than abandoning USDA entirely after the first failure.
function rankUsdaFoods(foods, searchName) {
  if (!foods || foods.length === 0) {
    return [];
  }

  const nonBranded = foods.filter((food) => food.dataType !== 'Branded');
  const candidates = nonBranded.length > 0 ? nonBranded : foods;

  const scored = candidates.map((food) => ({ food, score: scoreTextRelevance(food.description, searchName) }));
  const energies = scored.map((item) => energyOf(item.food)).filter((value) => typeof value === 'number').sort((a, b) => a - b);
  const median = energies.length > 0 ? energies[Math.floor(energies.length / 2)] : null;

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // Tied on relevance - common among Branded results, which can include
      // mislabeled/outlier entries (confirmed live: one of ten "EGGS"
      // branded products actually reported 571 kcal/100g and almost no
      // protein). Prefer whichever is closest to the group's median
      // calorie value over whichever the API happened to list first.
      if (median == null) {
        return 0;
      }

      const energyA = energyOf(a.food);
      const energyB = energyOf(b.food);
      if (energyA == null) return 1;
      if (energyB == null) return -1;

      return Math.abs(energyA - median) - Math.abs(energyB - median);
    })
    .map((item) => item.food);
}

// Cache-first: an ingredient matched once (e.g. "chicken breast") is reused
// everywhere it appears across the board instead of re-querying USDA/OFF
// every time. Only a cache miss triggers network calls.
export async function matchIngredient(rawLine, library) {
  const parsed = parseIngredientLine(rawLine);
  const cacheKey = normalizeIngredientName(parsed.name);
  const cached = getCachedMatch(library, cacheKey);

  if (cached) {
    return { entry: cached, library, fromCache: true };
  }

  try {
    const usdaData = await searchUsdaFoods(buildUsdaSearchQuery(parsed.name));
    const rankedFoods = rankUsdaFoods(usdaData.foods, parsed.name);

    // Try candidates in ranked order - USDA's detail endpoint can 404 on a
    // food its own search just returned, so one failure shouldn't mean
    // abandoning USDA entirely when a perfectly good second choice exists.
    for (const candidate of rankedFoods.slice(0, 3)) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const detail = await getUsdaFoodDetail(candidate.fdcId);
        const entry = {
          normalizedName: cacheKey,
          source: 'usda',
          matchedFoodId: String(candidate.fdcId),
          matchedFoodName: candidate.description,
          dataType: candidate.dataType,
          nutrientsPer100g: extractUsdaNutrients(candidate),
          foodPortions: detail.foodPortions || [],
          resolvedAt: new Date().toISOString(),
          verified: false,
        };

        return { entry, library: setCachedMatch(library, cacheKey, entry), fromCache: false };
      } catch (detailError) {
        console.error(`USDA detail fetch failed for "${candidate.description}" (fdcId ${candidate.fdcId}):`, detailError);
      }
    }
  } catch (error) {
    console.error(`USDA match failed for "${parsed.name}":`, error);
  }

  // USDA came up empty (or errored) - fall back to Open Food Facts, mainly
  // useful for actually-branded ingredients.
  try {
    const offData = await searchOpenFoodFacts(parsed.name);
    const bestProduct = pickBestOffProduct(offData.products, parsed.name);

    if (bestProduct) {
      const entry = {
        normalizedName: cacheKey,
        source: 'off',
        matchedFoodId: bestProduct.code,
        matchedFoodName: bestProduct.product_name || parsed.name,
        nutrientsPer100g: {
          calories: bestProduct.nutriments?.['energy-kcal_100g'] ?? 0,
          protein: bestProduct.nutriments?.proteins_100g ?? 0,
          carbs: bestProduct.nutriments?.carbohydrates_100g ?? 0,
          fat: bestProduct.nutriments?.fat_100g ?? 0,
        },
        servingSize: bestProduct.serving_size || null,
        servingQuantity: bestProduct.serving_quantity ?? null,
        resolvedAt: new Date().toISOString(),
        // Branded-item matches via OFF are never auto-verified - brand/regional
        // accuracy has a real error ceiling, per the plan's known limitations.
        verified: false,
      };

      return { entry, library: setCachedMatch(library, cacheKey, entry), fromCache: false };
    }
  } catch (error) {
    console.error(`Open Food Facts match failed for "${parsed.name}":`, error);
  }

  return { entry: null, library, fromCache: false };
}
