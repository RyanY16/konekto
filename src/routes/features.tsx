import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Bell,
  BookMarked,
  CircleDot,
  CircleUser,
  LockKeyhole,
  MapPin,
  NotebookText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

type FeatureGroup = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  items: { title: string; description: string }[];
};

const featureGroups: FeatureGroup[] = [
  {
    eyebrow: "Profiles",
    title: "Build a student profile that feels complete.",
    description: "Profiles collect the fields people use to introduce themselves, show interests, and share contact paths.",
    icon: CircleUser,
    items: [
      { title: "Basic fields", description: "Display name, username, avatar, bio, university, nationality, degree, and graduation year." },
      { title: "Interest tags", description: "Add tags for interests so others can find people with shared communities and hobbies." },
      { title: "Goals and fields", description: "Capture goals, career fields, and other profile details used for discovery and matching." },
      { title: "Languages", description: "Share language ability and fluency levels for better collaboration and social discovery." },
      { title: "Social links", description: "Link Instagram, LinkedIn, website, and other social profiles from one place." },
    ],
  },
  {
    eyebrow: "Circles",
    title: "Manage clubs, communities, and recruiting.",
    description: "Circle pages are structured so students can quickly judge fit, activity, and who can join.",
    icon: Users,
    items: [
      { title: "Circle fields", description: "Name, description, category, university, language, activity level, and socials." },
      { title: "Recruiting status", description: "A recruiting boolean makes it obvious which circles are open to new members." },
      { title: "Roles", description: "Owner, manager, and member roles separate editing, moderation, and participation." },
      { title: "Approvals", description: "Join requests and membership approvals keep private or selective circles in control." },
      { title: "Last updated", description: "Freshness indicators help people trust what they are reading." },
    ],
  },
  {
    eyebrow: "Events",
    title: "Create events and connect them to circles.",
    description: "Event pages carry the details students need and can be tied back to the circles hosting them.",
    icon: CircleDot,
    items: [
      { title: "Event fields", description: "Title, date, time, location, description, emoji, category, and tags." },
      { title: "Hosting circles", description: "Events can be linked to one or more circles so ownership stays visible." },
      { title: "Attendees", description: "Attendee review tools make participation easier to manage." },
      { title: "Collab requests", description: "Circles can review and approve event collaboration requests." },
      { title: "Join flow", description: "Students can join, save, or revisit event pages from discovery." },
    ],
  },
  {
    eyebrow: "Discovery",
    title: "Find the right things faster.",
    description: "Search, filters, and sorting keep the directory usable as it grows.",
    icon: Search,
    items: [
      { title: "Global search", description: "The top bar search helps users jump between circles, events, and pages quickly." },
      { title: "Sort and filter", description: "Circles and events support search, category filters, and sort options." },
      { title: "Tags everywhere", description: "Interest, circle, and event tags improve browsing and matching." },
      { title: "Saved feature", description: "Bookmark circles and events to keep a personal list of what matters." },
      { title: "Guest browsing", description: "People can explore the app before creating an account." },
    ],
  },
  {
    eyebrow: "Accounts",
    title: "Sign up and sign in your way.",
    description: "Authentication is designed to be simple for students on mobile or desktop.",
    icon: LockKeyhole,
    items: [
      { title: "Email sign up", description: "Create an account with email and password." },
      { title: "Google sign in", description: "Use Google when that is faster or easier." },
      { title: "Profile completion", description: "A guided onboarding flow collects the fields needed for a useful profile." },
      { title: "Sign out", description: "Users can leave their session from the main shell controls." },
      { title: "Auth-aware UI", description: "Saved items, notifications, and account actions appear when signed in." },
    ],
  },
  {
    eyebrow: "Moderation",
    title: "Keep the directory accurate and safe.",
    description: "Owners and admins have the controls needed to maintain the platform.",
    icon: ShieldCheck,
    items: [
      { title: "Owner badges", description: "Records show who owns or manages them, so accountability is visible." },
      { title: "Delete controls", description: "Admins can remove outdated or incorrect records." },
      { title: "Approval flows", description: "Join requests and collaboration requests can be reviewed before they go live." },
      { title: "Notifications", description: "Important actions can surface in-app notifications for signed-in users." },
      { title: "Theme settings", description: "Color and theme controls live in the app shell for quick adjustments." },
    ],
  },
];

const highlightCards = [
  { icon: Sparkles, title: "Student-first discovery", text: "Circles, events, deals, careers, and guides are grouped where students actually need them." },
  { icon: BookMarked, title: "Saved lists", text: "Bookmark circles and events so your personal shortlist stays one tap away." },
  { icon: Tags, title: "Tags everywhere", text: "Profiles, circles, and events use tags to improve search, browsing, and matching." },
  { icon: Bell, title: "Notifications", text: "Signed-in users get activity and workflow updates surfaced in the app shell." },
  { icon: MapPin, title: "Built for Japan", text: "Content and copy are tuned for students living, studying, and working in Japan." },
];

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Konekto" },
      {
        name: "description",
        content: "Profiles, circles, events, discovery, authentication, notifications, and moderation in Konekto.",
      },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl py-8 space-y-10">
      <div className="space-y-4">
        <PageHeader
          eyebrow="Features"
          title="Everything Konekto does."
          subtitle="A more complete view of profiles, circles, events, accounts, discovery, notifications, and moderation."
        />
        <div className="flex flex-wrap gap-3">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors"
          >
            Back to About
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {highlightCards.map(({ icon: Icon, title, text }) => (
          <article key={title} className="card-base p-6">
            <div className="h-11 w-11 rounded-2xl bg-primary-soft flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        {featureGroups.map(({ eyebrow, title, description, icon: Icon, items }) => (
          <article key={title} className="card-base p-6 md:p-7 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{eyebrow}</p>
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <article className="card-base p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <NotebookText className="h-4 w-4" />
            Supporting areas
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              "Deals with student discounts and lifestyle perks",
              "Careers with internships, part-time jobs, and opportunities",
              "Japan Life guides for housing, admin, and daily essentials",
              "Profile, saved items, and settings pages",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background p-4 text-muted-foreground leading-relaxed">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-primary/20 bg-primary/5 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Settings className="h-4 w-4" />
            Product notes
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Konekto is designed to work as a searchable directory, a personal bookmark list, and a lightweight publishing tool for student communities in Japan.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            {[
              "Desktop + mobile",
              "Guest browsing",
              "Signed-in saves",
              "Admin moderation",
              "Theme controls",
            ].map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-3 py-1.5">
                {tag}
              </span>
            ))}
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/circles"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse circles <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-background transition-colors"
            >
              Browse events
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
