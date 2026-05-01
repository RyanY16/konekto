"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagPicker from "@/components/TagPicker";
import { socialLinksFromForm } from "@/lib/social-links";
import { iconUrlFromForm } from "@/lib/file-utils";
import { addCircle } from "@/data/backend";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { CIRCLE_CATEGORIES, ACTIVITY_LEVELS, COMMITMENT_LEVELS, CATEGORY_EMOJI } from "@/data/profile-options";

export default function AddCircleDialog() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(CIRCLE_CATEGORIES[0]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");

    try {
      const iconUrl = await iconUrlFromForm(form);
      const cat = String(form.get("category") ?? "Tech");

      await addCircle({
        name: String(form.get("name") ?? "").trim(),
        category: cat,
        description: String(form.get("description") ?? "").trim(),
        activity: String(form.get("activity") ?? "Weekly") as "Daily" | "Weekly" | "Monthly" | "Occasionally",
        englishFriendly: form.get("englishFriendly") === "on",
        commitment: String(form.get("commitment") ?? "Casual") as "Casual" | "Regular" | "Serious",
        emoji: CATEGORY_EMOJI[cat] ?? "👥",
        iconUrl,
        socialLinks: socialLinksFromForm(form),
        tags: selectedTags,
        ownerId: user?.id ?? null,
      });
      await router.invalidate();
      setOpen(false);
      event.currentTarget.reset();
      setSelectedTags([]);
      setCategory(CIRCLE_CATEGORIES[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add circle.");
    } finally {
      setSaving(false);
    }
  };

  const field = "space-y-1";
  const lbl = "text-xs font-medium text-muted-foreground";
  const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" /> Add circle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add circle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={field}>
            <label className={lbl}>Circle name</label>
            <Input name="name" placeholder="e.g. Tokyo Tech Society" required />
          </div>

          <div className={field}>
            <label className={lbl}>Description</label>
            <Textarea name="description" placeholder="Short description of what the circle does" required />
          </div>

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
            <div className={field}>
              <label className={lbl}>Commitment</label>
              <select name="commitment" className={sel}>
                {COMMITMENT_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className={field}>
            <label className={lbl}>Upload icon</label>
            <Input name="icon" type="file" accept="image/*" />
          </div>

          <div className={field}>
            <label className={lbl}>Tags</label>
            <TagPicker value={selectedTags} onChange={setSelectedTags} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={field}>
              <label className={lbl}>Website</label>
              <Input name="website" placeholder="https://..." />
            </div>
            <div className={field}>
              <label className={lbl}>Instagram</label>
              <Input name="instagram" placeholder="@handle" />
            </div>
            <div className={field}>
              <label className={lbl}>LinkedIn</label>
              <Input name="linkedin" placeholder="URL" />
            </div>
            <div className={field}>
              <label className={lbl}>LINE</label>
              <Input name="line" placeholder="Invite link" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input name="englishFriendly" type="checkbox" className="h-4 w-4" />
            English-friendly
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add circle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
