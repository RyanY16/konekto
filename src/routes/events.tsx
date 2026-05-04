import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Users, MapPin, Calendar, Search } from "lucide-react";
import { events as mockEvents } from "@/data/mock";

const CATEGORY_EMOJI: Record<string, string> = {
  Social: "🥂",
  Career: "💼",
  Hackathon: "⚡",
  Networking: "🚀",
};
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import AddEventDialog from "@/components/AddEventDialog";
import { getEvents, getEventHandle, getProfilesByIds } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { tagClass } from "@/lib/tag-class";

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
      const ownerMap: Record<string, string> = {};
      if (ids.length > 0) {
        const profiles = await getProfilesByIds(ids).catch(() => []);
        profiles.forEach((p) => { ownerMap[p.id] = p.username ?? p.displayName; });
      }
      return { events: list, ownerMap };
    } catch {
      return { events: mockEvents, ownerMap: {} };
    }
  },
  pendingComponent: EventsSkeleton,
  component: EventsPage,
});

const cats = ["All", "Social", "Career", "Hackathon", "Networking"] as const;

function EventsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <div key={i} className="h-9 w-20 bg-muted rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  const { user } = useAuth();
  const { events: allEvents, ownerMap } = Route.useLoaderData();
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const [q, setQ] = useState("");

  const filtered = allEvents.filter((e) => {
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

  return (
    <div>
      <div className="flex items-start justify-between mb-0">
        <PageHeader
          eyebrow="Events"
          title="What's happening."
          subtitle="From hanami picnics to career fairs — your weekend plans, sorted."
        />
        <div className="mt-1 shrink-0">
          {user ? (
            <AddEventDialog />
          ) : (
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Add event
            </Link>
          )}
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, location or tag…"
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((e) => (
          <article key={e.id} className="card-base card-hover overflow-hidden flex flex-col relative">
            <Link
              to="/events/$eventHandle"
              params={{ eventHandle: getEventHandle(e) }}
              className="absolute inset-0 rounded-[inherit]"
              aria-label={`View ${e.title}`}
            />
            <div className="h-28 bg-gradient-to-br from-primary-soft to-accent-soft flex items-center justify-center text-5xl shrink-0">
              {CATEGORY_EMOJI[e.category] || "📅"}
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="chip chip-primary">{e.category}</span>
                <SaveButton />
              </div>
              <h3 className="mt-3 font-semibold text-lg leading-snug">{e.title}</h3>
              {e.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{e.description}</p>
              )}
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" /> {e.date}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> {e.location}
                </p>
              </div>
              {e.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.tags.map((tag) => (
                    <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between relative z-10">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground">{e.going}</span> going
                  </div>
                  {e.ownerId && ownerMap[e.ownerId] && (
                    <Link
                      to="/users/$username"
                      params={{ username: ownerMap[e.ownerId] }}
                      className="text-xs text-muted-foreground hover:underline relative z-10"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      👑 @{ownerMap[e.ownerId]}
                    </Link>
                  )}
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shrink-0">
                  View →
                </span>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">
            No events match your search.
          </p>
        )}
      </div>
    </div>
  );
}
