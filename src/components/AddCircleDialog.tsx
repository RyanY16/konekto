"use client";

import { useState, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Globe, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagPicker from "@/components/TagPicker";
import { socialLinksFromForm } from "@/lib/social-links";
import { addCircle, uploadCircleIcon } from "@/data/backend";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { CIRCLE_CATEGORIES, ACTIVITY_LEVELS, CATEGORY_EMOJI, LANGUAGES } from "@/data/profile-options";
import { UniversityPicker } from "@/components/UniversityPicker";

export default function AddCircleDialog() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(CIRCLE_CATEGORIES[0]);
  const [university, setUniversity] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const [recruiting, setRecruiting] = useState(false);
  const [pendingIcon, setPendingIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleIconFile(file: File) {
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setPendingIcon(file);
    setIconPreview(URL.createObjectURL(file));
  }

  function reset() {
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setPendingIcon(null);
    setIconPreview(null);
    setSelectedTags([]);
    setCategory(CIRCLE_CATEGORIES[0]);
    setUniversity("");
    setPrimaryLanguage("");
    setRecruiting(false);
    setError("");
    formRef.current?.reset();
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");

    try {
      const cat = String(form.get("category") ?? CIRCLE_CATEGORIES[0]);
      const circleId = `circle-${crypto.randomUUID()}`;

      let iconUrl: string | undefined;
      if (pendingIcon) {
        iconUrl = await uploadCircleIcon(circleId, pendingIcon);
      }

      await addCircle({
        id: circleId,
        name: String(form.get("name") ?? "").trim(),
        category: cat,
        description: String(form.get("description") ?? "").trim(),
        activity: String(form.get("activity") ?? "Weekly") as "Daily" | "Weekly" | "Monthly" | "Occasionally",
        englishFriendly: form.get("englishFriendly") === "on",
        emoji: CATEGORY_EMOJI[cat] ?? "👥",
        university: university.trim() || undefined,
        primaryLanguage: primaryLanguage || undefined,
        recruiting,
        recruitingPeriod: recruiting ? String(form.get("recruitingPeriod") ?? "").trim() || undefined : undefined,
        recruitingConditions: recruiting ? String(form.get("recruitingConditions") ?? "").trim() || undefined : undefined,
        socialLinks: socialLinksFromForm(form),
        tags: selectedTags,
        ownerId: user?.id ?? null,
        iconUrl,
      });

      await router.invalidate();
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add circle.");
    } finally {
      setSaving(false);
    }
  };

  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const lbl = "text-xs font-medium text-muted-foreground";
  const field = "space-y-1.5";

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" /> Add circle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add circle</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {/* Icon upload */}
          <div className={field}>
            <label className={lbl}>Circle icon</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-muted shrink-0"
              >
                {iconPreview ? (
                  <>
                    <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xl">📷</span>
                    </div>
                  </>
                ) : (
                  <span className="text-3xl group-hover:scale-110 transition-transform">
                    {CATEGORY_EMOJI[category] ?? "📷"}
                  </span>
                )}
              </button>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Upload an icon</p>
                <p>PNG or JPG · Max 2 MB</p>
                {iconPreview && (
                  <button
                    type="button"
                    className="text-destructive hover:underline"
                    onClick={() => { if (iconPreview) URL.revokeObjectURL(iconPreview); setPendingIcon(null); setIconPreview(null); }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleIconFile(f); e.target.value = ""; }}
            />
          </div>

          {/* Name */}
          <div className={field}>
            <label className={lbl}>Circle name</label>
            <Input name="name" placeholder="e.g. Tokyo Tech Society" required />
          </div>

          {/* Description */}
          <div className={field}>
            <label className={lbl}>Description</label>
            <Textarea name="description" placeholder="What does this circle do?" rows={6} required />
          </div>

          {/* University */}
          <div className={field}>
            <label className={lbl}>University</label>
            <UniversityPicker
              value={university}
              onChange={setUniversity}
              extraOptions={["Online", "No university"]}
            />
          </div>

          {/* Primary language */}
          <div className={field}>
            <label className={lbl}>Primary language</label>
            <select
              className={sel}
              value={primaryLanguage}
              onChange={(e) => setPrimaryLanguage(e.target.value)}
            >
              <option value="">— Select language —</option>
              {LANGUAGES.map((l) => (
                <option key={l.name} value={l.name}>{l.flag} {l.name}</option>
              ))}
            </select>
          </div>

          {/* Recruiting */}
          <div className={field}>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                checked={recruiting}
                onChange={(e) => setRecruiting(e.target.checked)}
              />
              <span>Currently recruiting</span>
            </label>
            {recruiting && (
              <div className="mt-2 space-y-2 pl-6">
                <div className={field}>
                  <label className={lbl}>Recruiting period</label>
                  <Input name="recruitingPeriod" placeholder="e.g. April – June 2025" />
                </div>
                <div className={field}>
                  <label className={lbl}>Conditions / requirements</label>
                  <Textarea name="recruitingConditions" placeholder="Any requirements to join?" rows={2} />
                </div>
              </div>
            )}
          </div>

          {/* Category / Activity */}
          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Category</label>
              <select
                name="category"
                className={sel}
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CIRCLE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
              </select>
            </div>
            <div className={field}>
              <label className={lbl}>Activity</label>
              <select name="activity" className={sel}>
                {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className={field}>
            <label className={lbl}>Tags</label>
            <TagPicker value={selectedTags} onChange={setSelectedTags} />
          </div>

          {/* Social links */}
          <div className={field}>
            <label className={lbl}>Social links</label>
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

          {/* English-friendly */}
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input name="englishFriendly" type="checkbox" className="h-4 w-4 rounded" />
            <span>🌏 English-friendly</span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Adding…" : "Add circle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
