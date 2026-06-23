import { useState } from "react";
import { Layers, X, Check, Loader2, ExternalLink, MapPin, Calendar, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { addEvent, getEventHandle, addCircle, getCircleHandle, addDeal, getDealHandle, addJob, getJobHandle } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { inferRelevantTags, filterValidTags } from "@/data/tags";
import { DEAL_CATEGORIES, DEAL_CATEGORY_EMOJI, CIRCLE_CATEGORIES, CATEGORY_EMOJI, EVENT_CATEGORIES, OPPORTUNITY_CATEGORIES } from "@/data/profile-options";
import { format } from "date-fns";
import type { SmartFillResult, SmartFillType } from "@/components/SmartFill";
import { isLumaUrl } from "@/lib/social-links";
import { formatOpportunityDeadline, normalizeOpportunityDeadline } from "@/lib/opportunity-deadline";
import { formatYenPrice, normalizeDealPriceNumber } from "@/lib/deal-price";
import type { Job } from "@/data/mock";

type SmartFillLanguage = "en" | "ja" | "both";

const LANGUAGE_OPTIONS: { value: SmartFillLanguage; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ja", label: "JP" },
  { value: "both", label: "Both" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeUrl(s: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch { return null; }
}

async function fetchSmartFill(url: string, type: SmartFillType, outputLanguage: SmartFillLanguage): Promise<SmartFillResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const res = await fetch(`${supabaseUrl}/functions/v1/smart-fill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
      "apikey": supabaseKey,
    },
    body: JSON.stringify({ url, type, outputLanguage }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.error) throw new Error(payload?.error ?? `Smart fill failed (${res.status})`);
  return payload?.data ?? {};
}

function buildEventParams(data: SmartFillResult, sourceUrl: string, ownerId: string) {
  const title = data.title?.trim() || "Untitled Event";
  const rawCat = data.category ?? "";
  const category = (EVENT_CATEGORIES.includes(rawCat as any) ? rawCat : "Social") as typeof EVENT_CATEGORIES[number];
  const emoji = CATEGORY_EMOJI[category] || "📅";
  let dateStr = "TBD";
  let startDateIso: string | undefined;
  if (data.startDate) {
    const d = new Date(data.startDate);
    if (!isNaN(d.getTime())) {
      startDateIso = d.toISOString();
      const endD = data.endDate ? new Date(data.endDate) : null;
      if (endD && !isNaN(endD.getTime()) && endD.toDateString() !== d.toDateString()) {
        dateStr = `${format(d, "EEE, MMM d")}–${format(endD, "MMM d")} · ${format(d, "h:mm a")} – ${format(endD, "h:mm a")}`;
      } else {
        dateStr = `${format(d, "EEE, MMM d")} · ${format(d, "h:mm a")}${endD ? ` – ${format(endD, "h:mm a")}` : ""}`;
      }
    }
  }
  const lumaLink = data.luma || (isLumaUrl(data.website) ? data.website : undefined) || (isLumaUrl(sourceUrl) ? sourceUrl : undefined);
  const tags = filterValidTags(inferRelevantTags({ tags: data.tags, text: [data.title, data.description, data.category, data.location], limit: 4 }));
  return { title, description: data.description?.trim() || undefined, category, date: dateStr, location: data.location?.trim() || "TBD", emoji, tags, cost: data.cost?.trim() || undefined, online: data.online ?? false, socialLinks: { luma: lumaLink, website: data.website && data.website !== lumaLink ? data.website : (!lumaLink ? sourceUrl : undefined) }, ownerId, startDate: startDateIso, imageUrl: data.imageUrl || undefined, isAdmin: true };
}

function buildCircleParams(data: SmartFillResult, sourceUrl: string, ownerId: string) {
  const name = data.name?.trim() || "Untitled Circle";
  const rawCat = data.category ?? "";
  const category = CIRCLE_CATEGORIES.includes(rawCat as any) ? rawCat : "Community";
  const emoji = CATEGORY_EMOJI[category] || "👥";
  const tags = filterValidTags(inferRelevantTags({ tags: data.tags, text: [data.name, data.description, data.category, data.university], limit: 5 }));
  const id = `circle-${crypto.randomUUID()}`;
  return { id, name, category, description: data.description?.trim() || "", activity: "Weekly" as any, englishFriendly: data.englishFriendly ?? false, emoji, tags, university: data.university?.trim() || undefined, primaryLanguage: undefined as string | undefined, recruiting: data.recruiting ?? false, recruitingPeriod: data.recruitingPeriod?.trim() || undefined, membershipFee: data.membershipFee?.trim() || undefined, howToJoin: data.howToJoin?.trim() || undefined, socialLinks: { instagram: data.instagram?.replace(/^@/, "") || undefined, website: data.website || sourceUrl } as any, ownerId, iconUrl: data.imageUrl || undefined, isAdmin: true };
}

function buildDealParams(data: SmartFillResult, sourceUrl: string) {
  const rawCat = data.category ?? "";
  const category = (DEAL_CATEGORIES as readonly string[]).includes(rawCat) ? rawCat : "Other";
  return { brand: data.brand?.trim() || "Unknown", title: data.title?.trim() || "Untitled Deal", category: category as any, description: data.description?.trim() || undefined, originalPrice: normalizeDealPriceNumber(data.originalPrice) || undefined, newPrice: normalizeDealPriceNumber(data.newPrice) || undefined, studentOnly: data.studentOnly ?? true, mode: (data.mode && ["In-Person", "Online", "Both"].includes(data.mode) ? data.mode : "Online") as any, imageUrl: data.imageUrl || undefined, socialLinks: { website: data.url || sourceUrl } as any };
}

function buildOpportunityParams(data: SmartFillResult, sourceUrl: string): Omit<Job, "id"> {
  const rawCat = data.category ?? "";
  const category = ((OPPORTUNITY_CATEGORIES as readonly string[]).includes(rawCat) ? rawCat : "Other") as Job["category"];
  const mode = data.mode === "Online" || data.mode === "Hybrid" || data.mode === "In-Person" ? data.mode : "In-Person";
  const rawData = data as SmartFillResult & Record<string, unknown>;
  const applicationUrl = ([
    rawData.applicationUrl,
    rawData.applicationURL,
    rawData.application_url,
    rawData.applyUrl,
    rawData.apply_url,
    rawData.url,
    rawData.website,
    sourceUrl,
  ].find((value) => typeof value === "string" && value.trim()) as string).trim();
  const tags = filterValidTags(inferRelevantTags({ tags: data.tags, text: [data.title, data.organization, data.category, data.description, data.eligibility], limit: 4 }));
  return {
    title: data.title?.trim() || "Untitled Opportunity",
    organization: data.organization?.trim() || data.brand?.trim() || "Unknown organization",
    category,
    location: data.location?.trim() || "TBD",
    mode,
    deadline: normalizeOpportunityDeadline(data.deadline),
    description: data.description?.trim() || undefined,
    eligibility: data.eligibility?.trim() || undefined,
    applicationUrl,
    socialLinks: applicationUrl ? { website: applicationUrl } : {},
    tags,
    emoji: CATEGORY_EMOJI[category] || "✨",
    imageUrl: data.imageUrl || undefined,
  };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FetchRow = { url: string; status: "pending" | "fetching" | "done" | "error"; data?: SmartFillResult; error?: string };
type ReviewItem = { url: string; data: SmartFillResult; selected: boolean };
type CreateRow = { url: string; title: string; status: "pending" | "creating" | "done" | "error"; handle?: string; error?: string };
type Step = "input" | "fetching" | "review" | "creating" | "done";

// ── Preview card per type ─────────────────────────────────────────────────────

function EventPreview({ data, url }: { data: SmartFillResult; url: string }) {
  const cat = EVENT_CATEGORIES.includes(data.category as any) ? data.category : "Social";
  const emoji = CATEGORY_EMOJI[cat!] || "📅";
  return (
    <div className="flex gap-2">
      {data.imageUrl && <img src={data.imageUrl} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover bg-muted" />}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <span>{emoji}</span>
          <span className="font-semibold text-sm">{data.title || "Untitled Event"}</span>
          {cat && <span className="text-[10px] text-muted-foreground border border-border rounded px-1">{cat}</span>}
        </div>
        {data.startDate && <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(data.startDate), "EEE, MMM d · h:mm a")}</p>}
        {data.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{data.location}</p>}
        {data.description && <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>}
        {data.tags && data.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
            {data.tags.slice(0, 4).map((t) => <span key={t} className="text-[10px] bg-muted rounded px-1.5 py-0.5">{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function CirclePreview({ data }: { data: SmartFillResult }) {
  const cat = CIRCLE_CATEGORIES.includes(data.category as any) ? data.category : null;
  const emoji = CATEGORY_EMOJI[cat!] || "👥";
  return (
    <div className="flex gap-2">
      {data.imageUrl && <img src={data.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover bg-muted" />}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <span>{emoji}</span>
          <span className="font-semibold text-sm">{data.name || "Untitled Circle"}</span>
          {cat && <span className="text-[10px] text-muted-foreground border border-border rounded px-1">{cat}</span>}
        </div>
        {data.university && <p className="text-xs text-muted-foreground">{data.university}</p>}
        {data.description && <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>}
        {data.tags && data.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
            {data.tags.slice(0, 4).map((t) => <span key={t} className="text-[10px] bg-muted rounded px-1.5 py-0.5">{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function DealPreview({ data }: { data: SmartFillResult }) {
  const cat = (DEAL_CATEGORIES as readonly string[]).includes(data.category ?? "") ? data.category : "Other";
  const emoji = DEAL_CATEGORY_EMOJI[cat!] || "🏷️";
  return (
    <div className="flex gap-2">
      {data.imageUrl && <img src={data.imageUrl} alt="" className="h-14 w-11 shrink-0 rounded-md object-cover bg-muted" />}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <span>{emoji}</span>
          <span className="font-semibold text-sm">{data.brand || "Unknown"} — {data.title || "Untitled Deal"}</span>
        </div>
        {cat && <span className="text-[10px] text-muted-foreground border border-border rounded px-1">{cat}</span>}
        {(data.originalPrice || data.newPrice) && (
          <p className="text-xs text-muted-foreground">
            {data.newPrice && <span className="font-medium text-foreground">{formatYenPrice(data.newPrice)}</span>}
            {data.originalPrice && <span className="line-through ml-1">{formatYenPrice(data.originalPrice)}</span>}
          </p>
        )}
        {data.description && <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>}
      </div>
    </div>
  );
}

function OpportunityPreview({ data }: { data: SmartFillResult }) {
  const cat = (OPPORTUNITY_CATEGORIES as readonly string[]).includes(data.category ?? "") ? data.category : "Other";
  const emoji = CATEGORY_EMOJI[cat!] || "✨";
  return (
    <div className="flex gap-2">
      {data.imageUrl && <img src={data.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover bg-muted" />}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <span>{emoji}</span>
          <span className="font-semibold text-sm">{data.title || "Untitled Opportunity"}</span>
          {cat && <span className="text-[10px] text-muted-foreground border border-border rounded px-1">{cat}</span>}
        </div>
        {data.organization && <p className="text-xs text-muted-foreground">{data.organization}</p>}
        {data.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{data.location}</p>}
        {normalizeOpportunityDeadline(data.deadline) && <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Deadline: {formatOpportunityDeadline(data.deadline)}</p>}
        {data.description && <p className="text-xs text-muted-foreground line-clamp-2">{data.description}</p>}
        {data.tags && data.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
            {data.tags.slice(0, 4).map((t) => <span key={t} className="text-[10px] bg-muted rounded px-1.5 py-0.5">{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<SmartFillType, string> = { event: "events", circle: "circles", deal: "deals", opportunity: "opportunities" };
const TYPE_HINTS: Record<SmartFillType, string> = {
  event: "Works best with Luma links and event pages.",
  circle: "Works best with club websites.",
  deal: "Paste the deal or brand page.",
  opportunity: "Paste scholarship, job, internship, study abroad, or application pages.",
};

interface Props { type: SmartFillType }

export function BatchAddDialog({ type }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [rawInput, setRawInput] = useState("");
  const [fetchRows, setFetchRows] = useState<FetchRow[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [createRows, setCreateRows] = useState<CreateRow[]>([]);
  const [language, setLanguage] = useState<SmartFillLanguage>("en");

  function reset() { setStep("input"); setRawInput(""); setFetchRows([]); setReviewItems([]); setCreateRows([]); setLanguage("en"); }

  function updateFetch(url: string, patch: Partial<FetchRow>) {
    setFetchRows((prev) => prev.map((r) => r.url === url ? { ...r, ...patch } : r));
  }

  async function handleFetch() {
    const urls = rawInput.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean).map((s) => normalizeUrl(s) ?? s);
    const deduped = [...new Set(urls)];
    if (!deduped.length || !user) return;

    const initial: FetchRow[] = deduped.map((url) => ({ url, status: "pending" }));
    setFetchRows(initial);
    setStep("fetching");

    const results: ReviewItem[] = [];
    for (const url of deduped) {
      updateFetch(url, { status: "fetching" });
      try {
        const data = await fetchSmartFill(url, type, language);
        updateFetch(url, { status: "done", data });
        results.push({ url, data, selected: true });
      } catch (err) {
        updateFetch(url, { status: "error", error: err instanceof Error ? err.message : "Failed" });
      }
    }

    setReviewItems(results);
    setStep("review");
  }

  async function handleCreate() {
    if (!user) return;
    const selected = reviewItems.filter((i) => i.selected);
    if (!selected.length) return;

    const initial: CreateRow[] = selected.map((i) => ({
      url: i.url,
      title: type === "circle" ? (i.data.name?.trim() || "Untitled Circle") : type === "deal" ? (i.data.title?.trim() || "Untitled Deal") : (i.data.title?.trim() || "Untitled Event"),
      status: "pending",
    }));
    setCreateRows(initial);
    setStep("creating");

    const updateCreate = (url: string, patch: Partial<CreateRow>) =>
      setCreateRows((prev) => prev.map((r) => r.url === url ? { ...r, ...patch } : r));

    for (const item of selected) {
      updateCreate(item.url, { status: "creating" });
      try {
        let handle: string;
        if (type === "event") {
          const params = buildEventParams(item.data, item.url, user.id);
          const id = await addEvent(params as any);
          handle = getEventHandle({ id, title: params.title });
        } else if (type === "circle") {
          const params = buildCircleParams(item.data, item.url, user.id);
          await addCircle(params as any);
          handle = getCircleHandle({ id: params.id, name: params.name });
        } else if (type === "deal") {
          const params = buildDealParams(item.data, item.url);
          const deal = await addDeal(params as any);
          handle = getDealHandle(deal);
        } else {
          const params = buildOpportunityParams(item.data, item.url);
          const opportunity = await addJob(params);
          handle = getJobHandle(opportunity);
        }
        updateCreate(item.url, { status: "done", handle });
      } catch (err) {
        updateCreate(item.url, { status: "error", error: err instanceof Error ? err.message : "Failed" });
      }
    }

    setStep("done");
  }

  const hrefBase = type === "event" ? "events" : type === "circle" ? "circles" : type === "deal" ? "discounts" : "careers";
  const allSelected = reviewItems.every((i) => i.selected);
  const someSelected = reviewItems.some((i) => i.selected);
  const doneCount = createRows.filter((r) => r.status === "done").length;
  const errorCount = createRows.filter((r) => r.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          Batch add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Batch add {TYPE_LABELS[type]}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-1 pr-1">

          {/* ── Step 1: Input ── */}
          {step === "input" && (
            <>
              <p className="text-sm text-muted-foreground">
                Paste URLs — one per line or comma-separated. {TYPE_HINTS[type]}
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">Output language</p>
                <div className="flex h-9 shrink-0 overflow-hidden rounded-lg border border-input bg-background">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLanguage(option.value)}
                      className={`px-2.5 text-xs font-semibold transition-colors ${
                        language === option.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={"https://example.com/page1\nhttps://example.com/page2"}
                rows={6}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <Button className="w-full" onClick={handleFetch} disabled={!rawInput.trim()}>
                Process all
              </Button>
            </>
          )}

          {/* ── Step 2: Fetching ── */}
          {step === "fetching" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Fetching details…</p>
              {fetchRows.map((row) => (
                <div key={row.url} className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
                  <div className="shrink-0">
                    {row.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                    {row.status === "fetching" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {row.status === "done" && <Check className="h-4 w-4 text-emerald-500" />}
                    {row.status === "error" && <X className="h-4 w-4 text-destructive" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate flex-1">{row.url}</p>
                  {row.status === "error" && <p className="text-xs text-destructive shrink-0">{row.error}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === "review" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {reviewItems.length} item{reviewItems.length !== 1 ? "s" : ""} ready — select which to add.
                </p>
                <button
                  onClick={() => setReviewItems((prev) => prev.map((i) => ({ ...i, selected: !allSelected })))}
                  className="text-xs text-primary hover:underline"
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>

              {reviewItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No items could be extracted.</p>
              )}

              <div className="space-y-2">
                {reviewItems.map((item, i) => (
                  <label
                    key={item.url}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${item.selected ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => setReviewItems((prev) => prev.map((r, j) => j === i ? { ...r, selected: e.target.checked } : r))}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      {type === "event" && <EventPreview data={item.data} url={item.url} />}
                      {type === "circle" && <CirclePreview data={item.data} />}
                      {type === "deal" && <DealPreview data={item.data} />}
                      {type === "opportunity" && <OpportunityPreview data={item.data} />}
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{item.url}</p>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* ── Step 4: Creating ── */}
          {(step === "creating" || step === "done") && (
            <div className="space-y-2">
              {step === "done" && (
                <p className="text-sm text-muted-foreground">
                  {doneCount} added{errorCount > 0 ? `, ${errorCount} failed` : ""}.
                </p>
              )}
              {createRows.map((row) => (
                <div key={row.url} className="flex items-start gap-2.5 rounded-lg border border-border bg-card p-3">
                  <div className="mt-0.5 shrink-0">
                    {row.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-muted" />}
                    {row.status === "creating" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {row.status === "done" && <Check className="h-4 w-4 text-emerald-500" />}
                    {row.status === "error" && <X className="h-4 w-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{row.title}</p>
                    {row.status === "error" && <p className="text-xs text-destructive">{row.error}</p>}
                  </div>
                  {row.status === "done" && row.handle && (
                    <a href={`/${hrefBase}/${row.handle}`} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        {step === "review" && (
          <div className="pt-3 border-t border-border flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setFetchRows([]); setReviewItems([]); setStep("input"); }}>
              Back
            </Button>
            <Button className="flex-1" onClick={handleCreate} disabled={!someSelected}>
              Add {reviewItems.filter((i) => i.selected).length} selected
            </Button>
          </div>
        )}
        {step === "done" && (
          <div className="pt-3 border-t border-border">
            <Button variant="outline" className="w-full" onClick={reset}>Add more</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
