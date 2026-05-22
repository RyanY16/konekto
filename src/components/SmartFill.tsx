import { useState, type KeyboardEvent } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface SmartFillResult {
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
}

interface Props {
  onFill: (data: SmartFillResult) => void;
}

export function SmartFill({ onFill }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filledCount, setFilledCount] = useState<number | null>(null);

  async function handleFill() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setFilledCount(null);

    const startMs = Date.now();
    console.log("[smart-fill] starting request at", new Date().toISOString());

    // Client-side timeout — rejects if the edge function takes too long
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.error(`[smart-fill] timed out after ${Date.now() - startMs}ms`);
        reject(new Error("Timed out — the site took too long to respond."));
      }, 35_000)
    );

    try {
      console.log("[smart-fill] invoking edge function...");
      const invokePromise = supabase!.functions.invoke("smart-fill", { body: { url: trimmed } });
      const { data, error: fnError } = await Promise.race([invokePromise, timeout]);
      console.log(`[smart-fill] got response after ${Date.now() - startMs}ms`, { data, fnError });

      // fnError = network/invocation failure (edge function didn't respond)
      if (fnError) {
        console.error("[smart-fill] function error", fnError);
        throw new Error(fnError.message);
      }

      // data.error = the edge function ran but returned an application error
      // e.g. Jina couldn't fetch the page, or the AI call failed
      if (data?.error) {
        console.error("[smart-fill] app error from edge function", data.error);
        throw new Error(data.error);
      }

      const result: SmartFillResult = data?.data ?? {};
      console.log("[smart-fill] extracted fields", result);

      // Count non-null/non-empty fields so we can tell the user how many were filled
      const count = Object.values(result).filter((v) =>
        v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
      ).length;

      onFill(result);
      setFilledCount(count);
    } catch (err) {
      // Covers timeout, network errors, and application errors from above
      console.error(`[smart-fill] caught error after ${Date.now() - startMs}ms`, err);
      setError(err instanceof Error ? err.message : "Smart fill failed");
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
        Paste a link and we'll fill in the form automatically. Works best with websites and Luma event pages — Instagram may only get name and bio.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKey}
          placeholder="https://yourclub.com or instagram.com/handle"
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
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Filling…</>
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
