import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Sparkles, Loader2 } from "lucide-react";

// ── Result shape ─────────────────────────────────────────────────────────────
// All fields optional/nullable — only populated fields are filled in the form.

export interface SmartFillResult {
  // Circle fields
  name?: string | null;
  description?: string | null;
  category?: string | null;
  university?: string | null;
  primaryLanguage?: string | null;
  englishFriendly?: boolean | null;
  recruiting?: boolean | null;
  recruitingPeriod?: string | null;
  membershipFee?: string | null;
  howToJoin?: string | null;
  instagram?: string | null;
  website?: string | null;
  tags?: string[] | null;
  // Event fields
  title?: string | null;
  location?: string | null;
  cost?: string | null;
  online?: boolean | null;
  luma?: string | null;
  startDate?: string | null;  // ISO 8601
  endDate?: string | null;    // ISO 8601
  // Deal fields
  brand?: string | null;
  originalPrice?: string | null;
  newPrice?: string | null;
  studentOnly?: boolean | null;
  mode?: string | null;
  url?: string | null;
}

export type SmartFillType = "circle" | "event" | "deal";

interface Props {
  type: SmartFillType;
  /** Called with extracted data and the source URL that was filled from */
  onFill: (data: SmartFillResult, sourceUrl: string) => void;
}

const HINTS: Record<SmartFillType, string> = {
  circle: "Works best with club websites — Instagram may only get name and bio.",
  event:  "Works best with event pages and Luma links.",
  deal:   "Paste the deal or brand page and we'll extract the details.",
};

export function SmartFill({ type, onFill }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const [filledCount, setFilledCount] = useState<number | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show a "warming up" hint after 8s of loading so it doesn't feel stuck
  useEffect(() => {
    if (loading) {
      slowTimerRef.current = setTimeout(() => setSlow(true), 12_000);
    } else {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setSlow(false);
    }
    return () => { if (slowTimerRef.current) clearTimeout(slowTimerRef.current); };
  }, [loading]);

  function isValidUrl(s: string): boolean {
    try {
      const u = new URL(s.startsWith("http") ? s : `https://${s}`);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }

  async function handleFill() {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidUrl(trimmed)) {
      setError("Please enter a valid URL (e.g. https://yourclub.com)");
      return;
    }
    setLoading(true);
    setError("");
    setFilledCount(null);

    const startMs = Date.now();
    console.log("[smart-fill] starting request at", new Date().toISOString(), "type:", type);

    try {
      console.log("[smart-fill] invoking edge function...");
      // Use raw fetch instead of supabase.functions.invoke() — the SDK wrapper
      // can hang waiting for the response stream to close even after data arrives.
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const fetchPromise = fetch(`${supabaseUrl}/functions/v1/smart-fill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ url: trimmed, type }),
        signal: AbortSignal.timeout(30_000),
      }).then((r) => r.json());

      const payload = await Promise.race([fetchPromise, timeout]);
      console.log(`[smart-fill] got response after ${Date.now() - startMs}ms`, payload);

      if (payload?.error) {
        console.error("[smart-fill] error from edge function", payload.error);
        throw new Error(payload.error);
      }

      const result: SmartFillResult = payload?.data ?? {};
      console.log("[smart-fill] extracted fields", result);

      // Count non-null/non-empty fields filled
      const count = Object.values(result).filter((v) =>
        v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
      ).length;

      onFill(result, trimmed);
      setFilledCount(count);
    } catch (err: any) {
      console.error(`[smart-fill] caught error after ${Date.now() - startMs}ms`, err);
      const msg = err?.name === "AbortError" || err?.name === "TimeoutError"
        ? "Timed out — try again, it's usually faster on a second attempt."
        : (err instanceof Error ? err.message : "Smart fill failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); handleFill(); }
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <p className="text-sm font-semibold text-primary">Smart fill</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste a link and we'll fill in the form automatically. {HINTS[type]}
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKey}
          placeholder="https://..."
          disabled={loading}
          className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleFill}
          disabled={loading || !url.trim()}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {slow ? "Warming up…" : "Filling…"}</>
          ) : (
            "Fill"
          )}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {filledCount !== null && !error && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✓ Filled {filledCount} field{filledCount !== 1 ? "s" : ""} — review below and edit as needed.
        </p>
      )}
    </div>
  );
}
