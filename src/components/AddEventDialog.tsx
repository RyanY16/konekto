"use client";

import { useState, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Globe, Instagram, Linkedin, MessageCircle, MapPin, ExternalLink, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import TagPicker from "@/components/TagPicker";
import CirclePicker from "@/components/CirclePicker";
import { socialLinksFromForm } from "@/lib/social-links";
import { addEvent } from "@/data/backend";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { LANGUAGES } from "@/data/profile-options";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

const EVENT_CATEGORIES = ["Social", "Career", "Hackathon", "Networking"] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  Social: "🥂",
  Career: "💼",
  Hackathon: "⚡",
  Networking: "🚀",
};

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "AM" : "PM";
    TIME_OPTIONS.push(`${hour12}:${String(m).padStart(2, "0")} ${ampm}`);
  }
}

function formatDateRange(range: DateRange | undefined, startTime: string, endTime: string, isRange: boolean): string {
  if (!range?.from) return "";
  const from = format(range.from, "EEE, MMM d");
  if (isRange && range.to && range.to.getTime() !== range.from.getTime()) {
    const to = format(range.to, "MMM d");
    return `${from}–${to} · ${startTime} – ${endTime}`;
  }
  return `${from} · ${startTime} – ${endTime}`;
}

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
  const [selectedCircleIds, setSelectedCircleIds] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const [online, setOnline] = useState(false);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [startTime, setStartTime] = useState("7:00 PM");
  const [endTime, setEndTime] = useState("9:00 PM");
  const [multiDay, setMultiDay] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function reset() {
    setSelectedTags([]);
    setSelectedCircleIds([]);
    setCategory(EVENT_CATEGORIES[0]);
    setLocation("");
    setPrimaryLanguage("");
    setOnline(false);
    setApprovalRequired(false);
    setDateRange(undefined);
    setStartTime("7:00 PM");
    setEndTime("9:00 PM");
    setMultiDay(false);
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

      const dateStr = formatDateRange(dateRange, startTime, endTime, multiDay);
      if (!dateStr) {
        setError("Please select a date.");
        setSaving(false);
        return;
      }

      await addEvent({
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim() || undefined,
        category: cat as (typeof EVENT_CATEGORIES)[number],
        date: dateStr,
        location,
        emoji: CATEGORY_EMOJI[cat] || "📅",
        tags: selectedTags,
        cost: String(form.get("cost") ?? "").trim() || undefined,
        primaryLanguage: primaryLanguage || undefined,
        socialLinks: socialLinksFromForm(form),
        ownerId: user?.id,
        circleIds: selectedCircleIds,
        online,
        approvalRequired,
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
  const req = <span className="text-destructive ml-0.5">*</span>;
  const opt = <span className="font-normal text-muted-foreground/60 ml-1">(optional)</span>;

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
            <label className={lbl}>Title {req}</label>
            <Input name="title" placeholder="e.g. Spring Networking Mixer" required />
          </div>

          {/* Description */}
          <div className={field}>
            <label className={lbl}>Description {opt}</label>
            <Textarea name="description" placeholder="What's this event about?" rows={4} />
          </div>

          {/* Category */}
          <div className={field}>
            <label className={lbl}>Category {req}</label>
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

          {/* Date & Time */}
          <div className={field}>
            <label className={lbl}>Date &amp; Time {req}</label>

            {/* Multi-day toggle */}
            <div className="flex items-center gap-2 mb-1">
              <input
                id="add-multiday"
                type="checkbox"
                checked={multiDay}
                onChange={(e) => {
                  setMultiDay(e.target.checked);
                  if (!e.target.checked) setDateRange((r) => r ? { from: r.from, to: undefined } : undefined);
                }}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label htmlFor="add-multiday" className="text-sm font-medium cursor-pointer select-none">
                Multi-day event
              </label>
            </div>

            {/* Date picker */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-left flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className={dateRange?.from ? "" : "text-muted-foreground"}>
                    {dateRange?.from
                      ? multiDay && dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()
                        ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
                        : format(dateRange.from, "EEE, MMM d, yyyy")
                      : "Select date…"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {multiDay ? (
                  <>
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(val: DateRange | undefined) => setDateRange(val)}
                      disabled={{ before: new Date() }}
                      initialFocus
                    />
                    <div className="p-2 border-t flex justify-end">
                      <Button size="sm" type="button" onClick={() => setDatePickerOpen(false)}>Done</Button>
                    </div>
                  </>
                ) : (
                  <Calendar
                    mode="single"
                    selected={dateRange?.from}
                    onSelect={(val: Date | undefined) => {
                      setDateRange(val ? { from: val, to: undefined } : undefined);
                      setDatePickerOpen(false);
                    }}
                    disabled={{ before: new Date() }}
                    initialFocus
                  />
                )}
              </PopoverContent>
            </Popover>

            {/* Time selects */}
            <div className="flex gap-2 mt-2">
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">Start Time</span>
                <select
                  className={sel}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">End Time</span>
                <select
                  className={sel}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Online + approval checkboxes */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <input
                id="add-online"
                type="checkbox"
                checked={online}
                onChange={(e) => setOnline(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label htmlFor="add-online" className="text-sm font-medium cursor-pointer select-none">
                Online event
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="add-approval"
                type="checkbox"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <label htmlFor="add-approval" className="text-sm font-medium cursor-pointer select-none">
                Approval required
              </label>
            </div>
          </div>

          {/* Location with maps preview */}
          <div className={field}>
            <label className={lbl}>{online ? "Platform / link" : "Location"} {req}</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={online ? "e.g. Zoom, Discord, Google Meet" : "e.g. Tokyo Big Sight, Shibuya"}
                className="pl-9"
                required
              />
            </div>
            {!online && location.trim() && (
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
            <label className={lbl}>Cost {opt}</label>
            <Input name="cost" placeholder="e.g. Free, ¥1,000, ¥500 at door" />
          </div>

          {/* Language */}
          <div className={field}>
            <label className={lbl}>Primary language {opt}</label>
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
            <label className={lbl}>Tags {opt}</label>
            <TagPicker value={selectedTags} onChange={setSelectedTags} />
          </div>

          {/* Circles */}
          {user && (
            <div className={field}>
              <label className={lbl}>Associated circles {opt}</label>
              <CirclePicker
                value={selectedCircleIds}
                onChange={setSelectedCircleIds}
                userId={user.id}
              />
            </div>
          )}

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
