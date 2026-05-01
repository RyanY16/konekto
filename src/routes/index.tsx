import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, TrendingUp, Calendar, Users } from "lucide-react";
import { circles, events, deals } from "@/data/mock";
import { SaveButton } from "@/components/SaveButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — Konekto" },
      {
        name: "description",
        content:
          "Your personalized student dashboard: events, circles, deals and opportunities curated for life in Japan.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const featured = events.slice(0, 3);
  const featuredCircles = circles.slice(0, 3);
  const trendingDeals = deals.slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-soft via-background to-accent-soft p-6 md:p-10 border border-border">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <Sparkles className="inline h-3.5 w-3.5 mr-1" /> Hi Yuki — おかえり
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

      {/* For you this week */}
      <Section
        title="For you this week"
        subtitle="Picked based on your interests in tech, finance, and international community."
        icon={<Sparkles className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((e) => (
            <article key={e.id} className="card-base card-hover p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{e.emoji}</div>
                <SaveButton />
              </div>
              <span className="chip chip-primary mt-3 self-start">{e.category}</span>
              <h3 className="mt-2 font-semibold leading-snug">{e.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{e.date}</p>
              <p className="text-sm text-muted-foreground">📍 {e.location}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                <Users className="inline h-3.5 w-3.5 mr-1" />
                {e.going} going
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* Featured circles */}
      <Section title="Featured circles" icon={<Users className="h-5 w-5" />} link="/circles">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredCircles.map((c) => (
            <article key={c.id} className="card-base card-hover p-5">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{c.emoji}</div>
                <SaveButton />
              </div>
              <h3 className="mt-3 font-semibold">{c.name}</h3>
              <p className="text-xs text-muted-foreground">
                {c.category} · {c.members} members
              </p>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.englishFriendly && <span className="chip chip-accent">🌏 English-friendly</span>}
                <span className="chip">{c.activity} activity</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Trending deals */}
      <Section title="Trending deals" icon={<TrendingUp className="h-5 w-5" />} link="/deals">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingDeals.map((d) => (
            <article key={d.id} className="card-base card-hover p-5 flex gap-4">
              <div className="text-4xl">{d.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{d.brand}</p>
                <h3 className="font-semibold truncate">{d.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{d.area}</p>
                <span className="chip chip-primary mt-2">{d.discount}</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Upcoming events strip */}
      <Section title="Upcoming events" icon={<Calendar className="h-5 w-5" />} link="/events">
        <div className="space-y-2">
          {events.slice(0, 4).map((e) => (
            <Link
              key={e.id}
              to="/events"
              className="card-base card-hover px-4 py-3 flex items-center gap-4"
            >
              <div className="text-2xl">{e.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.date} · {e.location}
                </p>
              </div>
              <span className="chip hidden sm:inline-flex">{e.category}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  link,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  link?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {link && (
          <Link
            to={link}
            className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
          >
            See all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
