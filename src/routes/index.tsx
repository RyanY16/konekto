import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/AuthProvider";
import {
  Users, Calendar, Tag, Briefcase, MapPin, ArrowRight, Sparkles, TrendingUp, RefreshCw,
} from "lucide-react";
import { deals } from "@/data/mock";
import type { Circle, EventItem } from "@/data/mock";
import { getCircles, getEvents, getCircleHandle, getEventHandle } from "@/data/backend";
import { DEAL_CATEGORY_EMOJI, CATEGORY_EMOJI } from "@/data/profile-options";
import { SaveButton } from "@/components/SaveButton";
import { useOgImage } from "@/hooks/useOgImage";
import { eventGradient, dealGradient } from "@/lib/placeholders";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Konekto — Your campus, connected." },
      { name: "description", content: "Your personalized student hub for life in Japan." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { user, loading } = useAuth();
  if (loading) return <Landing />;
  if (user) return <Dashboard />;
  return <Landing />;
}

// ── Landing ────────────────────────────────────────────────────────────────────

const featureIcons = [Users, Calendar, Tag, Briefcase, MapPin];
const featureKeys = ["circles", "events", "deals", "careers", "japanLife"] as const;

function Landing() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="mx-auto max-w-6xl px-4">
        <section className="py-20 md:py-28 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" /> {t("home.eyebrow")}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            {t("home.tagline").split("\n").map((line, i) => (
              <span key={i}>{line}{i === 0 && <br className="hidden sm:block" />}</span>
            ))}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            {t("home.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("home.getStarted")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              {t("auth.login")}
            </Link>
          </div>
          <div className="mt-4">
            <Link to="/circles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("auth.continueAsGuest")}
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4">
            <a
              href="https://www.instagram.com/join.konekto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/joinkonekto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </section>

        <section className="pb-20">
          <div className="flex flex-col gap-4">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <div key={key} className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{t(`home.features.${key}.title`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`home.features.${key}.desc`)}</p>
                </div>
              );
            })}
            <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-6 text-primary-foreground flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-2">{t("home.cta.eyebrow")}</p>
                <h3 className="font-bold text-lg">{t("home.cta.title")}</h3>
                <p className="mt-1 text-sm opacity-80">{t("home.cta.subtitle")}</p>
              </div>
              <Link
                to="/signup"
                className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-white/20 hover:bg-white/30 px-4 py-2 text-sm font-semibold transition-colors"
              >
                {t("home.cta.button")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

function Dashboard() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  const trendingDeals = deals.slice(0, 3);

  function fetchData() {
    console.log("[home] fetchData start");
    setDataLoading(true);
    setDataError(false);
    let cancelled = false;
    Promise.all([getEvents(), getCircles()])
      .then(([evts, circs]) => {
        if (cancelled) { console.log("[home] fetchData cancelled"); return; }
        console.log(`[home] fetchData done — events=${evts.length} circles=${circs.length}`);
        setEvents(evts.slice(0, 3));
        setCircles(circs.slice(0, 3));
        setDataLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[home] fetchData error", err);
        setDataLoading(false);
        setDataError(true);
      });
    return () => { cancelled = true; };
  }

  useEffect(fetchData, []);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-soft via-background to-accent-soft p-6 md:p-10 border border-border">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <Sparkles className="inline h-3.5 w-3.5 mr-1" /> おかえり
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Your campus,<br className="hidden md:block" /> connected.
          </h1>
          <p className="mt-3 text-muted-foreground md:text-lg">
            Discover circles, events, deals and opportunities — all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/circles"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Explore circles <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Browse events
            </Link>
          </div>
        </div>
      </section>

      {dataError && (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4">
          <p className="text-sm text-muted-foreground">Couldn't load your feed. Check your connection.</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      <Section title="Upcoming events" subtitle="The latest events happening now." icon={<Sparkles className="h-5 w-5" />} link="/events">
        <div className="flex flex-col gap-3">
          {dataLoading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : events.map((e) => <HomeEventCard key={e.id} event={e} />)}
        </div>
      </Section>

      <Section title="Featured circles" icon={<Users className="h-5 w-5" />} link="/circles">
        <div className="flex flex-col gap-3">
          {dataLoading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : circles.map((c) => (
            <article key={c.id} className="card-base card-hover relative overflow-hidden">
              <Link
                to="/circles/$circleHandle"
                params={{ circleHandle: getCircleHandle(c) }}
                className="absolute inset-0 rounded-[inherit]"
                aria-label={`View ${c.name}`}
              />
              <div className="flex gap-4 p-4 items-center">
                <div className="w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                  {(c as any).iconUrl
                    ? <img src={(c as any).iconUrl} alt={c.name} className="w-full h-full object-cover" />
                    : <span className="text-5xl">{c.emoji}</span>
                  }
                </div>
                <div className="flex flex-col flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{c.category} · {c.members} members</p>
                      <h3 className="font-semibold leading-snug">{c.name}</h3>
                    </div>
                    <SaveButton itemId={c.id} itemType="circle" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="chip">{c.activity} activity</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Trending deals" icon={<TrendingUp className="h-5 w-5" />} link="/discounts">
        <div className="flex flex-col gap-3">
          {trendingDeals.map((d) => (
            <article key={d.id} className="card-base card-hover p-4 flex gap-4 items-center">
              <div className={`w-32 h-32 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-4xl bg-gradient-to-br ${dealGradient(d.category)}`}>
                {(d as any).imageUrl
                  ? <img src={(d as any).imageUrl} alt={d.title} className="w-full h-full object-cover" />
                  : <span>{DEAL_CATEGORY_EMOJI[d.category] ?? "🏷️"}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{d.brand}</p>
                <h3 className="font-semibold truncate">{d.title}</h3>
                {d.newPrice && <p className="mt-1 text-sm font-semibold text-primary">{d.newPrice}</p>}
                {d.studentOnly && <span className="chip mt-2">🎓 Student only</span>}
              </div>
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}

function HomeEventCard({ event: e }: { event: EventItem }) {
  const ogImage = useOgImage(!(e as any).imageUrl ? (e as any).socialLinks?.website : undefined);
  const displayImage = (e as any).imageUrl || ogImage;
  return (
    <article className="card-base card-hover relative overflow-hidden">
      <Link
        to="/events/$eventHandle"
        params={{ eventHandle: getEventHandle(e) }}
        className="absolute inset-0 rounded-[inherit]"
        aria-label={`View ${e.title}`}
      />
      <div className="flex gap-4 p-4 items-center">
        <div className={`w-32 h-32 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-5xl bg-gradient-to-br ${eventGradient(e.category)}`}>
          {displayImage
            ? <img src={displayImage} alt={e.title} className="w-full h-full object-cover" />
            : CATEGORY_EMOJI[e.category] || "📅"
          }
        </div>
        <div className="flex flex-col flex-1 min-w-0 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{e.category}</p>
              <h3 className="font-semibold leading-snug">{e.title}</h3>
            </div>
            <SaveButton itemId={e.id} itemType="event" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{e.date}</p>
          <p className="text-sm text-muted-foreground">📍 {e.location}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <Users className="inline h-3.5 w-3.5 mr-1" />{e.going} going
          </p>
        </div>
      </div>
    </article>
  );
}

function CardSkeleton() {
  return (
    <div className="card-base p-4 flex gap-4 items-center animate-pulse">
      <div className="w-32 h-32 shrink-0 rounded-xl bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/4 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    </div>
  );
}

function Section({
  title, subtitle, icon, link, children,
}: {
  title: string; subtitle?: string; icon?: React.ReactNode; link?: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            {icon}{title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link} className="text-sm font-medium text-primary hover:underline whitespace-nowrap">
            See all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
