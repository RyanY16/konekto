import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Globe, Instagram, Linkedin, MessageCircle, MapPin, ExternalLink, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parse } from "date-fns";
import type { DateRange } from "react-day-picker";
import { tagClass } from "@/lib/tag-class";
import { PageHeader } from "@/components/PageHeader";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagPicker from "@/components/TagPicker";
import CirclePicker from "@/components/CirclePicker";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { ShareButton } from "@/components/ShareButton";
import { useAuth } from "@/components/AuthProvider";
import {
  deleteEvent,
  getEventByHandle,
  updateEvent,
  getProfile,
  getCircleByHandle,
  getCircleHandle,
  getMyAttendance,
  requestToAttend,
  withdrawAttendance,
  getEventAttendees,
  updateAttendeeStatus,
} from "@/data/backend";
import type { Circle } from "@/data/mock";
import type { AttendeeStatus, EventAttendee } from "@/data/backend";
import { LANGUAGES } from "@/data/profile-options";
import type { EventItem } from "@/data/mock";

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

function parseDateString(dateStr: string): { range: DateRange | undefined; startTime: string; endTime: string; multiDay: boolean } {
  const tryParseDate = (s: string): Date | undefined => {
    const cleaned = s.replace(/^[A-Za-z]+, /, "").trim();
    for (const fmt of ["MMM d, yyyy", "MMM d"]) {
      try {
        const d = parse(cleaned, fmt, new Date());
        if (!isNaN(d.getTime())) return d;
      } catch {}
    }
    return undefined;
  };

  // Multi-day: "EEE, MMM d–MMM d · H:MM XM – H:MM XM" (accepts en-dash or hyphen)
  const multi = dateStr.match(/^(.+?)[-–](.+?)\s[·•]\s(\d+:\d+ [AP]M)\s[-–]\s(\d+:\d+ [AP]M)$/);
  if (multi) {
    const from = tryParseDate(multi[1]);
    const to = tryParseDate(multi[2]);
    return { range: from ? { from, to } : undefined, startTime: multi[3], endTime: multi[4], multiDay: true };
  }

  // Single day: "EEE, MMM d · H:MM XM – H:MM XM"
  const single = dateStr.match(/^(.+?)\s[·•]\s(\d+:\d+ [AP]M)\s[-–]\s(\d+:\d+ [AP]M)$/);
  if (single) {
    const from = tryParseDate(single[1]);
    return { range: from ? { from, to: undefined } : undefined, startTime: single[2], endTime: single[3], multiDay: false };
  }

  return { range: undefined, startTime: "7:00 PM", endTime: "9:00 PM", multiDay: false };
}

function relativeTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 30) return `Updated ${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Updated ${months}mo ago`;
  return `Updated ${Math.floor(months / 12)}y ago`;
}

function EventSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-8 w-64 bg-muted rounded" />
      <div className="card-base p-6 space-y-4">
        <div className="h-16 w-16 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
        </div>
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/events_/$eventHandle")({
  loader: ({ params }) => getEventByHandle(params.eventHandle),
  staleTime: 30_000,
  pendingComponent: EventSkeleton,
  component: EventDetailPage,
});

type Draft = {
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  online: boolean;
  approvalRequired: boolean;
  cost: string;
  primaryLanguage: string;
  tags: string[];
  circleIds: string[];
  website: string;
  instagram: string;
  linkedin: string;
  line: string;
};

function toDraft(e: EventItem): Draft {
  const sl = e.socialLinks ?? {};
  return {
    title: e.title,
    description: e.description ?? "",
    category: e.category,
    date: e.date,
    location: e.location,
    online: e.online ?? false,
    approvalRequired: e.approvalRequired ?? false,
    cost: e.cost ?? "",
    primaryLanguage: e.primaryLanguage ?? "",
    tags: e.tags ?? [],
    circleIds: e.circleIds ?? [],
    website: sl.website ?? "",
    instagram: sl.instagram ?? "",
    linkedin: sl.linkedin ?? "",
    line: sl.line ?? "",
  };
}

