import { supabase, isCloudSyncConfigured } from './supabaseClient';
import { SCHEMA_VERSION } from './ingredientParser';

const SYNC_ROW_ID = 'kevin-meal-plan';

// Both sync directions are unusable without credentials; fail here with a
// readable message rather than dereferencing a null client deeper in.
function assertConfigured() {
  if (!isCloudSyncConfigured) {
    throw new Error(
      'Cloud sync is not configured - VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are missing from .env'
    );
  }
}

export async function pushToCloud(days) {
  assertConfigured();
  const updatedAt = new Date().toISOString();

  const { error } = await supabase
    .from('meal_plan_sync')
    .upsert({
      id: SYNC_ROW_ID,
      schema_version: SCHEMA_VERSION,
      days,
      updated_at: updatedAt,
    });

  if (error) {
    throw error;
  }

  return { pushedAt: updatedAt };
}

export async function pullFromCloud() {
  assertConfigured();
  // .maybeSingle() (not .single()) returns null instead of throwing when
  // the table has no row yet - the expected first-run state, not an error.
  const { data, error } = await supabase
    .from('meal_plan_sync')
    .select('days, schema_version, updated_at')
    .eq('id', SYNC_ROW_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return { status: 'empty' };
  }

  if (data.schema_version > SCHEMA_VERSION) {
    return { status: 'incompatible', cloudSchemaVersion: data.schema_version };
  }

  return {
    status: 'ok',
    days: data.days,
    updatedAt: data.updated_at,
    schemaVersion: data.schema_version,
  };
}
