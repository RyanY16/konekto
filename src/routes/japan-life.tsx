import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getGuides, getGuideHandle, deleteAllGuides } from "@/data/backend";
import { guides as mockGuides } from "@/data/mock";
import { useAuth } from "@/components/AuthProvider";

export const Route = createFileRoute("/japan-life")({
  head: () => ({
    meta: [
      { title: "Japan Life — Konekto" },
      { name: "description", content: "Practical guides for student life in Japan: housing, admin, and daily essentials." },
    ],
  }),
  staleTime: 30_000,
  loader: async () => {
    try {
      return { guides: await getGuides() };
    } catch {
      return { guides: mockGuides };
    }
  },
  component: JapanLifePage,
});

const sections = ["All", "Housing", "Admin", "Daily Life"] as const;

function JapanLifePage() {
  const { isAdmin } = useAuth();
  const { guides } = Route.useLoaderData();
  const router = useRouter();
  const [s, setS] = useState<(typeof sections)[number]>("All");
  const [deletingAll, setDeletingAll] = useState(false);

  const filtered = s === "All" ? guides : guides.filter((g) => g.section === s);

  return (
    <div>
      <div className="flex items-start justify-between mb-0">
        <PageHeader
          eyebrow="Japan Life"
          title="Living here, simplified."
          subtitle="The guides we wish we had on day one."
        />
        {isAdmin && (
          <div className="mt-1 shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all guides?</AlertDialogTitle>
                  <AlertDialogDescription>This permanently deletes every guide. This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingAll}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async (e) => {
                      e.preventDefault();
                      setDeletingAll(true);
                      try { await deleteAllGuides(); router.invalidate(); } finally { setDeletingAll(false); }
                    }}
                  >
                    {deletingAll ? "Deleting…" : "Delete all"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {sections.map((sec) => (
          <button
            key={sec}
            onClick={() => setS(sec)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              s === sec ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted"
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((g) => (
          <article key={g.id} className="card-base card-hover p-6 flex gap-4 relative">
            <Link
              to="/japan-life/$guideHandle"
              params={{ guideHandle: getGuideHandle(g) }}
              className="absolute inset-0 rounded-[inherit]"
              aria-label={`Read ${g.title}`}
            />
            <div className="text-4xl shrink-0">{g.emoji}</div>
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
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">No guides in this section yet.</p>
        )}
      </div>
    </div>
  );
}
