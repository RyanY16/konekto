import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bookmark, Briefcase, BriefcaseBusiness, Calendar, GraduationCap, Instagram, Languages, Linkedin, MapPin, MessageCircle, Pencil, Users } from "lucide-react";
import type { ComponentType } from "react";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/PageHeader";
import { tagClass } from "@/lib/tag-class";

export const Route = createFileRoute("/test2")({
  head: () => ({
    meta: [
      { title: "Test 2 — Konekto" },
      { name: "description", content: "Temporary dummy international student profile showcase." },
    ],
  }),
  component: TestProfilePage,
});

const profile = {
  name: "Brayden Peters",
  username: "brayden.in.tokyo",
  role: "User",
  bio: "Hi, I'm Brayden! I just moved to Tokyo for grad school and I'm excited to meet new people, practice Japanese, find great student deals, and explore creative events around the city!",
  university: "Waseda University",
  grade: "Masters · Year 1",
  nationality: "Canada",
  location: "Tokyo",
  languages: ["English", "French", "Japanese N3"],
  social: {
    instagram: "@brayden.in.tokyo",
    linkedin: "linkedin.com/in/brayden-peters",
    line: "@braydenpeters",
  },
  careerField: "Design / Product",
  goals: ["Make friends", "Find internships", "Practice Japanese"],
  interests: ["Visual Arts and Design", "Cultural Exchange", "Career and Networking", "Food and Drink"],
  stats: [
    { label: "Saved", value: "18" },
    { label: "Joined", value: "4" },
    { label: "Events", value: "7" },
  ],
  activity: [
    { icon: Users, title: "Tokyo Photo Walk Club", meta: "Joined this week" },
    { icon: Calendar, title: "Summer Language Picnic", meta: "Going Friday" },
    { icon: BriefcaseBusiness, title: "UX Research Internship", meta: "Saved opportunity" },
  ],
} as const;

function TestProfilePage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !isAdmin) return null;

  return <TestProfileShowcase />;
}

export function TestProfileShowcase() {
  return (
    <div>
      <PageHeader eyebrow="Profile" title="Your profile" />

      <section className="card-base mb-3 p-4 md:mb-4 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-4 md:mb-6">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <DefaultAvatar />
          </div>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-muted shrink-0">
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          <p className="text-sm font-medium text-muted-foreground">@{profile.username}</p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
            {profile.role}
          </span>
          <div className="pt-2 space-y-1">
            <ProfileFact label="School" text={profile.university} />
            <ProfileFact label="Year" text={profile.grade} />
            <ProfileFact label="Nationality" text={`🇨🇦 ${profile.nationality}`} />
            <ProfileFact label="Languages" text={profile.languages.join(" · ")} />
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-3 md:mt-5 md:pt-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bio</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
        </div>

        <div className="mt-3 border-t border-border pt-3 md:mt-5 md:pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:mb-3">Social links</p>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            <SocialChip icon={Instagram} label={profile.social.instagram} />
            <SocialChip icon={Linkedin} label="brayden-peters" />
            <SocialChip icon={MessageCircle} label={profile.social.line} />
          </div>
        </div>
      </section>

      <section className="card-base mb-4 space-y-4 p-4 md:mb-6 md:space-y-6 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Interests & goals</h2>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:mb-3">Interests</p>
          <ChipList items={profile.interests} />
        </div>

        <div className="border-t border-border pt-3 md:pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:mb-3">Career field</p>
          <span className="chip chip-primary">{profile.careerField}</span>
        </div>

        <div className="border-t border-border pt-3 md:pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:mb-3">Goals</p>
          <GoalList items={profile.goals} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Stat icon={Bookmark} label="Saved items" value="18" />
        <Stat icon={Users} label="Joined circles" value="4" />
        <Stat icon={Briefcase} label="Applications" value="6" />
      </div>

      <section className="card-base p-6">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Recent activity</h2>
          </div>
          <div className="space-y-2">
            {profile.activity.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.meta}</p>
                  </div>
                </div>
              );
            })}
          </div>
      </section>
    </div>
  );
}

function DefaultAvatar() {
  return (
    <div
      aria-label={profile.name}
      className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-soft"
      style={{ background: "linear-gradient(140deg,#5DB8EB,#694CE5)" }}
    >
      <svg viewBox="0 0 80 80" className="block h-full w-full" aria-hidden="true">
        <circle cx="40" cy="28" r="15" fill="rgba(255,255,255,.88)" />
        <ellipse cx="40" cy="72" rx="27" ry="23" fill="rgba(255,255,255,.88)" />
      </svg>
    </div>
  );
}

function ProfileFact({ label, text }: { label: string; text: string }) {
  return (
    <p className="text-sm leading-snug"><span className="text-muted-foreground">{label}: </span>{text}</p>
  );
}

function ChipList({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tagClass(item)}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function GoalList({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="chip chip-primary">{item}</span>
      ))}
    </div>
  );
}

function SocialChip({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium md:px-3 md:py-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0" />{label}
    </span>
  );
}

function Stat({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="card-base p-4 flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
