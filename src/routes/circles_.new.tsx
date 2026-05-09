import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type FormEvent } from "react";
import { Globe, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagPicker from "@/components/TagPicker";
import { socialLinksFromForm } from "@/lib/social-links";
import { addCircle, uploadCircleIcon, getCircleHandle } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { CIRCLE_CATEGORIES, CATEGORY_EMOJI, LANGUAGES, COUNTRIES } from "@/data/profile-options";
import { CIRCLE_TAG_GROUPS } from "@/data/tags";
import { UniversityPicker } from "@/components/UniversityPicker";
import EmojiPicker from "@/components/EmojiPicker";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/circles_/new")({
  component: NewCirclePage,
});

function NewCirclePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(CIRCLE_CATEGORIES[0]);
  const [emoji, setEmoji] = useState<string>(CATEGORY_EMOJI[CIRCLE_CATEGORIES[0]] ?? "👥");
  const [university, setUniversity] = useState("");
  const [country, setCountry] = useState("Japan");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const [recruiting, setRecruiting] = useState(false);
  const [pendingIcon, setPendingIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">You need to be signed in to add a circle.</p>
        <Link to="/login" className="text-sm font-semibold text-primary hover:underline">Sign in</Link>
      </div>
    );
  }

  function handleIconFile(file: File) {
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setPendingIcon(file);
    setIconPreview(URL.createObjectURL(file));
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

      const name = String(form.get("name") ?? "").trim();
      await addCircle({
        id: circleId,
        name,
        category: cat,
        description: String(form.get("description") ?? "").trim(),
        activity: "Weekly" as "Daily" | "Weekly" | "Monthly" | "Occasionally",
        englishFriendly: form.get("englishFriendly") === "on",
        emoji,
        university: university.trim() || undefined,
        country: country || "Japan",
        primaryLanguage: primaryLanguage || undefined,
        recruiting,
        recruitingPeriod: recruiting ? String(form.get("recruitingPeriod") ?? "").trim() || undefined : undefined,
        recruitingConditions: recruiting ? String(form.get("recruitingConditions") ?? "").trim() || undefined : undefined,
        membershipFee: String(form.get("membershipFee") ?? "").trim() || undefined,
        howToJoin: String(form.get("howToJoin") ?? "").trim() || undefined,
        socialLinks: socialLinksFromForm(form),
        tags: selectedTags,
        ownerId: user.id,
        iconUrl,
      });

      const handle = getCircleHandle({ id: circleId, name });
      await navigate({ to: "/circles/$circleHandle" as any, params: { circleHandle: handle } as any });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add circle.");
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
      <Link to="/circles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to circles
      </Link>
      <PageHeader eyebrow="Circles" title="Add a circle" />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Icon upload */}
          <div className={field}>
            <label className={lbl}>Circle icon {opt}</label>
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

          {/* Name + Emoji */}
          <div className={field}>
            <label className={lbl}>Circle name {req}</label>
            <div className="flex gap-2">
              <EmojiPicker value={emoji} onChange={setEmoji} />
              <Input name="name" placeholder="e.g. Tokyo Tech Society" required className="flex-1" />
            </div>
          </div>

          {/* Description */}
          <div className={field}>
            <label className={lbl}>Description {req}</label>
            <Textarea name="description" placeholder="What does this circle do?" rows={6} required />
          </div>

          {/* University */}
          <div className={field}>
            <label className={lbl}>University {opt}</label>
            <UniversityPicker value={university} onChange={setUniversity} extraOptions={["Online", "No university"]} />
          </div>

          {/* Country */}
          <div className={field}>
            <label className={lbl}>Country {req}</label>
            <select className={sel} value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Primary language */}
          <div className={field}>
            <label className={lbl}>Primary language {opt}</label>
            <select className={sel} value={primaryLanguage} onChange={(e) => setPrimaryLanguage(e.target.value)}>
              <option value="">— Select language —</option>
              {LANGUAGES.map((l) => <option key={l.name} value={l.name}>{l.flag} {l.name}</option>)}
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
                  <label className={lbl}>Recruiting period {opt}</label>
                  <Input name="recruitingPeriod" placeholder="e.g. April – June 2025" />
                </div>
                <div className={field}>
                  <label className={lbl}>Conditions / requirements {opt}</label>
                  <Textarea name="recruitingConditions" placeholder="Any requirements to join?" rows={2} />
                </div>
                <div className={field}>
                  <label className={lbl}>Membership fee {opt}</label>
                  <Input name="membershipFee" placeholder="e.g. Free, ¥3,000/year, ¥500/month" />
                </div>
                <div className={field}>
                  <label className={lbl}>How to join {opt}</label>
                  <Textarea name="howToJoin" placeholder="e.g. Fill out the form on our website, attend an open meeting, DM us on Instagram…" rows={3} />
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div className={field}>
            <label className={lbl}>Category {req}</label>
            <select
              name="category"
              className={sel}
              required
              value={category}
              onChange={(e) => { setCategory(e.target.value); setEmoji(CATEGORY_EMOJI[e.target.value] ?? "👥"); }}
            >
              {CIRCLE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div className={field}>
            <label className={lbl}>Tags {opt}</label>
            <TagPicker value={selectedTags} onChange={setSelectedTags} groups={CIRCLE_TAG_GROUPS} />
          </div>

          {/* Social links */}
          <div className={field}>
            <label className={lbl}>Social links {opt}</label>
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

          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input name="englishFriendly" type="checkbox" className="h-4 w-4 rounded" />
            <span>🌏 English-friendly</span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add circle"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/circles" })}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
