import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// SSR-safe lock: in browsers let Supabase use navigator.locks (its default),
// which serialises token refresh across tabs so two windows don't race.
// On the server navigator doesn't exist, so fall back to a no-op.
const ssrLock = typeof navigator !== "undefined" && "locks" in navigator
  ? undefined  // Supabase will use its built-in navigator.locks path
  : (_name: string, _timeout: number, fn: () => Promise<string>) => fn();

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        ...(ssrLock ? { lock: ssrLock } : {}),
      },
    })
  : null;
