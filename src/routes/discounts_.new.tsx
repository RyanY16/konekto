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
  const [saleEndOpen, setSaleEndOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <div className={field}>
            <label className={lbl}>Image {opt}</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-muted shrink-0"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xl">📷</span>
                    </div>
                  </>
                ) : (
                  <span className="text-4xl group-hover:scale-110 transition-transform">📷</span>
                )}
              </button>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Upload an image</p>
                <p>PNG or JPG · Max 5 MB</p>
                {imagePreview && (
                  <button type="button" className="text-destructive hover:underline" onClick={() => { if (imagePreview) URL.revokeObjectURL(imagePreview); setPendingImage(null); setImagePreview(null); }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
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
              <Input value={draft.url} onChange={(e) => setDraft({ url: e.target.value })} placeholder="https://" className="pl-9" />
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
