import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Custom lock with a hard timeout so tabs never wait indefinitely for each other.
// Supabase's default navigator.locks can queue forever if another tab holds the lock
// (e.g. during token refresh), causing other tabs to hang on page load.
// If the lock can't be acquired within 10s, we proceed without it — two tabs might
// refresh simultaneously (harmless) rather than one hanging forever.
function makeLock() {
  if (typeof navigator === "undefined" || !("locks" in navigator)) {
    // SSR / no Web Locks support — just run the function directly
    return (_name: string, _acquireTimeout: number, fn: () => Promise<string>) => fn();
  }

  return (name: string, acquireTimeout: number, fn: () => Promise<string>): Promise<string> => {
    const timeoutMs = acquireTimeout >= 0 ? acquireTimeout : 10_000;

    return new Promise<string>((resolve, reject) => {
      let timedOut = false;

      // If we can't get the lock in time, run without it
      const timer = timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            console.warn("[supabase] lock timeout — proceeding without lock");
            fn().then(resolve).catch(reject);
          }, timeoutMs)
        : null;

      navigator.locks.request(name, async (lock) => {
        if (timedOut) return; // already resolved via timeout path
        if (timer) clearTimeout(timer);
        try { resolve(await fn()); } catch (e) { reject(e); }
      }).catch((e) => {
        if (timedOut) return;
        if (timer) clearTimeout(timer);
        reject(e);
      });
    });
  };
}

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        lock: makeLock(),
      },
    })
  : null;
