import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Loader2, Clock, History, Check, X, Search, Plus, FlaskConical, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { TestFeedShowcase } from "@/routes/test";
import { TestProfileShowcase } from "@/routes/test2";
import {
  getCircles,
  getEvents,
  getDeals,
  deleteCircle,
  deleteEvent,
  deleteDeal,
  getCircleHandle,
  getEventHandle,
  getDealHandle,
  getModerationQueue,
  getModerationHistory,
  moderatePost,
  getImportSources,
  addImportSource,
  updateImportSource,
  getImportCandidates,
  deleteAllImportCandidates,
  runImportDiscovery,
  approveImportCandidate,
  rejectImportCandidate,
} from "@/data/backend";
import { moderateTexts, CATEGORY_META, CATEGORIES_SORTED } from "@/lib/moderation";
import type { ModerationResult } from "@/lib/moderation";
import type { ModerationQueueItem, ModerationHistoryItem, ImportCandidate, ImportCandidateStatus, ImportCandidateType, ImportSource, ImportSourceType } from "@/data/backend";
import type { Circle, EventItem, Deal } from "@/data/mock";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type PostType = "circle" | "event" | "deal";

type Post = {
  type: PostType;
  id: string;
  title: string;
  description: string;
  createdAt: string | undefined;
  href: string;
  raw: Circle | EventItem | Deal;
};

type AnalysedPost = Post & {
  moderation: ModerationResult;
};

type FilterType = "all" | "flagged" | "circle" | "event" | "deal";
type SortKey = "risk" | "newest" | "type";
type ImportTypeFilter = "all" | ImportCandidateType;
type ImportRejectionFilter = "all" | "rejected" | "not_rejected";

function buildText(post: Post): string {
  return [post.title, post.description].filter(Boolean).join(" ");
}

function riskLevel(score: number, flagged: boolean): "flagged" | "high" | "medium" | "low" | "clean" {
  if (flagged) return "flagged";
  if (score >= 0.5) return "high";
  if (score >= 0.15) return "medium";
  if (score >= 0.03) return "low";
  return "clean";
}

