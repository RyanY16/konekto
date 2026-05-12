import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import {
  Users, Calendar, Tag, Briefcase, MapPin, ArrowRight, Sparkles, TrendingUp,
} from "lucide-react";
import { deals } from "@/data/mock";
import type { Circle, EventItem } from "@/data/mock";
import { getCircles, getEvents, getCircleHandle, getEventHandle } from "@/data/backend";
import { DEAL_CATEGORY_EMOJI } from "@/data/profile-options";
import { SaveButton } from "@/components/SaveButton";
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
  if (loading) return null;
  if (user) return <Dashboard />;
  return <Landing />;
}

// ── Landing ────────────────────────────────────────────────────────────────────

const features = [
  { icon: Users,     title: "Circles",    desc: "Find student clubs and communities that match your interests." },
  { icon: Calendar,  title: "Events",     desc: "Discover campus events, meetups, and cultural experiences." },
  { icon: Tag,       title: "Deals",      desc: "Exclusive student discounts at shops, cafés, and services." },
  { icon: Briefcase, title: "Careers",    desc: "Internships and job opportunities for international students." },
  { icon: MapPin,    title: "Japan Life", desc: "Practical guides for navigating daily life in Japan." },
];

function Landing() {
  return (
    <div>
      <div className="mx-auto max-w-6xl px-4">
        <section className="py-20 md:py-28 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" /> For students in Japan
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Your campus,<br className="hidden sm:block" /> connected.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            With Konekto, discover student circles, events, and opportunities across every university in Japan - all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Log in
            </Link>
          </div>
          <div className="mt-4">
            <Link to="/circles" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Continue as guest →
            </Link>
          </div>
        </section>

        <section className="pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-2">Ready?</p>
                <h3 className="font-bold text-lg">Join Konekto today</h3>
                <p className="mt-1 text-sm opacity-80">It's free for all students.</p>
              </div>
              <Link
                to="/signup"
                className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-white/20 hover:bg-white/30 px-4 py-2 text-sm font-semibold transition-colors"
              >
                Sign up <ArrowRight className="h-4 w-4" />
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
  const trendingDeals = deals.slice(0, 3);

  useEffect(() => {
    getEvents().then((data) => setEvents(data.slice(0, 3))).catch(() => {});
    getCircles().then((data) => setCircles(data.slice(0, 3))).catch(() => {});
  }, []);

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

      <Section title="Upcoming events" subtitle="The latest events happening now." icon={<Sparkles className="h-5 w-5" />} link="/events">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.map((e) => (
            <Link
              key={e.id}
              to="/events/$eventHandle"
              params={{ eventHandle: getEventHandle(e) }}
              className="card-base card-hover p-5 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div className="text-3xl">{e.emoji}</div>
                <SaveButton itemId={e.id} itemType="event" />
              </div>
              <span className="chip chip-primary mt-3 self-start">{e.category}</span>
              <h3 className="mt-2 font-semibold leading-snug">{e.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{e.date}</p>
              <p className="text-sm text-muted-foreground">📍 {e.location}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                <Users className="inline h-3.5 w-3.5 mr-1" />{e.going} going
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Featured circles" icon={<Users className="h-5 w-5" />} link="/circles">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {circles.map((c) => (
            <Link
              key={c.id}
              to="/circles/$circleHandle"
              params={{ circleHandle: getCircleHandle(c) }}
              className="card-base card-hover p-5 block"
            >
              <div className="flex items-start justify-between">
                <div className="text-3xl">{c.emoji}</div>
                <SaveButton itemId={c.id} itemType="circle" />
              </div>
              <h3 className="mt-3 font-semibold">{c.name}</h3>
              <p className="text-xs text-muted-foreground">{c.category} · {c.members} members</p>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="chip">{c.activity} activity</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Trending deals" icon={<TrendingUp className="h-5 w-5" />} link="/discounts">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendingDeals.map((d) => (
            <article key={d.id} className="card-base card-hover p-5 flex gap-4">
              <div className="text-4xl">{DEAL_CATEGORY_EMOJI[d.category] ?? "🏷️"}</div>
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
