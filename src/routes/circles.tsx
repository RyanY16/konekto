import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { circles } from "@/data/mock";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";

export const Route = createFileRoute("/circles")({
  head: () => ({
    meta: [
      { title: "Circles — Konekto" },
      {
        name: "description",
        content:
          "Find your people. Browse university clubs and communities across Japan, filtered by interest, commitment and language.",
      },
    ],
  }),
  component: CirclesPage,
});

const categories = ["All", "Tech", "Music", "Career", "Outdoors", "Arts"];

function CirclesPage() {
  const [cat, setCat] = useState("All");
  const [englishOnly, setEnglishOnly] = useState(false);
  const [q, setQ] = useState("");

  const filtered = circles.filter((c) => {
    if (cat !== "All" && c.category !== cat) return false;
    if (englishOnly && !c.englishFriendly) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Circles"
        title="Find your circles."
        subtitle="From hackathons to hiking clubs — discover the communities that fit you."
      />

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search circles..."
            className="w-full pl-10 pr-4 h-11 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                cat === c
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setEnglishOnly((v) => !v)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              englishOnly
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            🌏 English-friendly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <article key={c.id} className="card-base card-hover p-5 flex flex-col">
            <div className="flex items-start justify-between">
              <div className="text-4xl">{c.emoji}</div>
              <SaveButton />
            </div>
            <h3 className="mt-3 font-semibold text-lg">{c.name}</h3>
            <p className="text-xs text-muted-foreground">
              {c.category} · {c.members} members
            </p>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.englishFriendly && <span className="chip chip-accent">🌏 English-friendly</span>}
              <span className="chip">📊 {c.activity} activity</span>
              <span className="chip">⏱ {c.commitment}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>💬 LINE</span>
                <span>📷 IG</span>
              </div>
              <button className="text-sm font-semibold text-primary hover:underline">
                View →
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">
            No circles match your filters.
          </p>
        )}
      </div>
    </div>
  );
}
