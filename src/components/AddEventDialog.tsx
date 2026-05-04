"use client";

import { useState, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Globe, Instagram, Linkedin, MessageCircle, MapPin, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagPicker from "@/components/TagPicker";
import { socialLinksFromForm } from "@/lib/social-links";
import { addEvent } from "@/data/backend";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { LANGUAGES } from "@/data/profile-options";

const EVENT_CATEGORIES = ["Social", "Career", "Hackathon", "Networking"] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  Social: "🥂",
  Career: "💼",
  Hackathon: "⚡",
  Networking: "🚀",
};

function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export default function AddEventDialog() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function reset() {
    setSelectedTags([]);
    setCategory(EVENT_CATEGORIES[0]);
    setLocation("");
    setPrimaryLanguage("");
    setError("");
    formRef.current?.reset();
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");

    try {
      const cat = String(form.get("category") ?? EVENT_CATEGORIES[0]);

      await addEvent({
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim() || undefined,
        category: cat as (typeof EVENT_CATEGORIES)[number],
        date: String(form.get("date") ?? "").trim(),
        location,
        emoji: CATEGORY_EMOJI[cat] || "📅",
        tags: selectedTags,
        cost: String(form.get("cost") ?? "").trim() || undefined,
        primaryLanguage: primaryLanguage || undefined,
        socialLinks: socialLinksFromForm(form),
        ownerId: user?.id,
      });

      setOpen(false);
      reset();
      router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add event.");
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
          <Plus className="h-4 w-4" /> Add event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className={field}>
            <label className={lbl}>Title</label>
            <Input name="title" placeholder="e.g. Spring Networking Mixer" required />
          </div>

          {/* Description */}
          <div className={field}>
            <label className={lbl}>Description</label>
            <Textarea name="description" placeholder="What's this event about?" rows={4} />
          </div>

          {/* Category */}
          <div className={field}>
            <label className={lbl}>Category</label>
            <select
              name="category"
              className={sel}
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
              ))}
            </select>
          </div>

          {/* Date & time */}
          <div className={field}>
            <label className={lbl}>Date &amp; time</label>
            <Input name="date" placeholder="e.g. Fri, May 8 · 7:00 PM" required />
          </div>

          {/* Location with maps preview */}
          <div className={field}>
            <label className={lbl}>Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Tokyo Big Sight, Shibuya, Online"
                className="pl-9"
                required
              />
            </div>
            {location.trim() && (
              <a
                href={mapsUrl(location)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
              >
                <ExternalLink className="h-3 w-3" /> Preview on Google Maps
              </a>
            )}
          </div>

          {/* Cost */}
          <div className={field}>
            <label className={lbl}>Cost</label>
            <Input name="cost" placeholder="e.g. Free, ¥1,000, ¥500 at door" />
          </div>

          {/* Language */}
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Adding…" : "Add event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
