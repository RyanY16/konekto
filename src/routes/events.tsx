import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Users, MapPin, Calendar, Search, Trash2, ArrowUpDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { eventGradient } from "@/lib/placeholders";
import { useOgImage } from "@/hooks/useOgImage";
import { NativeSelect } from "@/components/ui/native-select";

const CATEGORY_EMOJI: Record<string, string> = {
  Social:    "🥂",
  Career:    "💼",
  Hackathon: "⚡",
  Workshop:  "🛠️",
  Casual:    "🌸",
};
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { getEvents, getEventHandle, getProfilesByIds, deleteAllEvents } from "@/data/backend";
import { filterValidTags } from "@/data/tags";
import { useAuth } from "@/components/AuthProvider";
import { tagClass } from "@/lib/tag-class";
import { OwnerBadge } from "@/components/OwnerBadge";

function relativeTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Konekto" },
      {
        name: "description",
        content: "Mixers, hackathons, career forums and meetups for students in Japan.",
      },
    ],
  }),
  loaderDeps: () => ({}),
  staleTime: 30_000,
  loader: async () => {
    try {
      const evs = await getEvents();
      const list = evs;
      const ids = [...new Set(list.map((e) => e.ownerId).filter(Boolean) as string[])];
      const ownerMap: Record<string, { username: string; displayName: string; avatarUrl: string | null }> = {};
      if (ids.length > 0) {
        const profiles = await getProfilesByIds(ids).catch(() => []);
        profiles.forEach((p) => { ownerMap[p.id] = { username: p.username ?? p.displayName, displayName: p.displayName, avatarUrl: p.avatarUrl }; });
      }
      return { events: list, ownerMap };
    } catch (err) {
      console.error("[loader] events failed", err);
      return { events: [], ownerMap: {} };
    }
  },
  pendingComponent: EventsSkeleton,
  component: EventsPage,
});

const cats = ["All", "Social", "Career", "Hackathon", "Workshop", "Casual"] as const;

type TimeFilter = "all" | "this-week" | "this-month";

