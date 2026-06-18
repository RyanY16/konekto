import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getDeals, getDealHandle, deleteAllDeals } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { DEAL_CATEGORY_EMOJI } from "@/data/profile-options";
import { dealGradient } from "@/lib/placeholders";
import { BatchAddDialog } from "@/components/BatchAddDialog";
import { ListingCardHeader } from "@/components/ListingCardHeader";

export const Route = createFileRoute("/discounts")({
  head: () => ({
    meta: [
      { title: "Discounts — Konekto" },
      { name: "description", content: "Student discounts and deals — food, fashion, tech, and lifestyle perks across Japan." },
    ],
  }),
  staleTime: 0,
  loader: async () => {
    try {
      return { deals: await getDeals() };
    } catch (err) {
      console.error("[loader] deals failed", err);
      return { deals: [] };
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
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="card-base h-56 bg-muted rounded" />)}
      </div>
    </div>
  );
}

const CATEGORIES = ["All", "Food & Drink", "Fashion", "Tech", "Entertainment", "Transport", "Lifestyle"] as const;

function DiscountsPage() {
  const { t } = useTranslation();
  const { user, isAdmin, loading: authLoading } = useAuth();
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
          eyebrow={t("discounts.eyebrow")}
          title={t("discounts.title")}
          subtitle={t("discounts.subtitle")}
        />
        <div className="mt-1 shrink-0 flex items-center gap-2">
          {!authLoading && isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("discounts.confirmDeleteAll")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("discounts.confirmDeleteAllDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAll}>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async (e) => {
                      e.preventDefault();
                      setDeletingAll(true);
                      try { await deleteAllDeals(); router.invalidate(); } finally { setDeletingAll(false); }
                    }}
                  >
                    {deletingAll ? t("common.deleting") : t("common.deleteAll")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {!authLoading && isAdmin && <BatchAddDialog type="deal" />}
          {user && (
            <Link
              to="/discounts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("discounts.addDeal")}
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
            placeholder={t("discounts.searchPlaceholder")}
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
          {(["All", "Online", "In-Person", "Both"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                modeFilter === m ? "bg-foreground text-background border-foreground" : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {m === "All" ? t("discounts.allModes") : m === "Online" ? t("discounts.filters.online") : m === "In-Person" ? t("discounts.filters.inPerson") : t("discounts.filters.both")}
            </button>
          ))}
          <button
            onClick={() => setStudentOnly((v) => !v)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              studentOnly ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-700" : "bg-card border-border hover:bg-muted"
            }`}
          >
            {t("discounts.studentOnly")}
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
            <div className="flex gap-4 p-4 items-center">
              {/* Portrait photo or emoji placeholder */}
              <div className={`w-32 h-32 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-4xl bg-gradient-to-br ${dealGradient(d.category)}`}>
                {d.imageUrl
                  ? <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                  : <span>{DEAL_CATEGORY_EMOJI[d.category] ?? "🏷️"}</span>
                }
              </div>

              {/* Text content */}
              <div className="flex flex-col flex-1 min-w-0 py-0.5">
                <ListingCardHeader
                  category={d.category}
                  title={d.title}
                  subtitle={d.brand}
                  action={<SaveButton itemId={d.id} itemType="deal" />}
                />

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
                  {d.studentOnly && <span className="chip bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">{t("discounts.card.studentOnly")}</span>}
                  <span className="chip">{d.mode === "Online" ? `🌐 ${t("common.online")}` : d.mode === "In-Person" ? `📍 ${t("common.inPerson")}` : `🌐📍 ${t("common.both")}`}</span>
                  {d.saleEnd && <span className="chip">{t("discounts.card.endsOn")} {d.saleEnd}</span>}
                </div>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">{t("discounts.noResults")}</p>
        )}
      </div>
    </div>
  );
}
