export type CategoryScores = {
  hate: number;
  "hate/threatening": number;
  harassment: number;
  "harassment/threatening": number;
  "self-harm": number;
  "self-harm/intent": number;
  "self-harm/instructions": number;
  sexual: number;
  "sexual/minors": number;
  violence: number;
  "violence/graphic": number;
};

export type ModerationResult = {
  flagged: boolean;
  categories: Record<keyof CategoryScores, boolean>;
  scores: CategoryScores;
  /** Highest score across all categories — used as the overall risk percentage. */
  topScore: number;
  /** The category with the highest score. */
  topCategory: keyof CategoryScores;
};

export const CATEGORY_META: Record<
  keyof CategoryScores,
  { label: string; color: string; severity: "critical" | "high" | "medium" | "low" }
> = {
  "sexual/minors":          { label: "Sexual / minors",       color: "text-red-600",    severity: "critical" },
  "hate/threatening":       { label: "Hate + threat",         color: "text-red-500",    severity: "critical" },
  "harassment/threatening": { label: "Harassment + threat",   color: "text-red-500",    severity: "high" },
  "self-harm/intent":       { label: "Self-harm intent",      color: "text-orange-500", severity: "high" },
  "self-harm/instructions": { label: "Self-harm instructions",color: "text-orange-500", severity: "high" },
  "violence/graphic":       { label: "Graphic violence",      color: "text-orange-500", severity: "high" },
  hate:                     { label: "Hate speech",           color: "text-orange-400", severity: "medium" },
  harassment:               { label: "Harassment",            color: "text-yellow-500", severity: "medium" },
  "self-harm":              { label: "Self-harm",             color: "text-yellow-500", severity: "medium" },
  sexual:                   { label: "Sexual content",        color: "text-purple-500", severity: "medium" },
  violence:                 { label: "Violence",              color: "text-yellow-400", severity: "low" },
};

// Categories sorted by severity for display
export const CATEGORIES_SORTED = Object.keys(CATEGORY_META) as (keyof CategoryScores)[];

/** Run at submit time — blocks if OpenAI flags it or any category score ≥ 0.7. Throws on service error so callers can fail closed. */
export async function checkBeforePost(text: string): Promise<{ blocked: boolean; reason?: string }> {
  const [result] = await moderateTexts([text]);
  if (!result) return { blocked: false };
  if (result.flagged || result.topScore >= 0.7) {
    const label = CATEGORY_META[result.topCategory]?.label ?? result.topCategory;
    return {
      blocked: true,
      reason: `Your post was flagged for ${label} (${(result.topScore * 100).toFixed(0)}% confidence). Please remove any inappropriate content and try again.`,
    };
  }
  return { blocked: false };
}

export async function moderateTexts(texts: string[]): Promise<ModerationResult[]> {
  const { supabase } = await import("@/lib/supabase");
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase.functions.invoke("moderate", {
    body: { texts },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  const json = data;
  return (json.results as any[]).map((r) => {
    const scores = r.category_scores as CategoryScores;
    const entries = Object.entries(scores) as [keyof CategoryScores, number][];
    const [topCategory, topScore] = entries.reduce((best, cur) =>
      cur[1] > best[1] ? cur : best,
    );
    return {
      flagged: r.flagged,
      categories: r.categories,
      scores,
      topScore,
      topCategory,
    };
  });
}
