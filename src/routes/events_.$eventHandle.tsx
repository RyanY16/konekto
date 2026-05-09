import { Link, createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Globe, MapPin, ExternalLink, CalendarIcon, CalendarPlus, Ticket } from "lucide-react";
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
import { CIRCLE_TAG_GROUPS, filterValidTags } from "@/data/tags";
import EventCircleCollabPicker from "@/components/EventCircleCollabPicker";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { OwnerBadge } from "@/components/OwnerBadge";
import { ShareButton } from "@/components/ShareButton";
import { SaveButton } from "@/components/SaveButton";
import { useAuth } from "@/components/AuthProvider";
import {
  deleteEvent,
  getEventByHandle,
  updateEvent,
  getProfile,
  getCircleByHandle,
  getCircleHandle,
  getEventHandle,
  getEventCircleLinks,
  getMyEditableCircles,
  setEventCircleCollaborations,
  approveEventCircleCollaboration,
  declineEventCircleCollaboration,
  cancelEventCircleCollaboration,
  getMyAttendance,
  requestToAttend,
  withdrawAttendance,
  getEventAttendees,
  updateAttendeeStatus,
  cancelEventOccurrence,
} from "@/data/backend";
import type { Circle } from "@/data/mock";
import type { AttendeeStatus, EventAttendee, EventCircleLink } from "@/data/backend";
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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseTimeStr(t: string): { h: number; m: number } {
  const match = t.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return { h: 19, m: 0 };
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
  return { h, m };
}

function getUpcomingOccurrences(event: EventItem, count = 5): { date: Date; isoDate: string; cancelled: boolean }[] {
  if (event.recurrence !== "weekly" || !event.startDate) return [];
  const base = new Date(event.startDate);
  const dayOfWeek = base.getDay();
  const cancelled = new Set(event.cancelledDates ?? []);
  const now = new Date();
  const cursor = new Date(now);
  const daysUntil = (dayOfWeek - cursor.getDay() + 7) % 7;
  cursor.setDate(cursor.getDate() + (daysUntil === 0 ? 7 : daysUntil));
  cursor.setHours(base.getHours(), base.getMinutes(), 0, 0);
  if (cursor <= now) cursor.setDate(cursor.getDate() + 7);
  const results = [];
  let safety = 0;
  while (results.length < count && safety < 200) {
    const isoDate = cursor.toISOString().split("T")[0];
    results.push({ date: new Date(cursor), isoDate, cancelled: cancelled.has(isoDate) });
    cursor.setDate(cursor.getDate() + 7);
    safety++;
  }
  return results;
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
  luma: string;
  tickets: string;
  isWeekly: boolean;
  recurringDay: number;
  howToJoin: string;
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
    luma: sl.luma ?? "",
    tickets: sl.tickets ?? "",
    isWeekly: e.recurrence === "weekly",
    recurringDay: e.startDate ? new Date(e.startDate).getDay() : 0,
    howToJoin: e.howToJoin ?? "",
  };
}

