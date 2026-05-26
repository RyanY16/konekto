import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Globe, Ticket, MapPin, ExternalLink, CalendarIcon, CalendarPlus } from "lucide-react";
import { SmartFill, type SmartFillResult } from "@/components/SmartFill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import TagPicker from "@/components/TagPicker";
import { CIRCLE_TAG_GROUPS } from "@/data/tags";
import EventCircleCollabPicker from "@/components/EventCircleCollabPicker";
import { socialLinksFromForm } from "@/lib/social-links";
import { addEvent, setEventCircleCollaborations, getEventHandle } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { LANGUAGES } from "@/data/profile-options";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { PageHeader } from "@/components/PageHeader";
import { NativeSelect } from "@/components/ui/native-select";

const EVENT_CATEGORIES = ["Social", "Career", "Hackathon", "Workshop", "Casual"] as const;

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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseTimeStr(t: string): { h: number; m: number } {
  const match = t.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return { h: 19, m: 0 };
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
  return { h, m };
}

function buildStartDatetime(date: Date, timeStr: string): string {
  const { h, m } = parseTimeStr(timeStr);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function formatDateRange(range: DateRange | undefined, startTime: string, endTime: string, isRange: boolean): string {
  if (!range?.from) return "";
  const from = format(range.from, "EEE, MMM d");
  if (isRange && range.to && range.to.getTime() !== range.from.getTime()) {
    return `${from}–${format(range.to, "MMM d")} · ${startTime} – ${endTime}`;
  }
  return `${from} · ${startTime} – ${endTime}`;
}

function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export const Route = createFileRoute("/events_/new")({
  component: NewEventPage,
});

function NewEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [howToJoin, setHowToJoin] = useState("");
  const [lumaUrl, setLumaUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCircleIds, setSelectedCircleIds] = useState<string[]>([]);
  const [invitedCircleIds, setInvitedCircleIds] = useState<string[]>([]);
  const [category, setCategory] = useState<string>(EVENT_CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [primaryLanguage, setPrimaryLanguage] = useState("");
  const [online, setOnline] = useState(false);
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [isWeekly, setIsWeekly] = useState(false);
  const [recurringDay, setRecurringDay] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [startTime, setStartTime] = useState("7:00 PM");
  const [endTime, setEndTime] = useState("9:00 PM");
  const [multiDay, setMultiDay] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">You need to be signed in to add an event.</p>
        <Link to="/login" className="text-sm font-semibold text-primary hover:underline">Sign in</Link>
      </div>
    );
  }

  function isoToTimeStr(iso: string): string {
    // Convert ISO datetime → "H:MM AM/PM" matching TIME_OPTIONS format
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const h = d.getHours();
    const m = d.getMinutes();
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? "AM" : "PM";
    return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  function snapToTimeOption(timeStr: string): string {
    // Find the closest TIME_OPTIONS entry (rounded to nearest 30 min)
    if (!timeStr) return "";
    const match = TIME_OPTIONS.find((t) => t === timeStr);
    if (match) return match;
    // Parse and snap to nearest 30m slot
    const d = new Date(`1970-01-01T${timeStr}`);
    if (isNaN(d.getTime())) return timeStr;
    const snapped = new Date(d);
    snapped.setMinutes(d.getMinutes() < 15 ? 0 : d.getMinutes() < 45 ? 30 : 60, 0, 0);
    return isoToTimeStr(snapped.toISOString());
  }

  function handleSmartFill(data: SmartFillResult, sourceUrl: string) {
    if (data.title) setTitle(data.title);
    if (data.description) setDescription(data.description);
    if (data.cost) setCost(data.cost);
    if (data.howToJoin) setHowToJoin(data.howToJoin);
    if (data.website) setWebsiteUrl(data.website);
    if (data.location) setLocation(data.location);
    if (data.online != null) setOnline(data.online);
    if (data.primaryLanguage) {
      const match = LANGUAGES.find((l) => l.name.toLowerCase() === data.primaryLanguage!.toLowerCase());
      if (match) setPrimaryLanguage(match.name);
    }
    if (data.category && EVENT_CATEGORIES.includes(data.category as any)) setCategory(data.category);
    if (data.tags && data.tags.length > 0) setSelectedTags((prev) => [...new Set([...prev, ...data.tags!])]);

    // Luma link: prefer extracted value, fall back to source URL if it's a lu.ma link
    const lumaLink = data.luma || (/lu\.ma\//i.test(sourceUrl) ? sourceUrl : null);
    if (lumaLink) setLumaUrl(lumaLink);

    // Date/time from ISO strings (e.g. Luma JSON-LD)
    let startD: Date | null = null;
    let endD: Date | null = null;
    if (data.startDate) {
      const d = new Date(data.startDate);
      if (!isNaN(d.getTime())) {
        startD = d;
        const t = snapToTimeOption(isoToTimeStr(data.startDate));
        if (t) setStartTime(t);
      }
    }
    if (data.endDate) {
      const d = new Date(data.endDate);
      if (!isNaN(d.getTime())) {
        endD = d;
        const t = snapToTimeOption(isoToTimeStr(data.endDate));
        if (t) setEndTime(t);
      }
    }
    if (startD) {
      // If end is on a different calendar day, enable multi-day range
      const crossDay = endD && endD.toDateString() !== startD.toDateString();
      if (crossDay) {
        setMultiDay(true);
        setDateRange({ from: startD, to: endD! });
      } else {
        setDateRange({ from: startD, to: startD });
      }
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const cat = category;

      let dateStr: string;
      let startDateIso: string | undefined;

      if (isWeekly) {
        dateStr = `Every ${DAY_NAMES[recurringDay]} · ${startTime} – ${endTime}`;
        const { h, m } = parseTimeStr(startTime);
        const d = new Date();
        const daysUntil = (recurringDay - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + (daysUntil === 0 ? 7 : daysUntil));
        d.setHours(h, m, 0, 0);
        startDateIso = d.toISOString();
      } else {
        dateStr = formatDateRange(dateRange, startTime, endTime, multiDay);
        if (!dateStr) {
          setError("Please select a date.");
          setSaving(false);
          return;
        }
        startDateIso = dateRange?.from ? buildStartDatetime(dateRange.from, startTime) : undefined;
      }

      const trimmedTitle = title.trim();
      const eventId = await addEvent({
        title: trimmedTitle,
        description: description.trim() || undefined,
        category: cat as (typeof EVENT_CATEGORIES)[number],
        date: dateStr,
        location,
        emoji: CATEGORY_EMOJI[cat] || "📅",
        tags: selectedTags,
        cost: cost.trim() || undefined,
        primaryLanguage: primaryLanguage || undefined,
        socialLinks: { luma: lumaUrl.trim() || undefined, website: websiteUrl.trim() || undefined },
        ownerId: user.id,
        circleIds: selectedCircleIds,
        online,
        approvalRequired,
        startDate: startDateIso,
        recurrence: isWeekly ? "weekly" : undefined,
        howToJoin: howToJoin.trim() || undefined,
      } as any);

      if (selectedCircleIds.length > 0 || invitedCircleIds.length > 0) {
        await setEventCircleCollaborations({
          eventId,
          eventTitle: trimmedTitle,
          eventOwnerId: user.id,
          requesterId: user.id,
          approvedCircleIds: selectedCircleIds,
          invitedCircleIds,
        });
      }

      const handle = getEventHandle({ id: eventId, title: trimmedTitle });
      navigate({ to: "/events/$eventHandle", params: { eventHandle: handle } });
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
    <div>
      <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to events
      </Link>
      <PageHeader eyebrow="Events" title="Add an event" />

      <div className="max-w-2xl space-y-5">
        <SmartFill type="event" onFill={handleSmartFill} />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className={field}>
            <label className={lbl}>Title {req}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spring Networking Mixer" required />
          </div>

          {/* Description */}
          <div className={field}>
            <label className={lbl}>Description {opt}</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this event about?" rows={4} />
          </div>

          {/* Category */}
          <div className={field}>
            <label className={lbl}>Category {req}</label>
            <NativeSelect name="category" required value={category} onChange={(e) => setCategory(e.target.value)}>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
              ))}
            </NativeSelect>
          </div>

          {/* Recurrence */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isWeekly}
                onChange={(e) => setIsWeekly(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-sm font-medium">Repeats weekly</span>
            </label>
            {isWeekly && (
              <div className="pl-6">
                <NativeSelect value={recurringDay} onChange={(e) => setRecurringDay(Number(e.target.value))}>
                  {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </NativeSelect>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className={field}>
            <label className={lbl}>Date &amp; Time {isWeekly ? opt : req}</label>

            {!isWeekly && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    id="new-multiday"
                    type="checkbox"
                    checked={multiDay}
                    onChange={(e) => {
                      setMultiDay(e.target.checked);
                      if (!e.target.checked) setDateRange((r) => r ? { from: r.from, to: undefined } : undefined);
                    }}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <label htmlFor="new-multiday" className="text-sm font-medium cursor-pointer select-none">Multi-day event</label>
                </div>

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
              </>
            )}

            <div className="flex gap-2 mt-2">
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">Start Time</span>
                <NativeSelect value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </NativeSelect>
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground">End Time</span>
                <NativeSelect value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </NativeSelect>
              </div>
            </div>
          </div>

          {/* Online + approval */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <input id="new-online" type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
              <label htmlFor="new-online" className="text-sm font-medium cursor-pointer select-none">Online event</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="new-approval" type="checkbox" checked={approvalRequired} onChange={(e) => setApprovalRequired(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
              <label htmlFor="new-approval" className="text-sm font-medium cursor-pointer select-none">Approval required</label>
            </div>
          </div>

          {/* Location */}
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
              <a href={mapsUrl(location)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5">
                <ExternalLink className="h-3 w-3" /> Preview on Google Maps
              </a>
            )}
          </div>

          {/* Cost */}
          <div className={field}>
            <label className={lbl}>Cost {opt}</label>
            <Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="e.g. Free, ¥1,000, ¥500 at door" />
          </div>

          {/* Language */}
          <div className={field}>
            <label className={lbl}>Primary language {opt}</label>
            <NativeSelect value={primaryLanguage} onChange={(e) => setPrimaryLanguage(e.target.value)}>
              <option value="">— Select language —</option>
              {LANGUAGES.map((l) => <option key={l.name} value={l.name}>{l.flag} {l.name}</option>)}
            </NativeSelect>
          </div>

          {/* Tags */}
          <div className={field}>
            <label className={lbl}>Tags {opt}</label>
            <TagPicker value={selectedTags} onChange={setSelectedTags} groups={CIRCLE_TAG_GROUPS} />
          </div>

          {/* Circles */}
          <div className={field}>
            <EventCircleCollabPicker
              myCircleIds={selectedCircleIds}
              invitedCircleIds={invitedCircleIds}
              onMyCircleIdsChange={setSelectedCircleIds}
              onInvitedCircleIdsChange={setInvitedCircleIds}
              userId={user.id}
            />
          </div>

          {/* How to join */}
          <div className={field}>
            <label className={lbl}>How to join {opt}</label>
            <Textarea value={howToJoin} onChange={(e) => setHowToJoin(e.target.value)} placeholder="Describe how to register or attend — e.g. RSVP via the link below, walk-ins welcome, tickets at the door…" rows={3} />
          </div>

          {/* Event links */}
          <div className={field}>
            <label className={lbl}>Event links {opt}</label>
            <div className="space-y-2">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" className="pl-9" />
              </div>
              <div className="relative">
                <CalendarPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input value={lumaUrl} onChange={(e) => setLumaUrl(e.target.value)} placeholder="https://lu.ma/your-event" className="pl-9" />
              </div>
              <div className="relative">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input placeholder="Registration or ticket link" className="pl-9" />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add event"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/events" })}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
