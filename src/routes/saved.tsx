import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Bookmark, Calendar, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { getCircles, getEvents, getCircleHandle, getEventHandle } from "@/data/backend";
import { useSaves } from "@/lib/saves";
import { filterValidTags } from "@/data/tags";
import { tagClass } from "@/lib/tag-class";
import { useAuth } from "@/components/AuthProvider";
import type { Circle, EventItem } from "@/data/mock";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved — Konekto" }] }),
  component: SavedPage,
});

const CATEGORY_EMOJI: Record<string, string> = {
  Social: "🥂",
  Career: "💼",
  Hackathon: "⚡",
  Networking: "🚀",
};

function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const { saves } = useSaves(user?.id);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "circles" | "events">("all");

  useEffect(() => {
    Promise.all([getCircles(), getEvents()]).then(([cs, es]) => {
      setCircles(cs);
      setEvents(es);
      setLoading(false);
    });
  }, []);

  const savedCircles = circles.filter((c) => saves.circleIds.includes(c.id));
  const savedEvents = events.filter((e) => saves.eventIds.includes(e.id));
  const total = savedCircles.length + savedEvents.length;

  const showCircles = tab === "all" || tab === "circles";
  const showEvents = tab === "all" || tab === "events";

  return (
    <div>
      <PageHeader eyebrow="Saved" title="Your bookmarks." />

      {authLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-base p-4 h-20 bg-muted" />
          ))}
        </div>
      ) : !user ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Log in to save items</p>
          <p className="text-sm mt-1">Your saved circles and events are kept with your account.</p>
          <div className="flex gap-3 justify-center mt-6">
            <Link to="/login" className="text-sm font-medium text-primary hover:underline">Log in</Link>
            <Link to="/signup" className="text-sm font-medium text-primary hover:underline">Sign up</Link>
          </div>
        </div>
      ) : (
        <>
      <div className="flex gap-2 mb-6">
        {(["all", "circles", "events"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
              tab === t
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            {t === "all" ? `All (${total})` : t === "circles" ? `Circles (${savedCircles.length})` : `Events (${savedEvents.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card-base p-4 h-20 bg-muted" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nothing saved yet</p>
          <p className="text-sm mt-1">Tap the bookmark icon on any circle or event to save it here.</p>
          <div className="flex gap-3 justify-center mt-6">
            <Link to="/circles" className="text-sm font-medium text-primary hover:underline">Browse circles →</Link>
            <Link to="/events" className="text-sm font-medium text-primary hover:underline">Browse events →</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {showCircles && savedCircles.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Circles</p>
              <div className="space-y-2">
                {savedCircles.map((c) => (
                  <article key={c.id} className="card-base card-hover p-4 flex items-center gap-3 relative">
                    <Link
                      to="/circles/$circleHandle"
                      params={{ circleHandle: getCircleHandle(c) }}
                      className="absolute inset-0 rounded-[inherit]"
                      aria-label={`View ${c.name}`}
                    />
                    <div className="shrink-0 w-10 h-10 flex items-center justify-center">
                      {(c as any).iconUrl ? (
                        <img src={(c as any).iconUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <span className="text-3xl leading-none">{c.emoji}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.category} · {c.members} members</p>
                      {filterValidTags(c.tags).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {filterValidTags(c.tags).slice(0, 3).map((tag) => (
                            <span key={tag} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${tagClass(tag)}`}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 shrink-0">
                      <SaveButton itemId={c.id} itemType="circle" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {showEvents && savedEvents.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Events</p>
              <div className="space-y-2">
                {savedEvents.map((e) => (
                  <article key={e.id} className="card-base card-hover p-4 flex items-center gap-3 relative">
                    <Link
                      to="/events/$eventHandle"
                      params={{ eventHandle: getEventHandle(e) }}
                      className="absolute inset-0 rounded-[inherit]"
                      aria-label={`View ${e.title}`}
                    />
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-soft to-accent-soft flex items-center justify-center text-2xl">
                      {CATEGORY_EMOJI[e.category] || "📅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{e.title}</p>
                      <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{e.date}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.going} going</span>
                      </div>
                    </div>
                    <div className="relative z-10 shrink-0">
                      <SaveButton itemId={e.id} itemType="event" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
