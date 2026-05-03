import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import AddCircleDialog from "@/components/AddCircleDialog";
import { getCircles, getCircleHandle, getProfilesByIds } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { tagClass } from "@/lib/tag-class";

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
      { name: "description", content: "Find your people. Browse university clubs and communities across Japan." },
    ],
  }),
  loaderDeps: () => ({}),
  staleTime: 30_000,
  loader: async () => {
    const cs = await getCircles();
    const ids = [...new Set(cs.map((c) => c.ownerId).filter(Boolean) as string[])];
    const profiles = ids.length > 0 ? await getProfilesByIds(ids) : [];
    const ownerMap: Record<string, string> = {};
    profiles.forEach((p) => { ownerMap[p.id] = p.username ?? p.displayName; });
    return { circles: cs, ownerMap };
  },
  component: CirclesPage,
});

const categories = ["All", "Tech", "Music", "Career", "Outdoors", "Arts"];

function CirclesPage() {
  const { user, isAdmin } = useAuth();
  const { circles: allCircles, ownerMap } = Route.useLoaderData();
  const [cat, setCat] = useState("All");
  const [englishOnly, setEnglishOnly] = useState(false);
  const [q, setQ] = useState("");

  const filtered = allCircles.filter((c) => {
    if (cat !== "All" && c.category !== cat) return false;
    if (englishOnly && !c.englishFriendly) return false;
    if (q) {
      const ql = q.toLowerCase();
      const matches =
        c.name.toLowerCase().includes(ql) ||
        c.description.toLowerCase().includes(ql) ||
        c.location?.toLowerCase().includes(ql) ||
        c.tags.some((t) => t.toLowerCase().includes(ql));
      if (!matches) return false;
    }
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
          {user && <AddCircleDialog />}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, location or tag…"
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
          <article key={c.id} className="card-base card-hover p-5 flex flex-col relative">
            {/* Full-card tap target */}
            <Link
              to="/circles/$circleHandle"
              params={{ circleHandle: getCircleHandle(c) }}
              className="absolute inset-0 rounded-[inherit]"
              aria-label={`View ${c.name}`}
            />
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

            <h3 className="mt-3 font-semibold text-lg leading-snug">{c.name}</h3>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{c.category} · {c.members} members</span>
              {c.location && (
                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{c.location}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>

            {/* Tags */}
            {c.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.tags.map((tag) => (
                  <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.englishFriendly && <span className="chip chip-accent">🌏 English-friendly</span>}
              <span className="chip">📊 {c.activity}</span>
              <span className="chip">⏱ {c.commitment}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between relative z-10">
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                {c.ownerId && ownerMap[c.ownerId] && (
                  <Link
                    to="/users/$username"
                    params={{ username: ownerMap[c.ownerId] }}
                    className="hover:underline relative z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    👑 @{ownerMap[c.ownerId]}
                  </Link>
                )}
                {relativeTime(c.updatedAt) && (
                  <span>{relativeTime(c.updatedAt)}</span>
                )}
              </div>
              <span className="text-sm font-semibold text-primary shrink-0">View →</span>
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