const RISK_CONFIG = {
  flagged: { label: "Flagged",  bar: "bg-red-600",    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",    icon: "text-red-600" },
  high:    { label: "High",     bar: "bg-orange-500", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", icon: "text-orange-500" },
  medium:  { label: "Medium",   bar: "bg-yellow-500", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300", icon: "text-yellow-500" },
  low:     { label: "Low",      bar: "bg-blue-400",   badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",    icon: "text-blue-400" },
  clean:   { label: "Clean",    bar: "bg-emerald-500",badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: "text-emerald-500" },
};

const TYPE_BADGE: Record<PostType, string> = {
  circle: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  event:  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  deal:   "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const IMPORT_STATUS_BADGE: Record<ImportCandidateStatus, string> = {
  new: "bg-primary/10 text-primary",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  duplicate: "bg-muted text-muted-foreground",
};

function ScoreBar({ score, colorClass }: { score: number; colorClass: string }) {
  const pct = Math.min(100, score * 100);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums w-10 text-right text-muted-foreground">
        {(score * 100).toFixed(1)}%
      </span>
    </div>
  );
}

function PostCard({
  post,
  onDelete,
}: {
  post: AnalysedPost;
  onDelete: (post: AnalysedPost) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const level = riskLevel(post.moderation.topScore, post.moderation.flagged);
  const cfg = RISK_CONFIG[level];

  // Sort categories by score desc for display
  const sortedCategories = [...CATEGORIES_SORTED].sort(
    (a, b) => post.moderation.scores[b] - post.moderation.scores[a],
  );

  async function handleDelete() {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      if (post.type === "circle") await deleteCircle(post.id);
      else if (post.type === "event") await deleteEvent(post.id);
      else await deleteDeal(post.id);
      onDelete(post);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <div className={`rounded-xl border ${level === "flagged" || level === "high" ? "border-red-300 dark:border-red-800" : "border-border"} bg-card overflow-hidden`}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide ${TYPE_BADGE[post.type]}`}>
              {post.type}
            </span>
            <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 flex items-center gap-1 ${cfg.badge}`}>
              {level === "flagged" && <AlertTriangle className="h-3 w-3" />}
              {level === "clean" && <CheckCircle className="h-3 w-3" />}
              {cfg.label} risk
            </span>
          </div>
          <a
            href={post.href}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-sm hover:underline flex items-center gap-1 leading-tight"
          >
            {post.title}
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
          </a>
          {post.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{post.description}</p>
          )}
        </div>

        {/* Overall risk score */}
        <div className="shrink-0 text-right">
          <div className={`text-2xl font-bold tabular-nums ${cfg.icon}`}>
            {(post.moderation.topScore * 100).toFixed(0)}
            <span className="text-sm font-normal text-muted-foreground">%</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {CATEGORY_META[post.moderation.topCategory]?.label ?? post.moderation.topCategory}
          </div>
        </div>
      </div>

      {/* Top categories preview (visible without expanding) */}
      <div className="px-4 pb-3 space-y-1.5">
        {sortedCategories.slice(0, 3).map((cat) => {
          const score = post.moderation.scores[cat];
          if (score < 0.001) return null;
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat} className="flex items-center gap-2">
              <span className={`text-[11px] w-36 shrink-0 ${meta.color}`}>{meta.label}</span>
              <ScoreBar score={score} colorClass={score >= 0.5 ? "bg-red-500" : score >= 0.15 ? "bg-orange-400" : score >= 0.03 ? "bg-yellow-400" : "bg-emerald-400"} />
              {post.moderation.categories[cat] && (
                <span className="text-[10px] font-semibold text-red-600 shrink-0">FLAGGED</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand / collapse */}
      <div className="border-t border-border flex items-center justify-between px-4 py-2 bg-muted/30">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Hide" : "Show"} full breakdown
        </button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 gap-1.5"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </Button>
      </div>

      {/* Full breakdown */}
      {expanded && (
        <div className="px-4 py-3 border-t border-border space-y-2 bg-background">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">All categories</p>
          {sortedCategories.map((cat) => {
            const score = post.moderation.scores[cat];
            const meta = CATEGORY_META[cat];
            const barColor =
              score >= 0.5 ? "bg-red-500" :
              score >= 0.15 ? "bg-orange-400" :
              score >= 0.03 ? "bg-yellow-400" : "bg-emerald-400";
            return (
              <div key={cat} className="flex items-center gap-2">
                <span className={`text-xs w-44 shrink-0 ${score > 0.01 ? meta.color : "text-muted-foreground"}`}>
                  {meta.label}
                </span>
                <ScoreBar score={score} colorClass={barColor} />
                {post.moderation.categories[cat] ? (
                  <span className="text-[10px] font-bold text-red-600 w-14 shrink-0">FLAGGED</span>
                ) : (
                  <span className="w-14 shrink-0" />
                )}
              </div>
            );
          })}
          <div className="pt-2 border-t border-border mt-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Analysed text: </span>
              <span className="italic">{buildText(post).slice(0, 200)}{buildText(post).length > 200 ? "…" : ""}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

type AdminTab = "queue" | "imports" | "analysis" | "history" | "test-feed" | "test-profile";

export default function AdminPage() {
  const { user, isAdmin, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("queue");

  // Queue state
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<Record<string, string>>({});
  const [actioning, setActioning] = useState<string | null>(null);

  // History state
  const [historyItems, setHistoryItems] = useState<ModerationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Import discovery state
  const [importSources, setImportSources] = useState<ImportSource[]>([]);
  const [importCandidates, setImportCandidates] = useState<ImportCandidate[]>([]);
  const [importsLoading, setImportsLoading] = useState(false);
  const [importsError, setImportsError] = useState<string | null>(null);
  const [runningDiscovery, setRunningDiscovery] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<string | null>(null);
  const [importSourceFilter, setImportSourceFilter] = useState("all");
  const [importTypeFilter, setImportTypeFilter] = useState<ImportTypeFilter>("all");
  const [importRejectionFilter, setImportRejectionFilter] = useState<ImportRejectionFilter>("all");
  const [sourceForm, setSourceForm] = useState<{ name: string; url: string; type: ImportSourceType }>({
    name: "",
    url: "",
    type: "mixed",
  });
  const [addingSource, setAddingSource] = useState(false);
  const [importActioning, setImportActioning] = useState<string | null>(null);
  const [clearingCandidates, setClearingCandidates] = useState(false);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  // AI analysis state
  const [posts, setPosts] = useState<Post[]>([]);
  const [analysed, setAnalysed] = useState<AnalysedPost[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [analyseState, setAnalyseState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [analyseProgress, setAnalyseProgress] = useState(0);
  const [analyseError, setAnalyseError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortKey>("risk");

  // Redirect non-admins
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate({ to: "/" });
  }, [loading, user, isAdmin]);

  // Fetch all content
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setFetchLoading(true);
    setFetchError(null);

    Promise.all([getCircles(), getEvents(), getDeals()])
      .then(([circles, events, deals]) => {
        if (cancelled) return;
        const all: Post[] = [
          ...circles.map((c): Post => ({
            type: "circle",
            id: c.id,
            title: c.name,
            description: c.description ?? "",
            createdAt: undefined,
            href: `/circles/${getCircleHandle(c)}`,
            raw: c,
          })),
          ...events.map((e): Post => ({
            type: "event",
            id: e.id,
            title: e.title,
            description: e.description ?? "",
            createdAt: (e as any).createdAt,
            href: `/events/${getEventHandle(e)}`,
            raw: e,
          })),
          ...deals.map((d): Post => ({
            type: "deal",
            id: d.id,
            title: `${d.brand} — ${d.title}`,
            description: d.description ?? "",
            createdAt: (d as any).createdAt,
            href: `/discounts/${getDealHandle(d)}`,
            raw: d,
          })),
        ];
        setPosts(all);
        setFetchLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err instanceof Error ? err.message : "Failed to load content");
        setFetchLoading(false);
      });

    return () => { cancelled = true; };
  }, [isAdmin]);

  // Fetch queue when tab is "queue" or on mount
  useEffect(() => {
    if (!isAdmin || tab !== "queue") return;
    setQueueLoading(true);
    setQueueError(null);
    getModerationQueue()
      .then(setQueue)
      .catch((err) => setQueueError(err instanceof Error ? err.message : "Failed to load queue"))
      .finally(() => setQueueLoading(false));
  }, [isAdmin, tab]);

  // Fetch history when tab is "history"
  useEffect(() => {
    if (!isAdmin || tab !== "history") return;
    setHistoryLoading(true);
    setHistoryError(null);
    getModerationHistory()
      .then(setHistoryItems)
      .catch((err) => setHistoryError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setHistoryLoading(false));
  }, [isAdmin, tab]);

  const loadImports = useCallback(async () => {
    setImportsLoading(true);
    setImportsError(null);
    try {
      const [sources, candidates] = await Promise.all([
        getImportSources(),
        getImportCandidates("all"),
      ]);
      setImportSources(sources);
      setImportCandidates(candidates);
    } catch (err) {
      setImportsError(err instanceof Error ? err.message : "Failed to load imports");
    } finally {
      setImportsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin || tab !== "imports") return;
    loadImports();
  }, [isAdmin, tab, loadImports]);

  async function handleAddImportSource() {
    if (!sourceForm.name.trim() || !sourceForm.url.trim()) return;
    setAddingSource(true);
    try {
      const source = await addImportSource(sourceForm);
      setImportSources((prev) => [source, ...prev]);
      setSourceForm({ name: "", url: "", type: "mixed" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not add source");
    } finally {
      setAddingSource(false);
    }
  }

  async function handleRunDiscovery() {
    setRunningDiscovery(true);
    setDiscoveryResult(null);
    setImportsError(null);
    try {
      const result = await runImportDiscovery();
      const repeated = result.repeated ?? result.skipped;
      setDiscoveryResult(`Added ${result.inserted} new candidate${result.inserted === 1 ? "" : "s"} and saw ${repeated} repeated candidate${repeated === 1 ? "" : "s"} from ${result.sources} source${result.sources === 1 ? "" : "s"}.`);
      await loadImports();
      if (result.errors?.length) {
        setImportsError(result.errors.join("\n"));
      }
    } catch (err) {
      setImportsError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setRunningDiscovery(false);
    }
  }

  async function handleApproveImport(candidate: ImportCandidate) {
    if (!user) return;
    setImportActioning(candidate.id);
    try {
      await refreshUser().catch((err) => console.warn("[imports] profile refresh before approve failed", err));
      await approveImportCandidate(candidate, user.id);
      setImportCandidates((prev) => prev.map((c) => c.id === candidate.id
        ? { ...c, status: "approved", rejectionReason: undefined, reviewedBy: user.id, reviewedAt: new Date().toISOString() }
        : c,
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setImportActioning(null);
    }
  }

  async function handleRejectImport(candidate: ImportCandidate) {
    if (!user) return;
    setImportActioning(candidate.id);
    try {
      await rejectImportCandidate(candidate.id, user.id, rejectReason[candidate.id]);
      setImportCandidates((prev) => prev.map((c) => c.id === candidate.id
        ? {
            ...c,
            status: "rejected",
            rejectionReason: rejectReason[candidate.id],
            reviewedBy: user.id,
            reviewedAt: new Date().toISOString(),
          }
        : c,
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setImportActioning(null);
    }
  }

  async function handleDeleteAllImportCandidates() {
    if (importCandidates.length === 0) return;
    const confirmed = confirm(`Delete all ${importCandidates.length} import candidate${importCandidates.length === 1 ? "" : "s"}? This cannot be undone.`);
    if (!confirmed) return;
    setClearingCandidates(true);
    setImportsError(null);
    try {
      await deleteAllImportCandidates();
      setImportCandidates([]);
      setRejectReason({});
      setDiscoveryResult(null);
    } catch (err) {
      setImportsError(err instanceof Error ? err.message : "Could not delete candidates");
    } finally {
      setClearingCandidates(false);
    }
  }

  async function handleModerate(item: ModerationQueueItem, action: "approved" | "declined") {
    if (!user) return;
    const reason = action === "declined" ? (declineReason[item.contentId] ?? "") : undefined;
    setActioning(item.contentId);
    try {
      await moderatePost(item.contentType, item.contentId, action, user.id, reason || undefined);
      setQueue((q) => q.filter((i) => i.contentId !== item.contentId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActioning(null);
    }
  }

  const runAnalysis = useCallback(async () => {
    setAnalyseState("running");
    setAnalyseProgress(0);
    setAnalyseError(null);

    // Batch in chunks of 32 to stay well within request size limits
    const CHUNK = 32;
    const results: ModerationResult[] = [];
    try {
      for (let i = 0; i < posts.length; i += CHUNK) {
        const chunk = posts.slice(i, i + CHUNK);
        const texts = chunk.map(buildText);
        const chunkResults = await moderateTexts(texts);
        results.push(...chunkResults);
        setAnalyseProgress(Math.round(((i + chunk.length) / posts.length) * 100));
      }
      setAnalysed(
        posts.map((p, idx) => ({ ...p, moderation: results[idx] })),
      );
      setAnalyseState("done");
    } catch (err) {
      setAnalyseError(err instanceof Error ? err.message : "Analysis failed");
      setAnalyseState("error");
    }
  }, [posts]);

  if (loading || (!user && !loading)) return null;
  if (!isAdmin) return null;

  // Filter + sort
  const filtered = analysed.filter((p) => {
    if (filter === "flagged") return p.moderation.flagged || p.moderation.topScore >= 0.15;
    if (filter === "circle" || filter === "event" || filter === "deal") return p.type === filter;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "risk") {
      // Flagged first, then by score
      if (a.moderation.flagged !== b.moderation.flagged) return a.moderation.flagged ? -1 : 1;
      return b.moderation.topScore - a.moderation.topScore;
    }
    if (sort === "type") {
      const order: PostType[] = ["circle", "event", "deal"];
      const diff = order.indexOf(a.type) - order.indexOf(b.type);
      if (diff !== 0) return diff;
      return b.moderation.topScore - a.moderation.topScore;
    }
    // newest — fallback to score
    return b.moderation.topScore - a.moderation.topScore;
  });

  // Summary stats
  const flaggedCount = analysed.filter((p) => p.moderation.flagged).length;
  const highCount = analysed.filter((p) => !p.moderation.flagged && p.moderation.topScore >= 0.5).length;
  const mediumCount = analysed.filter((p) => !p.moderation.flagged && p.moderation.topScore >= 0.15 && p.moderation.topScore < 0.5).length;
  const cleanCount = analysed.filter((p) => !p.moderation.flagged && p.moderation.topScore < 0.03).length;
  const pendingImportCount = importCandidates.filter((candidate) => candidate.status === "new").length;
  const selectedImportSource = importSources.find((source) => source.id === importSourceFilter);
  const filteredImportCandidates = importCandidates
    .filter((candidate) => (
      importSourceFilter === "all"
      || candidate.sourceId === importSourceFilter
      || (!!selectedImportSource && candidate.sourceName === selectedImportSource.name && candidate.sourceUrl === selectedImportSource.url)
    ))
    .filter((candidate) => importTypeFilter === "all" || candidate.type === importTypeFilter)
    .filter((candidate) => {
      if (importRejectionFilter === "rejected") return candidate.status === "rejected";
      if (importRejectionFilter === "not_rejected") return candidate.status !== "rejected";
      return true;
    })
    .sort((a, b) => {
      if (a.status !== b.status) {
        const order: ImportCandidateStatus[] = ["new", "duplicate", "rejected", "approved"];
        return order.indexOf(a.status) - order.indexOf(b.status);
      }
      return new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime();
    });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Moderation</h1>
          <p className="text-xs text-muted-foreground">Review pending posts and monitor content</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "queue", label: "Queue", icon: <Clock className="h-3.5 w-3.5" /> },
          { id: "imports", label: "Imports", icon: <Search className="h-3.5 w-3.5" /> },
          { id: "analysis", label: "AI Analysis", icon: <Shield className="h-3.5 w-3.5" /> },
          { id: "history", label: "History", icon: <History className="h-3.5 w-3.5" /> },
          { id: "test-feed", label: "Test Feed", icon: <FlaskConical className="h-3.5 w-3.5" /> },
          { id: "test-profile", label: "Test Profile", icon: <User className="h-3.5 w-3.5" /> },
        ] as { id: AdminTab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
            {t.id === "queue" && queue.length > 0 && (
              <span className="ml-1 h-4.5 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1 flex items-center justify-center leading-none">
                {queue.length}
              </span>
            )}
            {t.id === "imports" && pendingImportCount > 0 && (
              <span className="ml-1 h-4.5 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1 flex items-center justify-center leading-none">
                {pendingImportCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Queue tab ─────────────────────────────────────────────────── */}
      {tab === "queue" && (
        <div className="space-y-4">
          {queueLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading pending posts…
            </div>
          )}
          {queueError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{queueError}</div>
          )}
          {!queueLoading && !queueError && queue.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No posts pending review — you're all caught up!
            </div>
          )}
          {queue.map((item) => (
            <div key={item.contentId} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide ${TYPE_BADGE[item.contentType]}`}>
                      {item.contentType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      by <span className="font-medium text-foreground">{item.submitterName}</span>
                      {" · "}
                      {new Date(item.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                </div>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  title="Preview"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="border-t border-border px-4 py-3 bg-muted/20 flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Decline reason (optional)"
                  value={declineReason[item.contentId] ?? ""}
                  onChange={(e) => setDeclineReason((r) => ({ ...r, [item.contentId]: e.target.value }))}
                  className="flex-1 min-w-40 h-8 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 h-8"
                  onClick={() => handleModerate(item, "declined")}
                  disabled={actioning === item.contentId}
                >
                  {actioning === item.contentId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Decline
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => handleModerate(item, "approved")}
                  disabled={actioning === item.contentId}
                >
                  {actioning === item.contentId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Imports tab ──────────────────────────────────────────────── */}
      {tab === "imports" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Discovery sources</h2>
                <p className="text-xs text-muted-foreground">
                  Daily overnight scraping uses enabled daily sources. Run now triggers the same discovery pass.
                </p>
              </div>
              <Button size="sm" onClick={handleRunDiscovery} disabled={runningDiscovery || importSources.length === 0} className="gap-1.5 shrink-0">
                {runningDiscovery ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Run now
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_1.2fr_auto_auto]">
              <input
                value={sourceForm.name}
                onChange={(e) => setSourceForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Source name"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <input
                value={sourceForm.url}
                onChange={(e) => setSourceForm((s) => ({ ...s, url: e.target.value }))}
                placeholder="https://..."
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <select
                value={sourceForm.type}
                onChange={(e) => setSourceForm((s) => ({ ...s, type: e.target.value as ImportSourceType }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {(["mixed", "event", "circle", "deal"] as ImportSourceType[]).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Button size="sm" onClick={handleAddImportSource} disabled={addingSource || !sourceForm.name.trim() || !sourceForm.url.trim()} className="gap-1.5">
                {addingSource ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add
              </Button>
            </div>

            {discoveryResult && <p className="text-xs text-emerald-600 dark:text-emerald-400">{discoveryResult}</p>}
            {importsError && <pre className="whitespace-pre-wrap rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{importsError}</pre>}

            <div className="space-y-2">
              {importsLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading imports…
                </div>
              )}
              {!importsLoading && importSources.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Add a few trusted sources, then run discovery.
                </p>
              )}
              {importSources.map((source) => (
                <div key={source.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <button
                    type="button"
                    onClick={async () => {
                      const updated = await updateImportSource(source.id, { enabled: !source.enabled });
                      setImportSources((prev) => prev.map((s) => s.id === source.id ? updated : s));
                    }}
                    className={`h-5 w-9 rounded-full p-0.5 transition-colors ${source.enabled ? "bg-primary" : "bg-muted"}`}
                    aria-label={source.enabled ? "Disable source" : "Enable source"}
                  >
                    <span className={`block h-4 w-4 rounded-full bg-background transition-transform ${source.enabled ? "translate-x-4" : ""}`} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{source.name}</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{source.type}</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{source.cadence}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{source.url}</p>
                  </div>
                  <div className="hidden sm:block max-w-36 truncate text-right text-[10px] text-muted-foreground">
                    {source.lastScrapedAt ? new Date(source.lastScrapedAt).toLocaleString() : "Never scraped"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Candidates</h2>
                <p className="text-xs text-muted-foreground">Filter everything the scraper has found, then approve pending items after checking the source.</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAllImportCandidates}
                  disabled={clearingCandidates || importsLoading || importCandidates.length === 0}
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  {clearingCandidates ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete all
                </Button>
                <Button variant="outline" size="sm" onClick={loadImports} disabled={importsLoading || clearingCandidates} className="gap-1.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${importsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <select
                value={importSourceFilter}
                onChange={(e) => setImportSourceFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Filter candidates by source"
              >
                <option value="all">All sources</option>
                {importSources.map((source) => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>
              <select
                value={importTypeFilter}
                onChange={(e) => setImportTypeFilter(e.target.value as ImportTypeFilter)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Filter candidates by type"
              >
                <option value="all">All types</option>
                <option value="event">Events</option>
                <option value="deal">Deals</option>
                <option value="circle">Circles</option>
              </select>
              <select
                value={importRejectionFilter}
                onChange={(e) => setImportRejectionFilter(e.target.value as ImportRejectionFilter)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Filter candidates by rejection status"
              >
                <option value="all">All candidates</option>
                <option value="rejected">Rejected</option>
                <option value="not_rejected">Not rejected</option>
              </select>
            </div>

            <p className="text-xs text-muted-foreground">
              Showing {filteredImportCandidates.length} of {importCandidates.length} candidate{importCandidates.length === 1 ? "" : "s"}.
            </p>

            {!importsLoading && filteredImportCandidates.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No candidates match these filters.
              </div>
            )}

            {filteredImportCandidates.map((candidate) => {
              const fields = candidate.normalizedPayload ?? {};
              return (
                <div key={candidate.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide ${TYPE_BADGE[candidate.type]}`}>
                            {candidate.type}
                          </span>
                          <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide ${IMPORT_STATUS_BADGE[candidate.status]}`}>
                            {candidate.status === "new" ? "pending" : candidate.status}
                          </span>
                          <span className="text-xs text-muted-foreground">{candidate.sourceName || "Unknown source"}</span>
                          <span className="text-xs text-muted-foreground">{Math.round(candidate.confidence * 100)}% confidence</span>
                        </div>
                        <p className="mt-1 font-semibold text-sm">{candidate.title}</p>
                        {candidate.description && <p className="text-xs text-muted-foreground line-clamp-2">{candidate.description}</p>}
                      </div>
                      <a href={candidate.itemUrl} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground" title="Open source">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      {Object.entries(fields).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="min-w-0 rounded-md bg-muted/50 px-2 py-1">
                          <span className="font-medium text-muted-foreground">{key}: </span>
                          <span className="break-words">{typeof value === "object" ? JSON.stringify(value) : String(value ?? "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {candidate.status === "new" ? (
                    <div className="border-t border-border px-4 py-3 bg-muted/20 flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        placeholder="Reject reason (optional)"
                        value={rejectReason[candidate.id] ?? ""}
                        onChange={(e) => setRejectReason((r) => ({ ...r, [candidate.id]: e.target.value }))}
                        className="flex-1 min-w-40 h-8 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 h-8"
                        onClick={() => handleRejectImport(candidate)}
                        disabled={importActioning === candidate.id}
                      >
                        {importActioning === candidate.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 h-8"
                        onClick={() => handleApproveImport(candidate)}
                        disabled={importActioning === candidate.id}
                      >
                        {importActioning === candidate.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Approve
                      </Button>
                    </div>
                  ) : candidate.status === "rejected" ? (
                    <div className="border-t border-border px-4 py-3 bg-muted/20 flex items-center gap-2 flex-wrap">
                      <p className="min-w-0 flex-1 text-xs text-muted-foreground">
                        {candidate.reviewedAt ? `Rejected ${new Date(candidate.reviewedAt).toLocaleString()}` : `Last updated ${new Date(candidate.updatedAt ?? candidate.createdAt).toLocaleString()}`}
                        {candidate.rejectionReason ? ` · ${candidate.rejectionReason}` : ""}
                      </p>
                      <Button
                        size="sm"
                        className="gap-1.5 h-8"
                        onClick={() => handleApproveImport(candidate)}
                        disabled={importActioning === candidate.id}
                      >
                        {importActioning === candidate.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <div className="border-t border-border px-4 py-3 bg-muted/20 text-xs text-muted-foreground">
                      {candidate.reviewedAt ? `Reviewed ${new Date(candidate.reviewedAt).toLocaleString()}` : `Last updated ${new Date(candidate.updatedAt ?? candidate.createdAt).toLocaleString()}`}
                      {candidate.rejectionReason ? ` · ${candidate.rejectionReason}` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── History tab ───────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="space-y-3">
          {historyLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
            </div>
          )}
          {historyError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{historyError}</div>
          )}
          {!historyLoading && !historyError && historyItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No moderation history yet.
            </div>
          )}
          {historyItems.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-card text-sm">
              <div className={`mt-0.5 shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
                item.action === "approved" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" :
                item.action === "declined" ? "bg-red-100 dark:bg-red-950 text-red-600" :
                "bg-muted text-muted-foreground"
              }`}>
                {item.action === "approved" && <Check className="h-3 w-3" />}
                {item.action === "declined" && <X className="h-3 w-3" />}
                {item.action === "submitted" && <Clock className="h-3 w-3" />}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 uppercase tracking-wide ${TYPE_BADGE[item.contentType]}`}>
                    {item.contentType}
                  </span>
                  <span className="font-medium truncate">{item.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.action === "submitted" && `Submitted by ${item.submitterName ?? "unknown"}`}
                  {item.action === "approved" && `Approved by ${item.actorName ?? "admin"} · submitted by ${item.submitterName ?? "unknown"}`}
                  {item.action === "declined" && `Declined by ${item.actorName ?? "admin"} · submitted by ${item.submitterName ?? "unknown"}`}
                  {item.reason && <> · <span className="italic">"{item.reason}"</span></>}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Test Feed tab ─────────────────────────────────────────────── */}
      {tab === "test-feed" && <TestFeedShowcase />}

      {/* ── Test Profile tab ──────────────────────────────────────────── */}
      {tab === "test-profile" && <TestProfileShowcase />}

      {/* ── AI Analysis tab ───────────────────────────────────────────── */}
      {tab === "analysis" && (<>


      {/* Content load state */}
      {fetchLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading all content…
        </div>
      )}
      {fetchError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {fetchError}
        </div>
      )}

      {/* Analyse button + progress */}
      {!fetchLoading && !fetchError && (
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={runAnalysis}
            disabled={analyseState === "running" || posts.length === 0}
            className="gap-2"
          >
            {analyseState === "running" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {analyseState === "done" ? "Re-analyse all" : "Analyse all content"}
          </Button>
          {posts.length > 0 && (
            <span className="text-sm text-muted-foreground">{posts.length} posts loaded</span>
          )}
          {analyseState === "running" && (
            <div className="flex items-center gap-2 flex-1 min-w-40">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${analyseProgress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{analyseProgress}%</span>
            </div>
          )}
          {analyseError && (
            <span className="text-sm text-destructive">{analyseError}</span>
          )}
        </div>
      )}

      {/* Summary stats */}
      {analyseState === "done" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Flagged by AI", value: flaggedCount, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
            { label: "High risk",     value: highCount,    color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" },
            { label: "Medium risk",   value: mediumCount,  color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" },
            { label: "Clean",         value: cleanCount,   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Top risks preview */}
      {analyseState === "done" && (flaggedCount + highCount) > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">Needs immediate review</span>
            <span className="ml-auto text-xs text-red-500">{flaggedCount + highCount} post{flaggedCount + highCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-border">
            {[...analysed]
              .filter((p) => p.moderation.flagged || p.moderation.topScore >= 0.5)
              .sort((a, b) => {
                if (a.moderation.flagged !== b.moderation.flagged) return a.moderation.flagged ? -1 : 1;
                return b.moderation.topScore - a.moderation.topScore;
              })
              .slice(0, 5)
              .map((p) => {
                const level = riskLevel(p.moderation.topScore, p.moderation.flagged);
                const cfg = RISK_CONFIG[level];
                const topLabel = CATEGORY_META[p.moderation.topCategory]?.label ?? p.moderation.topCategory;
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide shrink-0 ${TYPE_BADGE[p.type]}`}>
                      {p.type}
                    </span>
                    <span className="text-sm font-medium min-w-0 truncate flex-1">{p.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{topLabel}</span>
                    <span className={`text-sm font-bold tabular-nums shrink-0 ${cfg.icon}`}>
                      {(p.moderation.topScore * 100).toFixed(0)}%
                    </span>
                    {p.moderation.flagged && (
                      <span className="text-[10px] font-bold text-red-600 shrink-0">FLAGGED</span>
                    )}
                    <button
                      onClick={() => {
                        setFilter("all");
                        setSort("risk");
                        setTimeout(() => {
                          document.getElementById(`post-${p.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 50);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground shrink-0 underline underline-offset-2"
                    >
                      View
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Filters + sort */}
      {analyseState === "done" && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {(["all", "flagged", "circle", "event", "deal"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "flagged" ? "⚠ Flagged" : f}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">Sort:</span>
            {(["risk", "type"] as SortKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                  sort === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "risk" ? "Risk ↓" : "Type"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {analyseState === "done" && (
        <div className="space-y-3">
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No posts match this filter.</p>
          )}
          {sorted.map((post) => (
            <div key={post.id} id={`post-${post.id}`}>
              <PostCard
                post={post}
                onDelete={(deleted) => setAnalysed((prev) => prev.filter((p) => p.id !== deleted.id))}
              />
            </div>
          ))}
        </div>
      )}

      {analyseState === "idle" && !fetchLoading && !fetchError && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Click <span className="font-medium text-foreground">Analyse all content</span> to run the OpenAI moderation check on all{" "}
          {posts.length} posts.
        </div>
      )}
      </>)}
    </div>
  );
}