function getTimeRange(filter: TimeFilter): { start: Date; end: Date } | null {
  if (filter === "all") return null;
  const now = new Date();
  if (filter === "this-week") {
    const day = now.getDay(); // 0=Sun
    const start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (filter === "this-month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  return null;
}

type SortKey = "date-asc" | "date-desc" | "popular";

function getNextOccurrence(e: { recurrence?: string; startDate?: string; cancelledDates?: string[] }): Date | null {
  if (e.recurrence !== "weekly" || !e.startDate) return null;
  const base = new Date(e.startDate);
  const dayOfWeek = base.getDay();
  const cancelled = new Set(e.cancelledDates ?? []);
  const now = new Date();
  const cursor = new Date(now);
  const daysUntil = (dayOfWeek - cursor.getDay() + 7) % 7;
  cursor.setDate(cursor.getDate() + (daysUntil === 0 ? 7 : daysUntil));
  cursor.setHours(base.getHours(), base.getMinutes(), 0, 0);
  if (cursor <= now) cursor.setDate(cursor.getDate() + 7);
  let safety = 0;
  while (safety < 200) {
    if (!cancelled.has(cursor.toISOString().split("T")[0])) return cursor;
    cursor.setDate(cursor.getDate() + 7);
    safety++;
  }
  return null;
}

function parseSortDate(e: { startDate?: string; date: string; updatedAt?: string; recurrence?: string; cancelledDates?: string[] }): Date {
  const next = getNextOccurrence(e);
  if (next) return next;
  if (e.startDate) return new Date(e.startDate);
  // Fall back to parsing the human-readable date string: "Fri, May 8 · 7:00 PM – 10:00 PM"
  const datePart = e.date.split(/\s*[·•]\s*/)[0].trim(); // "Fri, May 8" or "Fri, May 8, 2026"
  const hasYear = /\d{4}/.test(datePart);
  const withYear = hasYear ? datePart : `${datePart} ${new Date().getFullYear()}`;
  const d = new Date(withYear);
  if (!isNaN(d.getTime())) return d;
  return e.updatedAt ? new Date(e.updatedAt) : new Date(0);
}

import type { EventItem } from "@/data/mock";

function EventCard({ event: e, ownerMap }: { event: EventItem; ownerMap: Record<string, { username: string; displayName: string; avatarUrl: string | null }> }) {
  const { t } = useTranslation();
  const ogImage = useOgImage(!e.imageUrl ? e.socialLinks?.website : undefined);
  const displayImage = e.imageUrl || ogImage;
  const isPast = parseSortDate(e) < new Date();

  return (
    <article className="card-base card-hover relative overflow-hidden">
      <Link
        to="/events/$eventHandle"
        params={{ eventHandle: getEventHandle(e) }}
        className="absolute inset-0 rounded-[inherit]"
        aria-label={`View ${e.title}`}
      />
      <div className="flex gap-4 p-4 items-center">
        <div className={`w-32 h-32 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-5xl relative bg-gradient-to-br ${isPast ? "from-muted/80 to-muted grayscale" : eventGradient(e.category)}`}>
          {displayImage
            ? <img src={displayImage} alt={e.title} className="w-full h-full object-cover" />
            : CATEGORY_EMOJI[e.category] || "📅"
          }
          {isPast && (
            <span className="absolute top-1 left-1 text-[9px] font-semibold uppercase tracking-wide bg-muted-foreground/20 text-muted-foreground px-1 py-0.5 rounded">{t("events.card.past")}</span>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="chip chip-primary">{e.category}</span>
              {e.recurrence === "weekly" && (
                <span className="chip bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">{t("events.card.weekly")}</span>
              )}
            </div>
            <SaveButton itemId={e.id} itemType="event" />
          </div>

          <h3 className="mt-1.5 font-semibold leading-snug">{e.title}</h3>

          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {e.recurrence
                ? (() => {
                    const next = getNextOccurrence(e);
                    const timeMatch = e.date.match(/(\d+:\d+\s*[AP]M\s*[-–]\s*\d+:\d+\s*[AP]M)/);
                    const timeStr = timeMatch ? ` · ${timeMatch[1]}` : "";
                    return next
                      ? `${next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}${timeStr}`
                      : e.date;
                  })()
                : e.date}
            </p>
            <p className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {e.location}
              {e.online && <span className="text-blue-600 dark:text-blue-400 font-medium">{t("events.card.online")}</span>}
            </p>
          </div>

          {e.tags && filterValidTags(e.tags).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {filterValidTags(e.tags).slice(0, 2).map((tag) => (
                <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>{tag}</span>
              ))}
            </div>
          )}

          <div className="mt-auto pt-2 flex items-center gap-1 text-xs text-muted-foreground relative z-10">
            <Users className="h-3 w-3" />
            <span className="font-medium text-foreground">{e.going}</span> {t("events.card.going")}
          </div>
        </div>
      </div>
    </article>
  );
}

function EventsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-9 w-20 bg-muted rounded-full" />)}
      </div>
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card-base overflow-hidden">
            <div className="h-28 bg-muted" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-5 w-40 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsPage() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const { events: allEvents, ownerMap } = Route.useLoaderData();
  const router = useRouter();
  const [deletingAll, setDeletingAll] = useState(false);
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const [q, setQ] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("date-asc");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
    { value: "all",        label: t("events.filters.anyTime") },
    { value: "this-week",  label: t("events.filters.thisWeek") },
    { value: "this-month", label: t("events.filters.thisMonth") },
  ];
  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "date-asc",  label: t("events.sort.dateAsc") },
    { value: "date-desc", label: t("events.sort.dateDesc") },
    { value: "popular",   label: t("events.sort.popular") },
  ];

  const filtered = useMemo(() => {
    const timeRange = getTimeRange(timeFilter);
    const base = allEvents.filter((e) => {
      const d = parseSortDate(e);
      if (timeRange) {
        if (d < timeRange.start || d > timeRange.end) return false;
      } else {
        const isPast = d < new Date();
        if (!showPast && isPast) return false;
      }
      if (cat !== "All" && e.category !== cat) return false;
      if (q) {
        const ql = q.toLowerCase();
        const matches =
          e.title.toLowerCase().includes(ql) ||
          e.location.toLowerCase().includes(ql) ||
          (e.description ?? "").toLowerCase().includes(ql) ||
          e.tags.some((t) => t.toLowerCase().includes(ql));
        if (!matches) return false;
      }
      return true;
    });

    return [...base].sort((a, b) => {
      switch (sortKey) {
        case "date-asc":  return parseSortDate(a).getTime() - parseSortDate(b).getTime();
        case "date-desc": return parseSortDate(b).getTime() - parseSortDate(a).getTime();
        case "popular":   return b.going - a.going;
      }
    });
  }, [allEvents, cat, q, showPast, sortKey]);

  return (
    <div>
      <div className="flex items-start justify-between mb-0">
        <PageHeader
          eyebrow={t("events.eyebrow")}
          title={t("events.title")}
          subtitle={t("events.subtitle")}
        />
        <div className="mt-1 shrink-0 flex items-center gap-2">
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("events.confirmDeleteAll")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("events.confirmDeleteAllDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAll}>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async (e) => {
                      e.preventDefault();
                      setDeletingAll(true);
                      try { await deleteAllEvents(); router.invalidate(); } finally { setDeletingAll(false); }
                    }}
                  >
                    {deletingAll ? t("common.deleting") : t("common.deleteAll")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Link
            to={user ? "/events/new" : "/signup"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("events.addEvent")}
          </Link>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("events.searchPlaceholder")}
            className="w-full pl-10 pr-4 h-11 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                cat === c
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTimeFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                timeFilter === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 z-10 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <NativeSelect
              wrapperClassName="flex-1"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 w-auto rounded-full border border-border bg-card pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </NativeSelect>
          </div>
          {timeFilter === "all" && (
            <label className="flex items-center gap-2 cursor-pointer select-none px-3.5 py-1.5 rounded-full text-sm font-medium border border-border bg-card hover:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={showPast}
                onChange={(e) => setShowPast(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              {t("events.showPast")}
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((e) => (
          <EventCard key={e.id} event={e} ownerMap={ownerMap} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">
            {t("events.noResults")}
          </p>
        )}
      </div>
    </div>
  );
}