function EventDetailPage() {
  const event = Route.useLoaderData();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState<string>("");
  const [linkedCircles, setLinkedCircles] = useState<Circle[]>([]);
  const [draft, setDraft] = useState<Draft>(event ? toDraft(event) : {} as Draft);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editDateRange, setEditDateRange] = useState<DateRange | undefined>(undefined);
  const [editStartTime, setEditStartTime] = useState("7:00 PM");
  const [editEndTime, setEditEndTime] = useState("9:00 PM");
  const [editMultiDay, setEditMultiDay] = useState(false);
  const [editDatePickerOpen, setEditDatePickerOpen] = useState(false);
  const [myStatus, setMyStatus] = useState<AttendeeStatus | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [attendeesLoaded, setAttendeesLoaded] = useState(false);

  const isOwner = !!(user && event?.ownerId && user.id === event.ownerId);
  const canEdit = isOwner || isAdmin;

  useEffect(() => {
    if (!event?.ownerId) return;
    getProfile(event.ownerId).then((p) => {
      setOwnerUsername(p?.username ?? p?.displayName ?? "");
    });
  }, [event?.ownerId]);

  useEffect(() => {
    const ids = event?.circleIds ?? [];
    if (ids.length === 0) { setLinkedCircles([]); return; }
    Promise.all(ids.map((id) => getCircleByHandle(id))).then((results) => {
      setLinkedCircles(results.filter(Boolean) as Circle[]);
    });
  }, [event?.circleIds?.join(",")]);

  useEffect(() => {
    if (!event?.id || !user || isOwner || isAdmin) return;
    getMyAttendance(event.id, user.id).then(setMyStatus).catch(() => {});
  }, [event?.id, user?.id, isOwner, isAdmin]);

  useEffect(() => {
    if (!event?.id || (!isOwner && !isAdmin)) return;
    getEventAttendees(event.id).then((a) => { setAttendees(a); setAttendeesLoaded(true); }).catch(() => {});
  }, [event?.id, isOwner, isAdmin]);

  if (!event) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Link to="/events" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  function startEditing() {
    const d = toDraft(event!);
    setDraft(d);
    const parsed = parseDateString(d.date);
    setEditDateRange(parsed.range);
    setEditStartTime(parsed.startTime);
    setEditEndTime(parsed.endTime);
    const isMultiDay = parsed.multiDay || !!(
      parsed.range?.from && parsed.range?.to &&
      parsed.range.to.getTime() !== parsed.range.from.getTime()
    );
    setEditMultiDay(isMultiDay);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      const dateStr = formatDateRange(editDateRange, editStartTime, editEndTime, editMultiDay) || draft.date;
      await updateEvent(event!.id, {
        title: draft.title,
        description: draft.description,
        category: draft.category as EventItem["category"],
        date: dateStr,
        location: draft.location,
        online: draft.online,
        approvalRequired: draft.approvalRequired,
        emoji: CATEGORY_EMOJI[draft.category] || "📅",
        cost: draft.cost,
        primaryLanguage: draft.primaryLanguage,
        tags: draft.tags,
        circleIds: draft.circleIds,
        socialLinks: {
          website: draft.website || undefined,
          instagram: draft.instagram || undefined,
          linkedin: draft.linkedin || undefined,
          line: draft.line || undefined,
        },
      });
      setEditing(false);
      router.invalidate();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteEvent(event!.id);
    router.navigate({ to: "/events" });
  }

  const sel = `h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`;

  const langInfo = event.primaryLanguage
    ? LANGUAGES.find((l) => l.name === event.primaryLanguage)
    : null;

  return (
    <div>
      <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to events
      </Link>

      <PageHeader
        eyebrow="Events"
        title={editing ? draft.title || event.title : event.title}
      />
      {!editing && event.description && (
        <p className="whitespace-pre-wrap text-muted-foreground max-w-2xl -mt-4 mb-6">{event.description}</p>
      )}

      <section className="card-base p-6 space-y-5 relative pb-16">
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="What's this event about?"
                rows={5}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                className={sel}
              >
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date &amp; Time</label>

              {/* Multi-day toggle */}
              <div className="flex items-center gap-2 mb-1">
                <input
                  id="edit-multiday"
                  type="checkbox"
                  checked={editMultiDay}
                  onChange={(e) => {
                    setEditMultiDay(e.target.checked);
                    if (!e.target.checked) setEditDateRange((r) => r ? { from: r.from, to: undefined } : undefined);
                  }}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <label htmlFor="edit-multiday" className="text-sm font-medium cursor-pointer select-none">
                  Multi-day event
                </label>
              </div>

              {/* Date picker */}
              <Popover open={editDatePickerOpen} onOpenChange={setEditDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-left flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className={editDateRange?.from ? "" : "text-muted-foreground"}>
                      {editDateRange?.from
                        ? editMultiDay && editDateRange.to && editDateRange.to.getTime() !== editDateRange.from.getTime()
                          ? `${format(editDateRange.from, "MMM d")} – ${format(editDateRange.to, "MMM d, yyyy")}`
                          : format(editDateRange.from, "EEE, MMM d, yyyy")
                        : "Select date…"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {editMultiDay ? (
                    <>
                      <Calendar
                        mode="range"
                        selected={editDateRange}
                        onSelect={(val: DateRange | undefined) => setEditDateRange(val)}
                        initialFocus
                      />
                      <div className="p-2 border-t flex justify-end">
                        <Button size="sm" type="button" onClick={() => setEditDatePickerOpen(false)}>Done</Button>
                      </div>
                    </>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={editDateRange?.from}
                      onSelect={(val: Date | undefined) => {
                        setEditDateRange(val ? { from: val, to: undefined } : undefined);
                        setEditDatePickerOpen(false);
                      }}
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
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                  >
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">End Time</span>
                  <select
                    className={sel}
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  >
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="edit-online"
                  type="checkbox"
                  checked={draft.online}
                  onChange={(e) => setDraft((d) => ({ ...d, online: e.target.checked }))}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <label htmlFor="edit-online" className="text-sm font-medium cursor-pointer select-none">
                  Online event
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="edit-approval"
                  type="checkbox"
                  checked={draft.approvalRequired}
                  onChange={(e) => setDraft((d) => ({ ...d, approvalRequired: e.target.checked }))}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <label htmlFor="edit-approval" className="text-sm font-medium cursor-pointer select-none">
                  Approval required
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {draft.online ? "Platform / link" : "Location"}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={draft.location}
                  onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                  placeholder={draft.online ? "e.g. Zoom, Discord, Google Meet" : "e.g. Tokyo Big Sight, Shibuya"}
                  className="pl-9"
                />
              </div>
              {!draft.online && draft.location.trim() && (
                <a
                  href={mapsUrl(draft.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                >
                  <ExternalLink className="h-3 w-3" /> Preview on Google Maps
                </a>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cost</label>
              <Input
                value={draft.cost}
                onChange={(e) => setDraft((d) => ({ ...d, cost: e.target.value }))}
                placeholder="e.g. Free, ¥1,000, ¥500 at door"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Primary language</label>
              <select
                value={draft.primaryLanguage}
                onChange={(e) => setDraft((d) => ({ ...d, primaryLanguage: e.target.value }))}
                className={sel}
              >
                <option value="">— Select language —</option>
                {LANGUAGES.map((l) => (
                  <option key={l.name} value={l.name}>{l.flag} {l.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <TagPicker value={draft.tags} onChange={(t) => setDraft((d) => ({ ...d, tags: t }))} />
            </div>

            {user && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Associated circles</label>
                <CirclePicker
                  value={draft.circleIds}
                  onChange={(ids) => setDraft((d) => ({ ...d, circleIds: ids }))}
                  userId={user.id}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Social links</label>
              <div className="space-y-2">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input value={draft.website} onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))} placeholder="https://yoursite.com" className="pl-9" />
                </div>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                  <Input value={draft.instagram.replace(/^@/, "")} onChange={(e) => setDraft((d) => ({ ...d, instagram: e.target.value.replace(/^@/, "") }))} placeholder="handle" className="pl-14" />
                </div>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input value={draft.linkedin} onChange={(e) => setDraft((d) => ({ ...d, linkedin: e.target.value }))} placeholder="linkedin.com/in/yourprofile" className="pl-9" />
                </div>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                  <Input value={draft.line.replace(/^@/, "")} onChange={(e) => setDraft((d) => ({ ...d, line: e.target.value.replace(/^@/, "") }))} placeholder="LINE ID" className="pl-14" />
                </div>
              </div>
            </div>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-soft to-accent-soft flex items-center justify-center text-4xl shrink-0">
                {CATEGORY_EMOJI[event.category] || "📅"}
              </div>
              <span className="chip chip-primary">{event.category}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail label="Date & time" value={event.date} />
              <Detail label="Going" value={`${event.going} people`} />
              {event.cost && <Detail label="Cost" value={event.cost} />}
            </div>

            {/* Location */}
            {event.online ? (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{event.location}</span>
                <span className="chip bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">🌐 Online</span>
              </div>
            ) : (
              <a
                href={mapsUrl(event.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors group"
              >
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{event.location}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            )}

            {langInfo && (
              <p className="text-sm text-muted-foreground">{langInfo.flag} {langInfo.name}</p>
            )}

            {ownerUsername && (
              <p className="text-sm text-muted-foreground">
                👑 Organized by{" "}
                <Link
                  to="/users/$username"
                  params={{ username: ownerUsername }}
                  className="font-medium text-foreground hover:underline"
                >
                  @{ownerUsername}
                </Link>
              </p>
            )}

            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {linkedCircles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Circles</p>
                <div className="flex flex-wrap gap-2">
                  {linkedCircles.map((c) => (
                    <Link
                      key={c.id}
                      to="/circles/$circleHandle"
                      params={{ circleHandle: getCircleHandle(c) }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      {c.emoji} {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {relativeTime(event.updatedAt) && (
              <p className="text-xs text-muted-foreground">{relativeTime(event.updatedAt)}</p>
            )}

            <SocialLinks links={event.socialLinks} />
          </>
        )}

        {editing ? (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>Cancel</Button>
          </div>
        ) : (
          <div className="absolute bottom-4 right-4 flex gap-1.5 items-center">
            <ShareButton title={event.title} />
            {user && !canEdit && (
              <RsvpButton
                event={event}
                userId={user.id}
                status={myStatus}
                loading={rsvpLoading}
                onStatusChange={(s) => {
                  setMyStatus(s);
                  router.invalidate();
                }}
                setLoading={setRsvpLoading}
              />
            )}
            {canEdit && (
              <button
                onClick={startEditing}
                className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors"
              >
                Edit
              </button>
            )}
            {canEdit && (
              <DeleteRecordButton label={event.title} onDelete={handleDelete} />
            )}
          </div>
        )}
      </section>

      {/* Attendees panel — owners/admins only */}
      {!editing && (isOwner || isAdmin) && (
        <section className="card-base p-6 mt-4 space-y-4">
          <h2 className="font-semibold text-sm">
            Attendees
            {event.approvalRequired && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(approval required)</span>
            )}
          </h2>
          {!attendeesLoaded && <p className="text-sm text-muted-foreground">Loading…</p>}
          {attendeesLoaded && attendees.length === 0 && (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          )}
          {attendeesLoaded && (["pending", "approved", "declined"] as AttendeeStatus[]).map((statusGroup) => {
            const group = attendees.filter((a) => a.status === statusGroup);
            if (group.length === 0) return null;
            const label = statusGroup === "pending" ? "Pending" : statusGroup === "approved" ? "Going" : "Declined";
            return (
              <div key={statusGroup}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{label} · {group.length}</p>
                <div className="space-y-2">
                  {group.map((a) => (
                    <div key={a.userId} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0 overflow-hidden">
                        {a.avatarUrl ? (
                          <img src={a.avatarUrl} alt={a.displayName} className="h-full w-full object-cover" />
                        ) : (
                          a.displayName[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {a.username ? (
                          <Link
                            to="/users/$username"
                            params={{ username: a.username }}
                            className="text-sm font-medium hover:underline"
                          >
                            @{a.username}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium">{a.displayName}</span>
                        )}
                      </div>
                      {event.approvalRequired && statusGroup === "pending" && (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={async () => {
                              await updateAttendeeStatus(event, a.userId, "approved");
                              setAttendees((prev) => prev.map((x) => x.userId === a.userId ? { ...x, status: "approved" } : x));
                              router.invalidate();
                            }}
                            className="text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              await updateAttendeeStatus(event, a.userId, "declined");
                              setAttendees((prev) => prev.map((x) => x.userId === a.userId ? { ...x, status: "declined" } : x));
                            }}
                            className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {event.approvalRequired && statusGroup === "approved" && (
                        <button
                          onClick={async () => {
                            await updateAttendeeStatus(event, a.userId, "declined");
                            setAttendees((prev) => prev.map((x) => x.userId === a.userId ? { ...x, status: "declined" } : x));
                            router.invalidate();
                          }}
                          className="text-xs px-2.5 py-1 rounded-md border border-border hover:bg-muted transition-colors shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

function RsvpButton({
  event,
  userId,
  status,
  loading,
  onStatusChange,
  setLoading,
}: {
  event: EventItem;
  userId: string;
  status: AttendeeStatus | null;
  loading: boolean;
  onStatusChange: (s: AttendeeStatus | null) => void;
  setLoading: (v: boolean) => void;
}) {
  if (status === "approved") {
    return (
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try { await withdrawAttendance(event.id, userId); onStatusChange(null); }
          finally { setLoading(false); }
        }}
        className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
      >
        ✓ Going
      </button>
    );
  }
  if (status === "pending") {
    return (
      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          try { await withdrawAttendance(event.id, userId); onStatusChange(null); }
          finally { setLoading(false); }
        }}
        className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors"
      >
        ⏳ Pending · Cancel
      </button>
    );
  }
  if (status === "declined") {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
        Not approved
      </span>
    );
  }
  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await requestToAttend(event, userId);
          onStatusChange(event.approvalRequired ? "pending" : "approved");
        } finally {
          setLoading(false);
        }
      }}
      className="text-xs px-3 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      {loading ? "…" : event.approvalRequired ? "Request to attend" : "Want to go"}
    </button>
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
