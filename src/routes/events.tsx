import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, MapPin, Calendar } from "lucide-react";
import { events } from "@/data/mock";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Konekto" },
      {
        name: "description",
        content:
          "Mixers, hackathons, career forums and meetups for students in Japan. Save what you love.",
      },
    ],
  }),
  component: EventsPage,
});

const cats = ["All", "Social", "Career", "Hackathon", "Networking"] as const;

function EventsPage() {
  const [cat, setCat] = useState<(typeof cats)[number]>("All");
  const filtered = cat === "All" ? events : events.filter((e) => e.category === cat);

  return (
    <div>
      <PageHeader
        eyebrow="Events"
        title="What's happening."
        subtitle="From hanami picnics to career fairs — your weekend plans, sorted."
      />

      <div className="mb-6 flex flex-wrap gap-2">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((e) => (
          <article key={e.id} className="card-base card-hover overflow-hidden flex flex-col">
            <div className="h-28 bg-gradient-to-br from-primary-soft to-accent-soft flex items-center justify-center text-5xl">
              {e.emoji}
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="chip chip-primary">{e.category}</span>
                <SaveButton />
              </div>
              <h3 className="mt-3 font-semibold text-lg leading-snug">{e.title}</h3>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {e.date}
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {e.location}
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{e.going}</span> going
                </div>
                <button className="text-sm font-semibold text-primary hover:underline">
                  RSVP →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
