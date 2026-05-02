import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import AddCircleDialog from "@/components/AddCircleDialog";
import { getCircles, getCircleHandle, getProfilesByIds } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import type { Circle } from "@/data/mock";

function relativeTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 30) return `Updated ${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Updated ${months}mo ago`;
  return `Updated ${Math.floor(months / 12)}y ago`;
}

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
  const { isAdmin } = useAuth();
  const [allCircles, setAllCircles] = useState<Circle[]>([]);
  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({});
  const [cat, setCat] = useState("All");
  const [englishOnly, setEnglishOnly] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    getCircles().then(async (cs) => {
      setAllCircles(cs);
      const ids = [...new Set(cs.map((c) => c.ownerId).filter(Boolean) as string[])];
      if (ids.length === 0) return;
      const profiles = await getProfilesByIds(ids);
      const map: Record<string, string> = {};
      profiles.forEach((p) => { map[p.id] = p.username ?? p.displayName; });
      setOwnerMap(map);
    });
  }, []);

  const filtered = allCircles.filter((c) => {
    if (cat !== "All" && c.category !== cat) return false;
    if (englishOnly && !c.englishFriendly) return false;
    if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-0">
        <PageHeader
          eyebrow="Circles"
          title="Find your circles."
          subtitle="From hackathons to hiking clubs — discover the communities that fit you."
        />
        <div className="mt-1 shrink-0">
          {isAdmin && <AddCircleDialog />}
        </div>
      </div>

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
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                {(c as any).iconUrl ? (
                  <img src={(c as any).iconUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <span className="text-4xl leading-none">{c.emoji}</span>
                )}
              </div>
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
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {c.ownerId && ownerMap[c.ownerId] && (
                  <span>👑 Owned by @{ownerMap[c.ownerId]}</span>
                )}
                {relativeTime(c.updatedAt) && (
                  <span>{relativeTime(c.updatedAt)}</span>
                )}
              </div>
              <Link
                to="/circles/$circleHandle"
                params={{ circleHandle: getCircleHandle(c) }}
                className="text-sm font-semibold text-primary hover:underline shrink-0"
              >
                View →
              </Link>
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
