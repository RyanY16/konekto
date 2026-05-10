import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { Globe, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addDeal, getDealHandle, uploadDealImage } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { DEAL_CATEGORIES } from "@/data/profile-options";
import EmojiPicker from "@/components/EmojiPicker";
import { PageHeader } from "@/components/PageHeader";
import type { Deal } from "@/data/mock";

export const Route = createFileRoute("/discounts_/new")({
  component: NewDiscountPage,
});

function NewDiscountPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [emoji, setEmoji] = useState("🏷️");
  const [studentOnly, setStudentOnly] = useState(true);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");

    try {
      const dealId = `deal-${crypto.randomUUID()}`;

      let imageUrl: string | undefined;
      if (pendingImage) {
        imageUrl = await uploadDealImage(dealId, pendingImage);
      }

      const deal = await addDeal({
        brand: String(form.get("brand") ?? "").trim(),
        title: String(form.get("title") ?? "").trim(),
        category: String(form.get("category") ?? DEAL_CATEGORIES[0]) as Deal["category"],
        originalPrice: String(form.get("originalPrice") ?? "").trim() || undefined,
        newPrice: String(form.get("newPrice") ?? "").trim() || undefined,
        saleEnd: String(form.get("saleEnd") ?? "").trim() || undefined,
        description: String(form.get("description") ?? "").trim() || undefined,
        studentOnly,
        mode: String(form.get("mode") ?? "In-Person") as Deal["mode"],
        imageUrl,
        emoji,
        socialLinks: {
          website: String(form.get("website") ?? "").trim() || undefined,
          instagram: String(form.get("instagram") ?? "").trim() || undefined,
          linkedin: String(form.get("linkedin") ?? "").trim() || undefined,
          line: String(form.get("line") ?? "").trim() || undefined,
        },
      });

      const handle = getDealHandle(deal ?? { id: dealId, title: String(form.get("title") ?? "") });
      await navigate({ to: "/discounts/$dealHandle" as any, params: { dealHandle: handle } as any });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add deal.");
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

          {/* Brand + Emoji */}
          <div className={field}>
            <label className={lbl}>Brand / store name {req}</label>
            <div className="flex gap-2">
              <EmojiPicker value={emoji} onChange={setEmoji} />
              <Input name="brand" placeholder="e.g. Uniqlo" required className="flex-1" />
            </div>
          </div>

          {/* Title */}
          <div className={field}>
            <label className={lbl}>Deal title {req}</label>
            <Input name="title" placeholder="e.g. 20% off all items with student ID" required />
          </div>

          {/* Category */}
          <div className={field}>
            <label className={lbl}>Category {req}</label>
            <select name="category" className={sel} required>
              {DEAL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Original price {opt}</label>
              <Input name="originalPrice" placeholder="e.g. ¥1,200" />
            </div>
            <div className={field}>
              <label className={lbl}>New price {opt}</label>
              <Input name="newPrice" placeholder="e.g. ¥960" />
            </div>
          </div>

          {/* Sale end */}
          <div className={field}>
            <label className={lbl}>Sale ends {opt}</label>
            <Input name="saleEnd" placeholder="e.g. June 30, 2026" />
          </div>

          {/* Description */}
          <div className={field}>
            <label className={lbl}>Description {opt}</label>
            <Textarea name="description" placeholder="How to redeem, any conditions, etc." rows={4} />
          </div>

          {/* Mode */}
          <div className={field}>
            <label className={lbl}>Available {req}</label>
            <select name="mode" className={sel} required>
              <option value="In-Person">In-Person</option>
              <option value="Online">Online</option>
              <option value="Both">Both (Online & In-Person)</option>
            </select>
          </div>

          {/* Student only */}
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 rounded" checked={studentOnly} onChange={(e) => setStudentOnly(e.target.checked)} />
            <span>🎓 Student only</span>
          </label>

          {/* Social links */}
          <div className={field}>
            <label className={lbl}>Links {opt}</label>
            <div className="space-y-2">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input name="website" placeholder="https://yoursite.com" className="pl-9" />
              </div>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                <Input name="instagram" placeholder="handle" className="pl-14" />
              </div>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input name="linkedin" placeholder="linkedin.com/in/yourprofile" className="pl-9" />
              </div>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                <Input name="line" placeholder="LINE ID" className="pl-14" />
              </div>
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
