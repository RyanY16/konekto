import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Globe, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { useAuth } from "@/components/AuthProvider";
import { getDealByHandle, updateDeal, deleteDeal, uploadDealImage } from "@/data/backend";
import { ShareButton } from "@/components/ShareButton";
import { SaveButton } from "@/components/SaveButton";
import { DEAL_CATEGORIES, DEAL_CATEGORY_EMOJI } from "@/data/profile-options";
import type { Deal } from "@/data/mock";

export const Route = createFileRoute("/discounts_/$dealHandle")({
  loader: ({ params }) => getDealByHandle(params.dealHandle),
  component: DealDetailPage,
});

type Draft = {
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

function toDraft(d: Deal): Draft {
  return {
    brand: d.brand,
    title: d.title,
    category: d.category,
    originalPrice: d.originalPrice ?? "",
    newPrice: d.newPrice ?? "",
    saleEnd: d.saleEnd ?? "",
    description: d.description ?? "",
    studentOnly: d.studentOnly,
    mode: d.mode,
    url: d.socialLinks?.website ?? "",
  };
}

function DealDetailPage() {
  const deal = Route.useLoaderData();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(deal ?? { id: "", brand: "", title: "", category: "Lifestyle", studentOnly: true, mode: "In-Person" }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saleEndOpen, setSaleEndOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!deal) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Deal not found</h1>
        <Link to="/discounts" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Back to discounts</Link>
      </div>
    );
  }

  function handleImageFile(file: File) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setPendingImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function save() {
    if (!deal) return;
    setSaving(true);
    setError("");
    try {
      let imageUrl = deal.imageUrl;
      if (pendingImage) {
        imageUrl = await uploadDealImage(deal.id, pendingImage);
      }
      await updateDeal(deal.id, {
        brand: draft.brand,
        title: draft.title,
        category: draft.category,
        originalPrice: draft.originalPrice || undefined,
        newPrice: draft.newPrice || undefined,
        saleEnd: draft.saleEnd || undefined,
        description: draft.description || undefined,
        studentOnly: draft.studentOnly,
        mode: draft.mode,
        imageUrl,
        socialLinks: {
          website: draft.url || undefined,
        },
      });
      setPendingImage(null);
      setImagePreview(null);
      setEditing(false);
      router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  const lbl = "text-xs font-medium text-muted-foreground";
  const field = "space-y-1.5";
  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const displayImage = imagePreview ?? deal.imageUrl;

  return (
    <div>
      <Link to="/discounts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to discounts
      </Link>

      {editing ? (
        <div className="max-w-2xl space-y-5">
          <PageHeader eyebrow="Discounts" title="Edit deal" />

          {/* Image */}
          <div className={field}>
            <label className={lbl}>Image (optional)</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-muted shrink-0"
              >
                {displayImage ? (
                  <>
                    <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xl">📷</span>
                    </div>
                  </>
                ) : (
                  <span className="text-4xl group-hover:scale-110 transition-transform">{DEAL_CATEGORY_EMOJI[draft.category] ?? "🏷️"}</span>
                )}
              </button>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Upload an image</p>
                <p>PNG or JPG · Max 5 MB</p>
                {displayImage && (
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
            <label className={lbl}>Brand / store name *</label>
            <Input value={draft.brand} onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))} placeholder="e.g. Uniqlo" />
          </div>

          {/* Title */}
          <div className={field}>
            <label className={lbl}>Deal title *</label>
            <Input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="e.g. 20% off all items" />
          </div>

          {/* Category */}
          <div className={field}>
            <label className={lbl}>Category *</label>
            <select className={sel} value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as Deal["category"] }))}>
              {DEAL_CATEGORIES.map((c) => <option key={c} value={c}>{DEAL_CATEGORY_EMOJI[c]} {c}</option>)}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Original price</label>
              <Input value={draft.originalPrice} onChange={(e) => setDraft((d) => ({ ...d, originalPrice: e.target.value }))} placeholder="e.g. ¥1,200" />
            </div>
            <div className={field}>
              <label className={lbl}>New price</label>
              <Input value={draft.newPrice} onChange={(e) => setDraft((d) => ({ ...d, newPrice: e.target.value }))} placeholder="e.g. ¥960" />
            </div>
          </div>

          {/* Sale end */}
          <div className={field}>
            <label className={lbl}>Sale ends (optional)</label>
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
                  onSelect={(val) => { setDraft((d) => ({ ...d, saleEnd: val ? format(val, "yyyy-MM-dd") : "" })); setSaleEndOpen(false); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className={field}>
            <label className={lbl}>Description</label>
            <Textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={4} placeholder="How to redeem, any conditions, etc." />
          </div>

          {/* Mode */}
          <div className={field}>
            <label className={lbl}>Available *</label>
            <select className={sel} value={draft.mode} onChange={(e) => setDraft((d) => ({ ...d, mode: e.target.value as Deal["mode"] }))}>
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Both">Both</option>
            </select>
          </div>

          {/* Student only */}
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 rounded" checked={draft.studentOnly} onChange={(e) => setDraft((d) => ({ ...d, studentOnly: e.target.checked }))} />
            <span>🎓 Student only</span>
          </label>

          {/* URL */}
          <div className={field}>
            <label className={lbl}>Link (optional)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://" className="pl-9" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button variant="outline" onClick={() => { setEditing(false); if (deal) setDraft(toDraft(deal)); setPendingImage(null); setImagePreview(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {displayImage && (
            <div className="rounded-2xl overflow-hidden h-64">
              <img src={displayImage} alt={deal.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <PageHeader
              eyebrow={deal.category}
              title={deal.title}
              subtitle={deal.brand}
            />
            <div className="flex items-center gap-2 mt-1 shrink-0">
              <SaveButton itemId={deal.id} itemType="deal" />
              <ShareButton title={deal.title} />
            </div>
          </div>

          <section className="card-base p-6 space-y-4">
            {(deal.originalPrice || deal.newPrice) && (
              <div className="flex items-center gap-3">
                {deal.newPrice && <span className="text-2xl font-bold text-primary">{deal.newPrice}</span>}
                {deal.originalPrice && <span className="text-base text-muted-foreground line-through">{deal.originalPrice}</span>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Detail label="Available" value={deal.mode} />
              <Detail label="Student only" value={deal.studentOnly ? "Yes 🎓" : "No"} />
              {deal.saleEnd && <Detail label="Sale ends" value={deal.saleEnd.match(/^\d{4}-\d{2}-\d{2}$/) ? new Date(deal.saleEnd + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : deal.saleEnd} />}
            </div>

            {deal.description && (
              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <p className="text-sm font-medium mb-1">About this deal</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deal.description}</p>
              </div>
            )}

            <SocialLinks links={deal.socialLinks} />

            {isAdmin && (
              <div className="flex gap-3 pt-2 border-t border-border">
                <Button onClick={() => setEditing(true)}>Edit</Button>
                <DeleteRecordButton label={deal.title} onDelete={() => deleteDeal(deal.id)} navigateTo="/discounts" />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
