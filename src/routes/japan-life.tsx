import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock } from "lucide-react";
import { guides } from "@/data/mock";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/japan-life")({
  head: () => ({
    meta: [
      { title: "Japan Life — Konekto" },
      {
        name: "description",
        content:
          "Practical guides for student life in Japan: housing, admin, and daily essentials.",
      },
    ],
  }),
  component: JapanLifePage,
});

const sections = ["All", "Housing", "Admin", "Daily Life"] as const;

function JapanLifePage() {
  const [s, setS] = useState<(typeof sections)[number]>("All");
  const filtered = s === "All" ? guides : guides.filter((g) => g.section === s);

  return (
    <div>
      <PageHeader
        eyebrow="Japan Life"
        title="Living here, simplified."
        subtitle="The guides we wish we had on day one."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setS(sec)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              s === sec
                ? "bg-foreground text-background border-foreground"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((g) => (
          <article key={g.id} className="card-base card-hover p-6 flex gap-4">
            <div className="text-4xl">{g.emoji}</div>
            <div className="flex-1 min-w-0">
              <span className="chip chip-accent">{g.section}</span>
              <h3 className="mt-2 font-semibold text-lg leading-snug">{g.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{g.excerpt}</p>
              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {g.readTime} read
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