function EventDetailPage() {
  const event = Route.useLoaderData();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [owner, setOwner] = useState<{ username: string; displayName: string; avatarUrl: string | null } | null>(null);
  const [linkedCircles, setLinkedCircles] = useState<Circle[]>([]);
  const [circleLinks, setCircleLinks] = useState<EventCircleLink[]>([]);
  const [myEditableCircleIds, setMyEditableCircleIds] = useState<Set<string>>(new Set());
  const [invitedCircleIds, setInvitedCircleIds] = useState<string[]>([]);
  const [collabActionId, setCollabActionId] = useState<string | null>(null);
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
  const [cancellingDate, setCancellingDate] = useState<string | null>(null);
  const [localCancelledDates, setLocalCancelledDates] = useState<string[]>(event?.cancelledDates ?? []);

  const isOwner = !!(user && event?.ownerId && user.id === event.ownerId);
  const canEdit = isOwner || isAdmin;
  const canManageOccurrences = canEdit || linkedCircles.some((c) => myEditableCircleIds.has(c.id));

  useEffect(() => {
    if (!event?.ownerId) return;
    getProfile(event.ownerId).then((p) => {
      if (p) setOwner({ username: p.username ?? p.displayName, displayName: p.displayName, avatarUrl: p.avatarUrl });
    });
  }, [event?.ownerId]);

  async function refreshCircleLinks() {
    if (!event?.id) return;
    const links = await getEventCircleLinks(event.id).catch(() => [] as EventCircleLink[]);
    setCircleLinks(links);
    const approved = links.filter((link) => link.status === "approved" && link.circle);
    if (approved.length > 0) {
      setLinkedCircles(approved.map((link) => link.circle!).filter(Boolean));
      return;
    }
    const ids = event.circleIds ?? [];
    if (ids.length === 0) {
      setLinkedCircles([]);
      return;
    }
    const results = await Promise.all(ids.map((id) => getCircleByHandle(id)));
    setLinkedCircles(results.filter(Boolean) as Circle[]);
  }

  useEffect(() => {
    refreshCircleLinks();
  }, [event?.id, event?.circleIds?.join(",")]);

  useEffect(() => {
    if (!user?.id) {
      setMyEditableCircleIds(new Set());
      return;
    }
    getMyEditableCircles(user.id)
      .then((circles) => setMyEditableCircleIds(new Set(circles.map((circle) => circle.id))))
      .catch(() => setMyEditableCircleIds(new Set()));
  }, [user?.id]);

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
    setInvitedCircleIds(circleLinks.filter((link) => link.status === "pending").map((link) => link.circleId));
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
      let dateStr: string;
    let startDateIso: string | undefined;
    if (draft.isWeekly) {
      dateStr = `Every ${DAY_NAMES[draft.recurringDay]} · ${editStartTime} – ${editEndTime}`;
      const { h, m } = parseTimeStr(editStartTime);
      const d = new Date();
      const daysUntil = (draft.recurringDay - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + (daysUntil === 0 ? 7 : daysUntil));
      d.setHours(h, m, 0, 0);
      startDateIso = d.toISOString();
    } else {
      dateStr = formatDateRange(editDateRange, editStartTime, editEndTime, editMultiDay) || draft.date;
      startDateIso = editDateRange?.from ? (() => {
        const { h, m } = parseTimeStr(editStartTime);
        const d = new Date(editDateRange.from); d.setHours(h, m, 0, 0);
        return d.toISOString();
      })() : undefined;
    }
    await updateEvent(event!.id, {
        title: draft.title,
        description: draft.description,
        category: draft.category as EventItem["category"],
        date: dateStr,
        startDate: startDateIso,
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
          luma: draft.luma || undefined,
          tickets: draft.tickets || undefined,
        },
        recurrence: draft.isWeekly ? "weekly" : undefined,
        howToJoin: draft.howToJoin || undefined,
      } as any);
      if (user) {
        await setEventCircleCollaborations({
          eventId: event!.id,
          eventTitle: draft.title,
          eventOwnerId: event!.ownerId,
          requesterId: user.id,
          approvedCircleIds: draft.circleIds,
          invitedCircleIds,
        });
      }
      await refreshCircleLinks();
      setEditing(false);
      const newHandle = getEventHandle({ id: event!.id, title: draft.title });
      await navigate({ to: "/events/$eventHandle", params: { eventHandle: newHandle }, replace: true });
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

  async function handleCollabDecision(circleId: string, decision: "approved" | "declined") {
    if (!user) return;
    setCollabActionId(circleId);
    try {
      if (decision === "approved") {
        await approveEventCircleCollaboration(event!.id, circleId, user.id);
      } else {
        await declineEventCircleCollaboration(event!.id, circleId, user.id);
      }
      await refreshCircleLinks();
      router.invalidate();
    } finally {
      setCollabActionId(null);
    }
  }

  async function handleCancelCollabRequest(circleId: string) {
    setCollabActionId(circleId);
    try {
      await cancelEventCircleCollaboration(event!.id, circleId);
      setInvitedCircleIds((ids) => ids.filter((id) => id !== circleId));
      await refreshCircleLinks();
      router.invalidate();
    } finally {
      setCollabActionId(null);
    }
  }

  async function handleCancelOccurrence(isoDate: string) {
    if (!event) return;
    setCancellingDate(isoDate);
    try {
      await cancelEventOccurrence(event.id, isoDate);
      setLocalCancelledDates((prev) => [...prev, isoDate]);
    } finally {
      setCancellingDate(null);
    }
  }

  const sel = `h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`;

  const langInfo = event.primaryLanguage
    ? LANGUAGES.find((l) => l.name === event.primaryLanguage)
    : null;
  const pendingCircleIds = circleLinks.filter((link) => link.status === "pending").map((link) => link.circleId);
  const declinedCircleIds = circleLinks.filter((link) => link.status === "declined").map((link) => link.circleId);
  const myApprovedCircleIds = draft.circleIds?.filter((id) => myEditableCircleIds.has(id)) ?? [];
  const approvedOtherCircleIds = draft.circleIds?.filter((id) => !myEditableCircleIds.has(id)) ?? [];
  const actionablePendingLinks = circleLinks.filter((link) => link.status === "pending" && myEditableCircleIds.has(link.circleId));

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

              {!draft.isWeekly && (
                <>
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
                </>
              )}

              {/* Time selects */}
              <div className="flex gap-2 mt-2">
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Start Time</span>
                  <select className={sel} value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)}>
                    {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">End Time</span>
                  <select className={sel} value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)}>
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

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={draft.isWeekly}
                  onChange={(e) => setDraft((d) => ({ ...d, isWeekly: e.target.checked }))}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium">Repeats weekly</span>
              </label>
              {draft.isWeekly && (
                <div className="pl-6">
                  <select
                    value={draft.recurringDay}
                    onChange={(e) => setDraft((d) => ({ ...d, recurringDay: Number(e.target.value) }))}
                    className={sel}
                  >
                    {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
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
              <TagPicker value={draft.tags} onChange={(t) => setDraft((d) => ({ ...d, tags: t }))} groups={CIRCLE_TAG_GROUPS} />
            </div>

            {user && (
              <div className="space-y-1">
                <EventCircleCollabPicker
                  myCircleIds={myApprovedCircleIds}
                  invitedCircleIds={invitedCircleIds}
                  onMyCircleIdsChange={(ids) => setDraft((d) => ({ ...d, circleIds: [...approvedOtherCircleIds, ...ids] }))}
                  onInvitedCircleIdsChange={setInvitedCircleIds}
                  userId={user.id}
                  pendingCircleIds={pendingCircleIds}
                  declinedCircleIds={declinedCircleIds}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">How to join</label>
              <Textarea
                value={draft.howToJoin}
                onChange={(e) => setDraft((d) => ({ ...d, howToJoin: e.target.value }))}
                placeholder="Describe how to register or attend — e.g. RSVP via the link below, walk-ins welcome, tickets at the door…"
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Event links</label>
              <div className="space-y-2">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input value={draft.website} onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))} placeholder="https://yoursite.com" className="pl-9" />
                </div>
                <div className="relative">
                  <CalendarPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input value={draft.luma} onChange={(e) => setDraft((d) => ({ ...d, luma: e.target.value }))} placeholder="https://lu.ma/your-event" className="pl-9" />
                </div>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input value={draft.tickets} onChange={(e) => setDraft((d) => ({ ...d, tickets: e.target.value }))} placeholder="Registration or ticket link" className="pl-9" />
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
              {event.recurrence === "weekly" && event.startDate && (
                <Detail label="Repeats" value={`Every ${DAY_NAMES[new Date(event.startDate).getDay()]}`} />
              )}
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

            {owner && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>👑 Organized by</span>
                <OwnerBadge username={owner.username} displayName={owner.displayName} avatarUrl={owner.avatarUrl} />
              </div>
            )}

            {filterValidTags(event.tags).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filterValidTags(event.tags).map((tag) => (
                  <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {linkedCircles.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Hosting circles</p>
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

            {pendingCircleIds.length > 0 && (canEdit || actionablePendingLinks.length > 0) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{canEdit ? "Current collab requests" : "Pending collabs"}</p>
                <div className="space-y-2">
                  {circleLinks.filter((link) => link.status === "pending").map((link) => {
                    const circle = link.circle;
                    const canRespond = myEditableCircleIds.has(link.circleId);
                    return (
                      <div key={link.circleId} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                          {circle?.emoji ?? ""} {circle?.name ?? link.circleId}
                        </span>
                        {canRespond ? (
                          <>
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled={collabActionId === link.circleId}
                              onClick={() => handleCollabDecision(link.circleId, "approved")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              disabled={collabActionId === link.circleId}
                              onClick={() => handleCollabDecision(link.circleId, "declined")}
                            >
                              Decline
                            </Button>
                          </>
                        ) : canEdit ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            disabled={collabActionId === link.circleId}
                            onClick={() => handleCancelCollabRequest(link.circleId)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Waiting for approval</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {event.howToJoin && (
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">How to join</p>
                <p className="text-sm whitespace-pre-wrap">{event.howToJoin}</p>
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
            <SaveButton itemId={event.id} itemType="event" />
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

      {/* Upcoming occurrences */}
      {!editing && event.recurrence && (
        <section className="card-base p-6 mt-4 space-y-3">
          <h2 className="font-semibold text-sm">Upcoming dates</h2>
          {getUpcomingOccurrences({ ...event, cancelledDates: localCancelledDates }, 5).map(({ date, isoDate, cancelled }) => {
            const timeMatch = event.date.match(/(\d+:\d+\s*[AP]M\s*[-–]\s*\d+:\d+\s*[AP]M)/);
            const timeStr = timeMatch ? ` · ${timeMatch[1]}` : "";
            return (
              <div key={isoDate} className="flex items-center justify-between gap-3">
                <span className={`text-sm ${cancelled ? "line-through text-muted-foreground" : ""}`}>
                  {format(date, "EEE, MMM d, yyyy")}{timeStr}
                </span>
                {cancelled ? (
                  <span className="text-xs text-muted-foreground shrink-0">Cancelled</span>
                ) : canManageOccurrences ? (
                  <button
                    onClick={() => handleCancelOccurrence(isoDate)}
                    disabled={cancellingDate === isoDate}
                    className="text-xs text-muted-foreground hover:text-destructive border border-border rounded-md px-2 py-0.5 shrink-0 transition-colors"
                  >
                    {cancellingDate === isoDate ? "…" : "Cancel"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </section>
      )}

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
