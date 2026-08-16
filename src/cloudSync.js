import { SCHEMA_VERSION } from './ingredientParser';

/*
 * The whole cloud sync surface: two functions moving one JSON blob to and from
 * a Cloudflare Pages Function backed by KV (functions/api/board.js).
 *
 * Same-origin, so there is no URL and no key to configure - which is why this
 * module reads no environment variables at all any more. The trade is that
 * `npm run dev` does not serve Pages Functions, so sync only works against a
 * deployment or `wrangler pages dev`. The dev case is detected explicitly below
 * rather than left to surface as a JSON parse error.
 */

const SYNC_ENDPOINT = '/api/board';

/*
 * Every failure here has to name the service and the cause. This pattern has
 * cost real debugging time twice: a paused Supabase project surfaced as a bare
 * "TypeError: Failed to fetch" pointing nowhere, and missing credentials
 * surfaced as a blank white page. The auto-pause failure is gone with Supabase,
 * but the lesson outlives it - a raw browser error is worse than no error,
 * because it actively points away from the cause.
 */
async function syncFetch(options) {
  let response;

  try {
    response = await fetch(SYNC_ENDPOINT, options);
  } catch (error) {
    throw new Error(
      `Could not reach the sync endpoint at ${SYNC_ENDPOINT}. Check your connection - and note that "npm run dev" does not serve Cloudflare Pages Functions, so sync needs a deployment or "wrangler pages dev". (${error.message})`,
      { cause: error }
    );
  }

  // Vite's dev server answers an unknown path with the SPA's index.html and a
  // 200, so a "successful" response that is HTML means the function is not
  // being served rather than that anything went wrong with sync.
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `The sync endpoint at ${SYNC_ENDPOINT} returned ${contentType || 'no content type'} instead of JSON (HTTP ${response.status}). The Pages Function is most likely not deployed on this origin.`
    );
  }

  const body = await response.json();

  return { response, body };
}

export async function pushToCloud(days) {
  const { response, body } = await syncFetch({
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ schemaVersion: SCHEMA_VERSION, days }),
  });

  if (!response.ok) {
    throw new Error(body.error ?? `Sync endpoint returned HTTP ${response.status}.`);
  }

  return { pushedAt: body.updatedAt };
}

export async function pullFromCloud() {
  const { response, body } = await syncFetch({ method: 'GET' });

  // 404 is the first-ever-sync state, not an error - the same case the old
  // Supabase implementation got from .maybeSingle() returning null.
  if (response.status === 404) {
    return { status: 'empty' };
  }

  if (!response.ok) {
    throw new Error(body.error ?? `Sync endpoint returned HTTP ${response.status}.`);
  }

  if (body.schemaVersion > SCHEMA_VERSION) {
    return { status: 'incompatible', cloudSchemaVersion: body.schemaVersion };
  }

  return {
    status: 'ok',
    days: body.days,
    updatedAt: body.updatedAt,
    schemaVersion: body.schemaVersion,
  };
}
