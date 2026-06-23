import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bookmark, BriefcaseBusiness, Calendar, MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { getCircles, getEvents, getDeals, getJobs, getCircleHandle, getEventHandle, getDealHandle, getJobHandle } from "@/data/backend";
import { useSaves } from "@/lib/saves";
import { filterValidTags, tagLabel } from "@/data/tags";
import { tagClass } from "@/lib/tag-class";
import { useAuth } from "@/components/AuthProvider";
import { CATEGORY_EMOJI, DEAL_CATEGORY_EMOJI } from "@/data/profile-options";
import { formatOpportunityDeadline } from "@/lib/opportunity-deadline";
import { formatYenPrice } from "@/lib/deal-price";
import type { Circle, EventItem, Deal, Job } from "@/data/mock";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved — Konekto" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { i18n } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { saves } = useSaves(user?.id);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [opportunities, setOpportunities] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "circles" | "events" | "discounts" | "opportunities">("all");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCircles(), getEvents(), getDeals(), getJobs()])
      .then(([cs, es, ds, os]) => {
        if (cancelled) return;
        setCircles(cs);
        setEvents(es);
        setDeals(ds);
        setOpportunities(os);
      })
      .catch((err) => {
        if (!cancelled) console.error("[saved] failed to load saved item data", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const savedCircles = circles.filter((c) => saves.circleIds.includes(c.id));
  const savedEvents = events.filter((e) => saves.eventIds.includes(e.id));
  const savedDeals = deals.filter((d) => saves.dealIds.includes(d.id));
  const savedOpportunities = opportunities.filter((o) => saves.opportunityIds.includes(o.id));
  const total = savedCircles.length + savedEvents.length + savedDeals.length + savedOpportunities.length;

  const showCircles = tab === "all" || tab === "circles";
  const showEvents = tab === "all" || tab === "events";
  const showDeals = tab === "all" || tab === "discounts";
  const showOpportunities = tab === "all" || tab === "opportunities";

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
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "circles", "events", "discounts", "opportunities"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
              tab === t
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            {t === "all" ? `All (${total})` : t === "circles" ? `Circles (${savedCircles.length})` : t === "events" ? `Events (${savedEvents.length})` : t === "discounts" ? `Discounts (${savedDeals.length})` : `Opportunities (${savedOpportunities.length})`}
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
          <p className="text-sm mt-1">Tap the bookmark icon on any circle, event, discount, or opportunity to save it here.</p>
          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            <Link to="/circles" className="text-sm font-medium text-primary hover:underline">Browse circles →</Link>
            <Link to="/events" className="text-sm font-medium text-primary hover:underline">Browse events →</Link>
            <Link to="/discounts" className="text-sm font-medium text-primary hover:underline">Browse discounts →</Link>
            <Link to="/careers" className="text-sm font-medium text-primary hover:underline">Browse opportunities →</Link>
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
                      <p className="text-xs text-muted-foreground">{c.category}</p>
                      {filterValidTags(c.tags).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {filterValidTags(c.tags).slice(0, 3).map((tag) => (
                            <span key={tag} className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${tagClass(tag)}`}>{tagLabel(tag, i18n.language)}</span>
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

          {showDeals && savedDeals.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Discounts</p>
              <div className="space-y-2">
                {savedDeals.map((d) => (
                  <article key={d.id} className="card-base card-hover p-4 flex items-center gap-3 relative">
                    <Link
                      to="/discounts/$dealHandle"
                      params={{ dealHandle: getDealHandle(d) }}
                      className="absolute inset-0 rounded-[inherit]"
                      aria-label={`View ${d.title}`}
                    />
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {(d as any).imageUrl ? (
                        <img src={(d as any).imageUrl} alt={d.brand} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl leading-none">{DEAL_CATEGORY_EMOJI[d.category] ?? "🏷️"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.brand} · {d.category}</p>
                      {d.newPrice && <p className="text-xs font-semibold text-primary mt-0.5">{formatYenPrice(d.newPrice)}</p>}
                    </div>
                    <div className="relative z-10 shrink-0">
                      <SaveButton itemId={d.id} itemType="deal" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {showOpportunities && savedOpportunities.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Opportunities</p>
              <div className="space-y-2">
                {savedOpportunities.map((o) => (
                  <article key={o.id} className="card-base card-hover p-4 flex items-center gap-3 relative">
                    <Link
                      to="/careers/$jobHandle"
                      params={{ jobHandle: getJobHandle(o) }}
                      className="absolute inset-0 rounded-[inherit]"
                      aria-label={`View ${o.title}`}
                    />
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-2xl">
                      {o.emoji || <BriefcaseBusiness className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{o.title}</p>
                      <p className="text-xs text-muted-foreground">{o.organization} · {o.category}</p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{o.location}</span>
                        {o.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatOpportunityDeadline(o.deadline)}</span>}
                      </div>
                    </div>
                    <div className="relative z-10 shrink-0">
                      <SaveButton itemId={o.id} itemType="opportunity" />
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
