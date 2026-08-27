import type { Backend } from "./types";
import { localBackend } from "./local";
import { supabaseBackend } from "./supabase";

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** The one backend the whole app uses. Local (browser-only) until Supabase
 *  env vars exist, then the Supabase adapter takes over automatically. */
export const backend: Backend = supabaseConfigured ? supabaseBackend : localBackend;

export const backendName = supabaseConfigured ? "supabase" : "local";

export { AuthError } from "./types";
