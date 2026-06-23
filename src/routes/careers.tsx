import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BriefcaseBusiness, Calendar, MapPin, Search, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BatchAddDialog } from "@/components/BatchAddDialog";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { getJobHandle, getJobs, deleteAllJobs } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { OPPORTUNITY_CATEGORIES, CATEGORY_EMOJI } from "@/data/profile-options";
import { filterValidTags, tagLabel } from "@/data/tags";
import { tagClass } from "@/lib/tag-class";
import { opportunityGradient } from "@/lib/placeholders";
import { formatOpportunityDeadline } from "@/lib/opportunity-deadline";
import { ListingCardHeader } from "@/components/ListingCardHeader";
import { categoryLabel } from "@/lib/category-label";
import type { Job } from "@/data/mock";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Opportunities — Konekto" },
      {
        name: "description",
        content:
          "Scholarships, part-time jobs, internships, study abroad programs, and student opportunities across Japan.",
      },
    ],
  }),
  staleTime: 0,
  loader: async () => {
    try {
      return { opportunities: await getJobs() };
    } catch (err) {
      console.error("[loader] opportunities failed", err);
      return { opportunities: [] };
    }
  },
  pendingComponent: OpportunitiesSkeleton,
  component: OpportunitiesPage,
});

const categories = ["All", ...OPPORTUNITY_CATEGORIES] as const;
const modes = ["All", "Online", "In-Person", "Hybrid"] as const;

function OpportunitiesSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-56 bg-muted rounded" />
      <div className="flex gap-2 flex-wrap">{[...Array(7)].map((_, i) => <div key={i} className="h-9 w-28 bg-muted rounded-full" />)}</div>
      <div className="flex flex-col gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="card-base h-36 bg-muted rounded" />)}
      </div>
    </div>
  );
}

function OpportunitiesPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const { opportunities } = Route.useLoaderData();
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [mode, setMode] = useState<(typeof modes)[number]>("All");
  const [q, setQ] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);

  const filtered = useMemo(() => {
    return opportunities.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (mode !== "All" && item.mode !== mode) return false;
      if (q) {
        const query = q.toLowerCase();
        const haystack = [
          item.title,
          item.organization,
          item.category,
          item.location,
          item.deadline,
          item.description,
          item.eligibility,
          ...item.tags,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [opportunities, category, mode, q]);

  return (
    <div>
      <div className="flex flex-col gap-3 mb-0 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          eyebrow={t("careers.eyebrow")}
          title={t("careers.title")}
          subtitle={t("careers.subtitle")}
        />
        {!authLoading && isAdmin && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:mt-1 sm:w-auto sm:shrink-0 sm:justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all opportunities?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes every opportunity. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async (event) => {
                      event.preventDefault();
                      setDeletingAll(true);
                      try { await deleteAllJobs(); await router.invalidate(); } finally { setDeletingAll(false); }
                    }}
                  >
                    {deletingAll ? "Deleting..." : "Delete all"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <BatchAddDialog type="opportunity" />
            <Link
              to="/careers/new"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:flex-none"
            >
              Add opportunity
            </Link>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={t("careers.searchPlaceholder")}
            className="w-full pl-10 pr-4 h-11 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect
            wrapperClassName="w-full sm:w-64"
            value={category}
            onChange={(event) => setCategory(event.target.value as (typeof categories)[number])}
            className="h-9 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter opportunities by category"
          >
            {categories.map((item) => <option key={item} value={item}>{categoryLabel(item, i18n.language)}</option>)}
          </NativeSelect>
          {modes.map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                mode === item ? "bg-foreground text-background border-foreground" : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((item) => <OpportunityCard key={item.id} item={item} />)}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">{t("careers.noResults")}</p>
        )}
      </div>
    </div>
  );
}

function OpportunityCard({ item }: { item: Job }) {
  const { i18n } = useTranslation();
  const tags = filterValidTags(item.tags).slice(0, 3);
  const deadline = formatOpportunityDeadline(item.deadline);

  return (
    <article className="card-base card-hover relative overflow-hidden">
      <Link
        to="/careers/$jobHandle"
        params={{ jobHandle: getJobHandle(item) }}
        className="absolute inset-0 rounded-[inherit]"
        aria-label={`View ${item.title}`}
      />
      <div className="flex gap-4 p-4 items-center">
        <div className={`w-32 h-32 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-5xl bg-gradient-to-br ${opportunityGradient(item.category)}`}>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            : (item.emoji || CATEGORY_EMOJI[item.category] || <BriefcaseBusiness className="h-9 w-9" />)
          }
        </div>

        <div className="flex flex-col flex-1 min-w-0 py-0.5">
          <ListingCardHeader
            category={categoryLabel(item.category, i18n.language)}
            title={item.title}
            subtitle={item.organization}
            badges={<span className="chip">{item.mode}</span>}
            action={<SaveButton itemId={item.id} itemType="opportunity" />}
          />

          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {item.location}
            </p>
            {deadline && (
              <p className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                Deadline: {deadline}
              </p>
            )}
          </div>

          {item.description && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{item.description}</p>}

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>
                  {tagLabel(tag, i18n.language)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
