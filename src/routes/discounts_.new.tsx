import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { CalendarIcon, Globe, ImagePlus, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { addDeal, uploadDealImage } from "@/data/backend";
import { anyContainsSlur } from "@/lib/profanity";
import { checkBeforePost } from "@/lib/moderation";
import { normalizeDealPriceNumber } from "@/lib/deal-price";
import { useAuth } from "@/components/AuthProvider";
import { DEAL_CATEGORIES, DEAL_CATEGORY_EMOJI } from "@/data/profile-options";
import { PageHeader } from "@/components/PageHeader";
import type { Deal } from "@/data/mock";
import { NativeSelect } from "@/components/ui/native-select";
import { SmartFill, type SmartFillResult } from "@/components/SmartFill";

export const Route = createFileRoute("/discounts_/new")({
  component: NewDiscountPage,
});

const STORAGE_KEY = "konekto_new_deal_draft";

type FormDraft = {
  brand: string;
  title: string;
  category: Deal["category"];
  originalPrice: string;
  newPrice: string;
  saleEnd: string;
  description: string;
  studentOnly: boolean;
  mode: Deal["mode"];
  url: string;
};

const defaultDraft: FormDraft = {
  brand: "",
  title: "",
  category: DEAL_CATEGORIES[0],
  originalPrice: "",
  newPrice: "",
  saleEnd: "",
  description: "",
  studentOnly: true,
  mode: "In-Person",
  url: "",
};

function loadDraft(): FormDraft {
  // Guard against SSR — sessionStorage is not available server-side.
  // Starting with defaultDraft ensures SSR HTML matches client first-render.
  if (typeof window === "undefined") return defaultDraft;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDraft;
    return { ...defaultDraft, ...JSON.parse(raw) };
  } catch {
    return defaultDraft;
  }
}

function saveDraft(d: FormDraft) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}

function clearDraft() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

function NewDiscountPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user } = useAuth();
  const [draft, setDraftState] = useState<FormDraft>(loadDraft);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);
  const [imageLinkOpen, setImageLinkOpen] = useState(false);
  const [saleEndOpen, setSaleEndOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSmartFill(data: SmartFillResult, sourceUrl: string) {
    const rawCat = data.category ?? "";
    setDraft({
      brand: data.brand ?? "",
      title: data.title ?? "",
      category: (DEAL_CATEGORIES as readonly string[]).includes(rawCat) ? rawCat as Deal["category"] : DEAL_CATEGORIES[0],
      originalPrice: normalizeDealPriceNumber(data.originalPrice),
      newPrice: normalizeDealPriceNumber(data.newPrice),
      saleEnd: "",
      description: data.description ?? "",
      studentOnly: data.studentOnly ?? true,
      mode: data.mode && ["In-Person", "Online", "Both"].includes(data.mode) ? data.mode as Deal["mode"] : "In-Person",
      url: data.url || sourceUrl,
    });
    if (data.imageUrl) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setPendingImage(null);
      setImagePreview(null);
      setRemoteImageUrl(data.imageUrl);
      setImageLinkOpen(false);
    } else {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setPendingImage(null);
      setImagePreview(null);
      setRemoteImageUrl(null);
      setImageLinkOpen(false);
    }
  }

  function setDraft(update: Partial<FormDraft>) {
    setDraftState((prev) => {
      const next = { ...prev, ...update };
      saveDraft(next);
      return next;
    });
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">You need to be signed in to add a deal.</p>
        <Link to="/login" className="text-sm font-semibold text-primary hover:underline">Sign in</Link>
      </div>
    );
  }

  function handleImageFile(file: File) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setPendingImage(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoteImageUrl(null);
    setImageLinkOpen(false);
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (anyContainsSlur(draft.brand, draft.title, draft.description)) {
      setError("Your post contains inappropriate language and could not be submitted. Please review and try again.");
      setSaving(false);
      return;
    }

    const aiCheck = await checkBeforePost([draft.brand, draft.title, draft.description].filter(Boolean).join(" "))
      .catch(() => ({ blocked: true as const, reason: "Content safety check failed — please try again in a moment." }));
    if (aiCheck.blocked) {
      setError(aiCheck.reason!);
      setSaving(false);
      return;
    }

    try {
      const dealId = `deal-${crypto.randomUUID()}`;

      let imageUrl: string | undefined = remoteImageUrl ?? undefined;
      if (pendingImage) {
        imageUrl = await uploadDealImage(dealId, pendingImage);
      }

      const deal = await addDeal({
        brand: draft.brand.trim(),
        title: draft.title.trim(),
        category: draft.category,
        originalPrice: draft.originalPrice.trim() || undefined,
        newPrice: draft.newPrice.trim() || undefined,
        saleEnd: draft.saleEnd.trim() || undefined,
        description: draft.description.trim() || undefined,
        studentOnly: draft.studentOnly,
        mode: draft.mode,
        imageUrl,
        socialLinks: { website: draft.url.trim() || undefined },
      });

      clearDraft();
      await router.invalidate();
      navigate({ to: "/discounts" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add deal.");
    } finally {
      setSaving(false);
    }
  };

  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const lbl = "text-xs font-medium text-muted-foreground";
  const field = "space-y-1.5";
  const req = <span className="text-destructive ml-0.5">*</span>;
  const opt = <span className="font-normal text-muted-foreground/60 ml-1">(optional)</span>;
  const displayImage = imagePreview ?? remoteImageUrl;

  return (
    <div>
      <Link to="/discounts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to discounts
      </Link>
      <PageHeader eyebrow="Discounts" title="Add a deal" />

      <div className="max-w-2xl space-y-5">
        <SmartFill type="deal" onFill={handleSmartFill} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className={field}>
            <label className={lbl}>Deal image {opt}</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group h-32 w-32 shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-muted"
              >
                {displayImage
                  ? (
                    <>
                      <img src={displayImage} alt="Deal image" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xl">📷</span>
                      </div>
                    </>
                  )
                  : <span className="text-3xl group-hover:scale-110 transition-transform">{DEAL_CATEGORY_EMOJI[draft.category] ?? "🏷️"}</span>
                }
              </button>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="text-sm font-medium text-foreground">Choose the image shown for this deal</p>
                <p className="text-xs text-muted-foreground">PNG, JPG · Max 5 MB</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    className="w-8 px-0 sm:w-auto sm:px-3"
                    aria-label="New pic"
                    title="New pic"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">New pic</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-8 px-0 sm:w-auto sm:px-3"
                    aria-label="From link"
                    title="From link"
                    onClick={() => setImageLinkOpen((open) => !open)}
                  >
                    <Link2 className="h-4 w-4" />
                    <span className="hidden sm:inline">From link</span>
                  </Button>
                  {displayImage && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="w-8 px-0 sm:w-auto sm:px-3"
                      aria-label="Remove image"
                      title="Remove image"
                      onClick={() => { if (imagePreview) URL.revokeObjectURL(imagePreview); setPendingImage(null); setImagePreview(null); setRemoteImageUrl(null); setImageLinkOpen(false); }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  )}
                </div>
                {imageLinkOpen && (
                  <Input
                    type="url"
                    value={remoteImageUrl ?? ""}
                    onChange={(e) => {
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setPendingImage(null);
                      setImagePreview(null);
                      setRemoteImageUrl(e.target.value.trim() || null);
                    }}
                    placeholder="Paste image link"
                  />
                )}
              </div>
            </div>
            {/* File input (gallery) */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }} />
          </div>

          {/* Brand */}
          <div className={field}>
            <label className={lbl}>Brand / store name {req}</label>
            <Input value={draft.brand} onChange={(e) => setDraft({ brand: e.target.value })} placeholder="e.g. Uniqlo" required />
          </div>

          {/* Title */}
          <div className={field}>
            <label className={lbl}>Deal title {req}</label>
            <Input value={draft.title} onChange={(e) => setDraft({ title: e.target.value })} placeholder="e.g. 20% off all items with student ID" required />
          </div>

          {/* Category */}
          <div className={field}>
            <label className={lbl}>Category {req}</label>
            <NativeSelect value={draft.category} onChange={(e) => setDraft({ category: e.target.value as Deal["category"] })} required>
              {DEAL_CATEGORIES.map((c) => <option key={c} value={c}>{DEAL_CATEGORY_EMOJI[c]} {c}</option>)}
            </NativeSelect>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Original price {opt}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">¥</span>
                <Input inputMode="decimal" value={draft.originalPrice} onChange={(e) => setDraft({ originalPrice: normalizeDealPriceNumber(e.target.value) })} placeholder="1200" className="pl-7" />
              </div>
            </div>
            <div className={field}>
              <label className={lbl}>New price {opt}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">¥</span>
                <Input inputMode="decimal" value={draft.newPrice} onChange={(e) => setDraft({ newPrice: normalizeDealPriceNumber(e.target.value) })} placeholder="960" className="pl-7" />
              </div>
            </div>
          </div>

          {/* Sale end */}
          <div className={field}>
            <label className={lbl}>Sale ends {opt}</label>
            <Popover open={saleEndOpen} onOpenChange={setSaleEndOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-left flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className={draft.saleEnd ? "" : "text-muted-foreground"}>
                    {draft.saleEnd ? format(new Date(draft.saleEnd + "T00:00:00"), "EEE, MMM d, yyyy") : "Select date…"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={draft.saleEnd ? new Date(draft.saleEnd + "T00:00:00") : undefined}
                  onSelect={(val) => { setDraft({ saleEnd: val ? format(val, "yyyy-MM-dd") : "" }); setSaleEndOpen(false); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className={field}>
            <label className={lbl}>Description {opt}</label>
            <Textarea value={draft.description} onChange={(e) => setDraft({ description: e.target.value })} placeholder="How to redeem, any conditions, etc." rows={4} />
          </div>

          {/* Mode */}
          <div className={field}>
            <label className={lbl}>Available {req}</label>
            <NativeSelect value={draft.mode} onChange={(e) => setDraft({ mode: e.target.value as Deal["mode"] })} required>
              <option value="In-Person">In-Person</option>
              <option value="Online">Online</option>
              <option value="Both">Both (Online & In-Person)</option>
            </NativeSelect>
          </div>

          {/* Student only */}
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 rounded" checked={draft.studentOnly} onChange={(e) => setDraft({ studentOnly: e.target.checked })} />
            <span>🎓 Student only</span>
          </label>

          {/* URL */}
          <div className={field}>
            <label className={lbl}>Link {opt}</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input value={draft.url} onChange={(e) => { try { setDraft({ url: decodeURI(e.target.value) }); } catch { setDraft({ url: e.target.value }); } }} placeholder="https://" className="pl-9" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add deal"}</Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/discounts" })}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
