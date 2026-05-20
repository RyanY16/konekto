import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { Globe, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { addDeal, uploadDealImage } from "@/data/backend";
import { anyContainsSlur } from "@/lib/profanity";
import { checkBeforePost } from "@/lib/moderation";
import { CropDialog } from "@/components/CropDialog";
import { useAuth } from "@/components/AuthProvider";
import { DEAL_CATEGORIES, DEAL_CATEGORY_EMOJI } from "@/data/profile-options";
import { PageHeader } from "@/components/PageHeader";
import type { Deal } from "@/data/mock";

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
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [fetchingCrop, setFetchingCrop] = useState(false);
  const [saleEndOpen, setSaleEndOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function openCropForExisting() {
    if (!imagePreview) return;
    setFetchingCrop(true);
    try {
      const res = await fetch(imagePreview);
      const blob = await res.blob();
      setCropFile(new File([blob], "deal.jpg", { type: blob.type }));
    } finally {
      setFetchingCrop(false);
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

      let imageUrl: string | undefined;
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

  return (
    <div>
      <Link to="/discounts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to discounts
      </Link>
      <PageHeader eyebrow="Discounts" title="Add a deal" />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image upload */}
          {cropFile && (
            <CropDialog
              file={cropFile}
              onCrop={(cropped) => { setCropFile(null); handleImageFile(cropped); }}
              onCancel={() => setCropFile(null)}
            />
          )}
          <div className={field}>
            <label className={lbl}>Photo {opt}</label>
            <div className="flex gap-4">
              {/* Portrait preview */}
              <div className="w-28 shrink-0 aspect-[3/4] rounded-xl border-2 border-border overflow-hidden flex items-center justify-center bg-muted">
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  : <span className="text-4xl">📷</span>
                }
              </div>
              <div className="flex flex-col gap-2 justify-center">
                <p className="text-xs text-muted-foreground">Take or upload a photo of the deal — receipt, menu, sign, etc.</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-xs font-medium text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 rounded-full px-3 py-1 transition-colors"
                  >
                    📸 Take photo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1 transition-colors"
                  >
                    {imagePreview ? "Replace" : "Upload"}
                  </button>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={openCropForExisting}
                      disabled={fetchingCrop}
                      className="text-xs font-medium text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 rounded-full px-3 py-1 transition-colors disabled:opacity-50"
                    >
                      {fetchingCrop ? "Loading…" : "Edit photo"}
                    </button>
                  )}
                  {imagePreview && (
                    <button
                      type="button"
                      className="text-xs font-medium text-destructive hover:text-destructive/80 border border-destructive/30 rounded-full px-3 py-1 transition-colors"
                      onClick={() => { URL.revokeObjectURL(imagePreview); setPendingImage(null); setImagePreview(null); }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG or JPG · Max 5 MB</p>
              </div>
            </div>
            {/* File input (gallery) */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ""; }} />
            {/* Camera input */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ""; }} />
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
            <select className={sel} value={draft.category} onChange={(e) => setDraft({ category: e.target.value as Deal["category"] })} required>
              {DEAL_CATEGORIES.map((c) => <option key={c} value={c}>{DEAL_CATEGORY_EMOJI[c]} {c}</option>)}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Original price {opt}</label>
              <Input value={draft.originalPrice} onChange={(e) => setDraft({ originalPrice: e.target.value })} placeholder="e.g. ¥1,200" />
            </div>
            <div className={field}>
              <label className={lbl}>New price {opt}</label>
              <Input value={draft.newPrice} onChange={(e) => setDraft({ newPrice: e.target.value })} placeholder="e.g. ¥960" />
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
            <select className={sel} value={draft.mode} onChange={(e) => setDraft({ mode: e.target.value as Deal["mode"] })} required>
              <option value="In-Person">In-Person</option>
              <option value="Online">Online</option>
              <option value="Both">Both (Online & In-Person)</option>
            </select>
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
