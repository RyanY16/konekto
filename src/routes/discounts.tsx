import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { getDeals, getDealHandle } from "@/data/backend";
import { deals as mockDeals } from "@/data/mock";
import { useAuth } from "@/components/AuthProvider";

export const Route = createFileRoute("/discounts")({
  head: () => ({
    meta: [
      { title: "Discounts — Konekto" },
      { name: "description", content: "Student discounts and deals — food, fashion, tech, and lifestyle perks across Japan." },
    ],
  }),
  staleTime: 30_000,
  loader: async () => {
    try {
      return { deals: await getDeals() };
    } catch {
      return { deals: mockDeals };
    }
  },
  pendingComponent: DiscountsSkeleton,
  component: DiscountsPage,
});

function DiscountsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="flex gap-2">{[...Array(6)].map((_, i) => <div key={i} className="h-9 w-24 bg-muted rounded-full" />)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="card-base h-56 bg-muted rounded" />)}
      </div>
    </div>
  );
}

const CATEGORIES = ["All", "Food & Drink", "Fashion", "Tech", "Entertainment", "Transport", "Lifestyle"] as const;

function DiscountsPage() {
  const { user } = useAuth();
  const { deals } = Route.useLoaderData();
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("All");
  const [studentOnly, setStudentOnly] = useState(false);

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (cat !== "All" && d.category !== cat) return false;
      if (modeFilter !== "All" && d.mode !== modeFilter) return false;
      if (studentOnly && !d.studentOnly) return false;
      if (q) {
        const ql = q.toLowerCase();
        if (!d.title.toLowerCase().includes(ql) && !d.brand.toLowerCase().includes(ql) && !(d.description ?? "").toLowerCase().includes(ql)) return false;
      }
      return true;
    });
  }, [deals, cat, modeFilter, studentOnly, q]);

  return (
    <div>
      <div className="flex items-start justify-between mb-0">
        <PageHeader
          eyebrow="Discounts"
          title="Student perks, sorted."
          subtitle="Exclusive deals for students — food, tech, fashion, and more."
        />
        {user && (
          <div className="mt-1 shrink-0">
            <Link
              to="/discounts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Add deal
            </Link>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by brand or deal…"
            className="w-full pl-10 pr-4 h-11 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                cat === c ? "bg-foreground text-background border-foreground" : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Online", "In-Person", "Both"].map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                modeFilter === m ? "bg-foreground text-background border-foreground" : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {m === "All" ? "All modes" : m}
            </button>
          ))}
          <button
            onClick={() => setStudentOnly((v) => !v)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              studentOnly ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-700" : "bg-card border-border hover:bg-muted"
            }`}
          >
            🎓 Student only
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((d) => (
          <article key={d.id} className="card-base card-hover flex flex-col relative overflow-hidden">
            <Link
              to="/discounts/$dealHandle"
              params={{ dealHandle: getDealHandle(d) }}
              className="absolute inset-0 rounded-[inherit]"
              aria-label={`View ${d.title}`}
            />
            {d.imageUrl ? (
              <div className="h-40 overflow-hidden">
                <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center bg-muted text-6xl">
                {d.emoji}
              </div>
            )}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{d.brand}</p>
                  <h3 className="font-semibold leading-snug">{d.title}</h3>
                </div>
                <SaveButton itemId={d.id} itemType="deal" />
              </div>

              {(d.originalPrice || d.newPrice) && (
                <div className="mt-3 flex items-center gap-2">
                  {d.newPrice && <span className="text-lg font-bold text-primary">{d.newPrice}</span>}
                  {d.originalPrice && <span className="text-sm text-muted-foreground line-through">{d.originalPrice}</span>}
                </div>
              )}

              {d.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{d.description}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.studentOnly && <span className="chip bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">🎓 Student only</span>}
                <span className="chip">{d.mode === "Online" ? "🌐 Online" : d.mode === "In-Person" ? "📍 In-Person" : "🌐📍 Online & In-Person"}</span>
                {d.saleEnd && <span className="chip">⏳ Ends {d.saleEnd}</span>}
              </div>

              <div className="mt-auto pt-3 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{d.category}</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shrink-0 relative z-10">View →</span>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">No deals match your filters.</p>
        )}
      </div>
    </div>
  );
}
