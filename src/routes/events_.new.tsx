import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { Globe, Ticket, MapPin, ExternalLink, CalendarIcon, CalendarPlus, ImageIcon, ImagePlus, Link2, Trash2 } from "lucide-react";
import { SmartFill, type SmartFillResult } from "@/components/SmartFill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import TagPicker from "@/components/TagPicker";
import { CIRCLE_TAG_GROUPS, filterValidTags, inferRelevantTags } from "@/data/tags";
import EventCircleCollabPicker from "@/components/EventCircleCollabPicker";
import { isLumaUrl } from "@/lib/social-links";
import { addEvent, setEventCircleCollaborations, getEventHandle, uploadEventImage } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { CATEGORY_EMOJI, EVENT_CATEGORIES, LANGUAGES } from "@/data/profile-options";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { NativeSelect } from "@/components/ui/native-select";

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

function buildDatetime(date: Date, timeStr: string): Date {
  const { h, m } = parseTimeStr(timeStr);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatDateTimeRange(start: Date | undefined, startTime: string, end: Date | undefined, endTime: string): string {
  if (!start || !end) return "";
  if (start.toDateString() === end.toDateString()) {
    return `${format(start, "EEE, MMM d")} · ${startTime} – ${endTime}`;
  }
  return `${format(start, "EEE, MMM d")} · ${startTime} – ${format(end, "EEE, MMM d")} · ${endTime}`;
}

function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export const Route = createFileRoute("/events_/new")({
  component: NewEventPage,
});

function NewEventPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [howToJoin, setHowToJoin] = useState("");
  const [lumaUrl, setLumaUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLinkOpen, setImageLinkOpen] = useState(false);
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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("7:00 PM");
  const [endTime, setEndTime] = useState("9:00 PM");
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateDisabled = isAdmin ? undefined : { before: new Date() };

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
    setTitle(data.title ?? "");
    setDescription(data.description ?? "");
    setCost(data.cost ?? "");
    setHowToJoin(data.howToJoin ?? "");
    const lumaLink = data.luma || (isLumaUrl(data.website) ? data.website : null) || (isLumaUrl(sourceUrl) ? sourceUrl : null);
    setLumaUrl(lumaLink ?? "");
    setWebsiteUrl(data.website && data.website !== lumaLink ? data.website : (!lumaLink ? sourceUrl : ""));
    setLocation(data.location ?? "");
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setPendingImage(null);
    setImagePreview(null);
    setImageUrl(data.imageUrl ?? "");
    setImageLinkOpen(false);
    setOnline(data.online ?? false);
    if (data.primaryLanguage) {
      const match = LANGUAGES.find((l) => l.name.toLowerCase() === data.primaryLanguage!.toLowerCase());
      setPrimaryLanguage(match?.name ?? "");
    } else {
      setPrimaryLanguage("");
    }
    setCategory(data.category && EVENT_CATEGORIES.includes(data.category as any) ? data.category : EVENT_CATEGORIES[0]);
    const validTags = inferRelevantTags({
      tags: data.tags,
      text: [data.title, data.description, data.category, data.location],
      limit: 4,
    });
    setSelectedTags(filterValidTags(validTags));
    setApprovalRequired(false);
    setIsWeekly(false);

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
      setStartDate(startD);
      setEndDate(endD && endD > startD ? endD : startD);
    } else {
      setStartDate(undefined);
      setEndDate(undefined);
      setStartTime("7:00 PM");
      setEndTime("9:00 PM");
    }
  }

  function handleImageFile(file: File) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setPendingImage(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl("");
    setImageLinkOpen(false);
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
        dateStr = formatDateTimeRange(startDate, startTime, endDate, endTime);
        if (!dateStr) {
          setError("Please select a start and end date.");
          setSaving(false);
          return;
        }
        const startDateTime = buildDatetime(startDate!, startTime);
        const endDateTime = buildDatetime(endDate!, endTime);
        if (endDateTime <= startDateTime) {
          setError("End date/time must be after the start date/time.");
          setSaving(false);
          return;
        }
        startDateIso = startDateTime.toISOString();
      }

      const trimmedTitle = title.trim();
      const eventIdForCreate = `event-${crypto.randomUUID()}`;
      let finalImageUrl = imageUrl.trim() || undefined;
      if (pendingImage) {
        finalImageUrl = await uploadEventImage(eventIdForCreate, pendingImage);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setPendingImage(null);
        setImagePreview(null);
      }
      const eventId = await addEvent({
        id: eventIdForCreate,
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
        imageUrl: finalImageUrl,
        isAdmin,
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

      if (isAdmin) {
        const handle = getEventHandle({ id: eventId, title: trimmedTitle });
        navigate({ to: "/events/$eventHandle", params: { eventHandle: handle } });
      } else {
        setPendingId(eventId);
      }
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
  const displayImage = imagePreview ?? imageUrl.trim();

  if (pendingId) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-4">
        <div className="text-4xl">⏳</div>
        <h2 className="text-xl font-bold">Your event is pending review</h2>
        <p className="text-muted-foreground text-sm">
          Your submission is awaiting admin verification — this usually takes up to 24 hours.
          You'll get a notification once it's approved.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/events" className="text-sm text-primary font-medium hover:underline">
            Back to events
          </Link>
        </div>
      </div>
    );
  }

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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Start</span>
                  <Popover open={startDatePickerOpen} onOpenChange={setStartDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-left flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className={startDate ? "" : "text-muted-foreground"}>
                          {startDate ? format(startDate, "EEE, MMM d, yyyy") : "Start date…"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(val: Date | undefined) => {
                          setStartDate(val);
                          if (val && (!endDate || endDate < val)) setEndDate(val);
                          setStartDatePickerOpen(false);
                        }}
                        disabled={dateDisabled}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <NativeSelect value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </NativeSelect>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">End</span>
                  <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-left flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className={endDate ? "" : "text-muted-foreground"}>
                          {endDate ? format(endDate, "EEE, MMM d, yyyy") : "End date…"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(val: Date | undefined) => {
                          setEndDate(val);
                          setEndDatePickerOpen(false);
                        }}
                        disabled={startDate ? { before: startDate } : dateDisabled}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <NativeSelect value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </NativeSelect>
                </div>
              </div>
            )}

            {isWeekly && (
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
            )}
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

          <div className={field}>
            <label className={lbl}>Event image {opt}</label>
            <div className="flex items-center gap-4">
              <div className="h-32 w-32 shrink-0 rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center bg-muted">
                {displayImage
                  ? <img src={displayImage} alt="Event preview" className="h-full w-full object-cover" />
                  : <span className="text-3xl">{CATEGORY_EMOJI[category] || "📅"}</span>
                }
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Choose the image shown for this event</p>
                <p className="text-xs">PNG, JPG · Max 5 MB</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" size="sm" className="w-8 px-0 sm:w-auto sm:px-3" aria-label="New pic" title="New pic" onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">New pic</span>
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="w-8 px-0 sm:w-auto sm:px-3" aria-label="From link" title="From link" onClick={() => setImageLinkOpen((open) => !open)}>
                    <Link2 className="h-4 w-4" />
                    <span className="hidden sm:inline">From link</span>
                  </Button>
                  {displayImage && (
                    <Button type="button" variant="destructive" size="sm" className="w-8 px-0 sm:w-auto sm:px-3" aria-label="Remove image" title="Remove image" onClick={() => { if (imagePreview) URL.revokeObjectURL(imagePreview); setPendingImage(null); setImagePreview(null); setImageUrl(""); setImageLinkOpen(false); }}>
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            {imageLinkOpen && (
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  if (imagePreview) URL.revokeObjectURL(imagePreview);
                  setPendingImage(null);
                  setImagePreview(null);
                  setImageUrl(e.target.value.trim());
                }}
                placeholder="Paste image link"
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageFile(file); e.target.value = ""; }}
            />
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
