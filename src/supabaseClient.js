import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/*
 * createClient() throws "supabaseUrl is required" when the env vars are absent,
 * and because this module is imported at the top of the App tree that throw
 * happened during module evaluation - before React ever mounted. The result was
 * a blank white page with the error only visible in the console, which is a
 * terrible failure mode for the documented "no .env yet" state where the board
 * itself needs no Supabase at all. Degrade to null so the board renders and only
 * the two sync buttons fail, with a message that says which keys are missing.
 */
export const isCloudSyncConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isCloudSyncConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
