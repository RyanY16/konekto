import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getDeals, getDealHandle, deleteAllDeals } from "@/data/backend";
import { deals as mockDeals } from "@/data/mock";
import { useAuth } from "@/components/AuthProvider";
import { DEAL_CATEGORY_EMOJI } from "@/data/profile-options";

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
  const { user, isAdmin } = useAuth();
  const { deals } = Route.useLoaderData();
  const router = useRouter();
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("All");
  const [studentOnly, setStudentOnly] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

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
                  <AlertDialogTitle>Delete all deals?</AlertDialogTitle>
                  <AlertDialogDescription>This permanently deletes every deal. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async (e) => {
                      e.preventDefault();
                      setDeletingAll(true);
                      try { await deleteAllDeals(); router.invalidate(); } finally { setDeletingAll(false); }
                    }}
                  >
                    {deletingAll ? "Deleting…" : "Delete all"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {user && (
            <Link
              to="/discounts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Add deal
            </Link>
          )}
        </div>
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

      <div className="flex flex-col gap-3">
        {filtered.map((d) => (
          <article key={d.id} className="card-base card-hover relative overflow-hidden">
            <Link
              to="/discounts/$dealHandle"
              params={{ dealHandle: getDealHandle(d) }}
              className="absolute inset-0 rounded-[inherit]"
              aria-label={`View ${d.title}`}
            />
            <div className="flex gap-4 p-4">
              {/* Portrait photo or emoji placeholder */}
              <div className="w-20 shrink-0 aspect-[3/4] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                {d.imageUrl
                  ? <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                  : <span className="text-3xl">{DEAL_CATEGORY_EMOJI[d.category] ?? "🏷️"}</span>
                }
              </div>

              {/* Text content */}
              <div className="flex flex-col flex-1 min-w-0 py-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{d.brand}</p>
                    <h3 className="font-semibold leading-snug">{d.title}</h3>
                  </div>
                  <SaveButton itemId={d.id} itemType="deal" />
                </div>

                {(d.originalPrice || d.newPrice) && (
                  <div className="mt-1.5 flex items-center gap-2">
                    {d.newPrice && <span className="text-base font-bold text-primary">{d.newPrice}</span>}
                    {d.originalPrice && <span className="text-sm text-muted-foreground line-through">{d.originalPrice}</span>}
                  </div>
                )}

                {d.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{d.description}</p>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {d.studentOnly && <span className="chip bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">🎓 Student only</span>}
                  <span className="chip">{d.mode === "Online" ? "🌐 Online" : d.mode === "In-Person" ? "📍 In-Person" : "🌐📍 Both"}</span>
                  {d.saleEnd && <span className="chip">⏳ Ends {d.saleEnd}</span>}
                  <span className="chip">{d.category}</span>
                </div>
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
