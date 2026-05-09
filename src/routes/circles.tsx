import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Trash2, ArrowUpDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LANGUAGES, CIRCLE_CATEGORIES } from "@/data/profile-options";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { getCircles, getCircleHandle, getProfilesByIds, deleteAllCircles, getCurrentUserInterests } from "@/data/backend";
import { filterValidTags } from "@/data/tags";
import { useAuth } from "@/components/AuthProvider";
import { tagClass } from "@/lib/tag-class";
import { OwnerBadge } from "@/components/OwnerBadge";
import { circles as mockCircles } from "@/data/mock";

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
    try {
      const [cs, userInterests] = await Promise.all([getCircles(), getCurrentUserInterests().catch(() => [])]);
      const ids = [...new Set(cs.map((c) => c.ownerId).filter(Boolean) as string[])];
      const ownerMap: Record<string, { username: string; displayName: string; avatarUrl: string | null }> = {};
      if (ids.length > 0) {
        const profiles = await getProfilesByIds(ids).catch(() => []);
        profiles.forEach((p) => { ownerMap[p.id] = { username: p.username ?? p.displayName, displayName: p.displayName, avatarUrl: p.avatarUrl }; });
      }
      return { circles: cs, ownerMap, userInterests };
    } catch {
      return { circles: mockCircles, ownerMap: {}, userInterests: [] };
    }
  },
  pendingComponent: CirclesSkeleton,
  component: CirclesPage,
});

function CirclesSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => <div key={i} className="h-9 w-20 bg-muted rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card-base p-5 space-y-3">
            <div className="h-10 w-10 bg-muted rounded-lg" />
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="h-3 w-32 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-3/4 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

const categories = ["All", ...CIRCLE_CATEGORIES] as const;

type SortKey = "relevant" | "newest" | "updated" | "az" | "popular";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevant", label: "Most relevant" },
  { value: "newest",   label: "Newest" },
  { value: "updated",  label: "Recently updated" },
  { value: "az",       label: "A → Z" },
  { value: "popular",  label: "Most members" },
];

function tagOverlap(circleTags: string[], userInterests: string[]): number {
  const userSet = new Set(userInterests);
  return circleTags.filter((t) => userSet.has(t)).length;
}

function CirclesPage() {
  const { user, isAdmin } = useAuth();
  const { circles: allCircles, ownerMap, userInterests } = Route.useLoaderData();
  const router = useRouter();
  const [deletingAll, setDeletingAll] = useState(false);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [uniFilter, setUniFilter] = useState("All");
  const [langFilter, setLangFilter] = useState("All");
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(userInterests.length > 0 ? "relevant" : "newest");

  const universities = useMemo(() => {
    const set = new Set(allCircles.map((c) => (c as any).university).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [allCircles]);

  const languages = useMemo(() => {
    const set = new Set(allCircles.map((c) => (c as any).primaryLanguage).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [allCircles]);

  const filtered = useMemo(() => {
    const base = allCircles.filter((c) => {
      if (cat !== "All" && c.category !== cat) return false;
      if (uniFilter !== "All" && (c as any).university !== uniFilter) return false;
      if (langFilter !== "All" && (c as any).primaryLanguage !== langFilter) return false;
      if (recruitingOnly && !(c as any).recruiting) return false;
      if (q) {
        const ql = q.toLowerCase();
        const matches =
          c.name.toLowerCase().includes(ql) ||
          c.description.toLowerCase().includes(ql) ||
          c.tags.some((t) => t.toLowerCase().includes(ql));
        if (!matches) return false;
      }
      return true;
    });

    return [...base].sort((a, b) => {
      switch (sortKey) {
        case "relevant":
          return tagOverlap(b.tags, userInterests) - tagOverlap(a.tags, userInterests);
        case "newest":
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        case "updated":
          return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
        case "az":
          return a.name.localeCompare(b.name);
        case "popular":
          return b.members - a.members;
      }
    });
  }, [allCircles, cat, uniFilter, langFilter, recruitingOnly, q, sortKey, userInterests]);

  return (
    <div>
      <div className="flex items-start justify-between mb-0">
        <PageHeader
          eyebrow="Circles"
          title="Find your circles."
          subtitle="From hackathons to hiking clubs — discover the communities that fit you."
        />
        <div className="mt-1 shrink-0 flex items-center gap-2">
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all circles?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes every circle. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async (e) => {
                      e.preventDefault();
                      setDeletingAll(true);
                      try { await deleteAllCircles(); router.invalidate(); } finally { setDeletingAll(false); }
                    }}
                  >
                    {deletingAll ? "Deleting…" : "Delete all"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Link
            to={user ? "/circles/new" : "/signup"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Add circle
          </Link>
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
        {/* Category pills */}
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
        </div>
        {/* Sort + secondary filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 rounded-full border border-border bg-card pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {universities.length > 2 && (
            <select
              value={uniFilter}
              onChange={(e) => setUniFilter(e.target.value)}
              className="h-9 rounded-full border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {universities.map((u) => <option key={u} value={u}>{u === "All" ? "All universities" : u}</option>)}
            </select>
          )}
          {languages.length > 2 && (
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="h-9 rounded-full border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {languages.map((l) => {
                const flag = l === "All" ? null : LANGUAGES.find((x) => x.name === l)?.flag;
                return <option key={l} value={l}>{l === "All" ? "All languages" : `${flag ?? ""} ${l}`}</option>;
              })}
            </select>
          )}
          <button
            onClick={() => setRecruitingOnly((v) => !v)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              recruitingOnly
                ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            ✅ Recruiting only
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
              <SaveButton itemId={c.id} itemType="circle" />
            </div>

            <h3 className="mt-3 font-semibold text-lg leading-snug">{c.name}</h3>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{c.category} · {c.members} members</span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>

            {/* Tags */}
            {filterValidTags(c.tags).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {filterValidTags(c.tags).map((tag) => (
                  <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.recruiting && <span className="chip bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">✅ Recruiting</span>}
              {c.englishFriendly && <span className="chip">🌏 English-friendly</span>}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between relative z-10">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {c.ownerId && ownerMap[c.ownerId] && (
                  <OwnerBadge
                    username={ownerMap[c.ownerId].username}
                    displayName={ownerMap[c.ownerId].displayName}
                    avatarUrl={ownerMap[c.ownerId].avatarUrl}
                  />
                )}
                {relativeTime(c.updatedAt) && (
                  <span>{relativeTime(c.updatedAt)}</span>
                )}
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shrink-0">View →</span>
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
