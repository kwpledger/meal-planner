const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const OPEN_FOOD_FACTS_BASE_URL = 'https://world.openfoodfacts.org';

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY;

export async function searchUsdaFoods(query) {
  if (!USDA_API_KEY) {
    throw new Error('Missing USDA API key. Add VITE_USDA_API_KEY to your .env file.');
  }

  const url = new URL(`${USDA_BASE_URL}/foods/search`);
  url.searchParams.set('api_key', USDA_API_KEY);
  url.searchParams.set('query', query);
  url.searchParams.set('pageSize', '10');

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`USDA lookup failed: ${response.status}`);
  }

  return response.json();
}

// The /foods/search endpoint only returns per-100g nutrients - portion/gram
// weight data (foodPortions[]) requires this separate detail call.
export async function getUsdaFoodDetail(fdcId) {
  if (!USDA_API_KEY) {
    throw new Error('Missing USDA API key. Add VITE_USDA_API_KEY to your .env file.');
  }

  const url = new URL(`${USDA_BASE_URL}/food/${fdcId}`);
  url.searchParams.set('api_key', USDA_API_KEY);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`USDA food detail lookup failed: ${response.status}`);
  }

  return response.json();
}

// By barcode, for refetching a product already matched. Not search: it is a
// different endpoint, and on 2026-10-27 search was returning an HTML outage
// page while this one kept answering.
export async function getOpenFoodFactsProduct(code) {
  const url = new URL(`${OPEN_FOOD_FACTS_BASE_URL}/api/v2/product/${encodeURIComponent(code)}.json`);
  url.searchParams.set('fields', 'product_name,nutriments');

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open Food Facts product lookup failed: ${response.status}`);
  }

  return response.json();
}

export async function searchOpenFoodFacts(query) {
  const url = new URL(`${OPEN_FOOD_FACTS_BASE_URL}/cgi/search.pl`);
  url.searchParams.set('search_terms', query);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '10');

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open Food Facts lookup failed: ${response.status}`);
  }

  return response.json();
}
