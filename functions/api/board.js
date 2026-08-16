/*
 * Cloudflare Pages Function backing cloud sync: GET and PUT one JSON blob in KV.
 *
 * This replaced a Supabase table (see docs/ARCHITECTURE.md). The reason was not
 * that Supabase was the wrong shape - a single-row table holding one JSON blob
 * is exactly this - but that free-tier projects auto-pause for inactivity and
 * two separate keep-alive strategies were demonstrably ignored by whatever
 * metric drives that. KV meters requests instead of pausing for idleness, so
 * the entire failure class is gone rather than mitigated.
 *
 * It is same-origin with the app, which is why the client needs no URL, no key,
 * and no CORS headers exist here. If you ever add a second origin, adding CORS
 * is the moment to think about whether this endpoint should still be open.
 *
 * Deliberately unauthenticated, carrying forward the reasoning already accepted
 * for the open Supabase RLS policies: single-user personal tool, and the worst
 * case is someone overwriting one meal board that is also in localStorage and
 * in Export JSON. A shared secret is not offered because a browser-only SPA
 * cannot hold one - it would ship in the bundle and stop nobody who looked.
 * The two guards below are the ones that are real rather than theatre.
 */

const KEY = 'kevin-meal-plan';

// Not a security boundary - it stops a mis-shaped or runaway client turning a
// personal sync endpoint into free general-purpose storage. A full board is
// tens of KB; KV's own value ceiling is 25 MiB, far above anything legitimate.
const MAX_BODY_BYTES = 1_000_000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // The board is user data with no cache-friendly semantics; a stale pull
      // would silently show an old board, which is the one thing sync exists
      // to prevent.
      'cache-control': 'no-store',
    },
  });
}

/*
 * A missing binding is the single most likely deployment mistake here, and it
 * is invisible from the client unless it is named. Pages scopes KV bindings
 * separately for Production and Preview exactly like environment variables, so
 * "works in production, 500s on the preview URL" is the expected shape of
 * getting this half-right.
 */
function missingBinding() {
  return json(
    {
      error:
        'The MEAL_PLAN_KV namespace is not bound to this deployment. Bind it in the Cloudflare Pages project settings for this environment (Production and Preview are configured separately).',
    },
    503
  );
}

export async function onRequestGet({ env }) {
  if (!env.MEAL_PLAN_KV) {
    return missingBinding();
  }

  const stored = await env.MEAL_PLAN_KV.get(KEY, 'json');

  if (!stored) {
    // Genuinely nothing stored yet - the first-run state, not an error. The
    // client turns this into "no cloud backup yet, push first".
    return json({ error: 'No board has been pushed yet.' }, 404);
  }

  return json(stored);
}

export async function onRequestPut({ request, env }) {
  if (!env.MEAL_PLAN_KV) {
    return missingBinding();
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ error: `Board is larger than the ${MAX_BODY_BYTES} byte limit.` }, 413);
  }

  const raw = await request.text();
  // content-length is client-supplied and optional, so the declared check above
  // is an early out, not the enforcement. This is the enforcement.
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: `Board is larger than the ${MAX_BODY_BYTES} byte limit.` }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: 'Request body was not valid JSON.' }, 400);
  }

  if (!payload || !Array.isArray(payload.days)) {
    return json({ error: 'Request body must be an object with a "days" array.' }, 400);
  }

  if (!Number.isInteger(payload.schemaVersion)) {
    return json({ error: 'Request body must carry an integer "schemaVersion".' }, 400);
  }

  // The server stamps the time rather than trusting the client's clock. Pull
  // shows this timestamp beside the local one so Kevin can tell which side is
  // newer before overwriting - a device with a wrong clock would make that
  // comparison lie.
  const updatedAt = new Date().toISOString();

  await env.MEAL_PLAN_KV.put(
    KEY,
    JSON.stringify({
      schemaVersion: payload.schemaVersion,
      days: payload.days,
      updatedAt,
    })
  );

  return json({ updatedAt });
}

// Anything else. Pages would otherwise fall through to the static asset handler
// and answer a POST with the SPA's index.html, which the client would then fail
// to parse as JSON - a confusing symptom for a simple wrong-verb mistake.
export async function onRequest() {
  return json({ error: 'Only GET and PUT are supported on this endpoint.' }, 405);
}
