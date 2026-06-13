import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import TagPicker from "@/components/TagPicker";
import { addJob, getJobHandle } from "@/data/backend";
import { OPPORTUNITY_CATEGORIES, CATEGORY_EMOJI } from "@/data/profile-options";
import { useAuth } from "@/components/AuthProvider";
import { anyContainsSlur } from "@/lib/profanity";
import { checkBeforePost } from "@/lib/moderation";
import { normalizeOpportunityDeadline } from "@/lib/opportunity-deadline";
import type { Job } from "@/data/mock";

export const Route = createFileRoute("/careers_/new")({
  component: NewOpportunityPage,
});

type Draft = {
  organization: string;
  title: string;
  category: Job["category"];
  location: string;
  mode: Job["mode"];
  deadline: string;
  description: string;
  eligibility: string;
  applicationUrl: string;
};

const defaultDraft: Draft = {
  organization: "",
  title: "",
  category: "Scholarship",
  location: "",
  mode: "In-Person",
  deadline: "",
  description: "",
  eligibility: "",
  applicationUrl: "",
};

function NewOpportunityPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-muted" />;
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Only admins can add opportunities right now.</p>
        <Link to="/careers" className="text-sm font-semibold text-primary hover:underline">Back to opportunities</Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const moderationText = [
      draft.organization,
      draft.title,
      draft.location,
      draft.deadline,
      draft.description,
      draft.eligibility,
      selectedTags.join(" "),
    ].filter(Boolean).join(" ");

    if (anyContainsSlur(moderationText)) {
      setError("Your post contains inappropriate language and could not be submitted. Please review and try again.");
      setSaving(false);
      return;
    }

    const aiCheck = await checkBeforePost(moderationText)
      .catch(() => ({ blocked: true as const, reason: "Content safety check failed — please try again in a moment." }));
    if (aiCheck.blocked) {
      setError(aiCheck.reason!);
      setSaving(false);
      return;
    }

    try {
      const created = await addJob({
        organization: draft.organization.trim(),
        title: draft.title.trim(),
        category: draft.category,
        location: draft.location.trim(),
        mode: draft.mode,
        deadline: normalizeOpportunityDeadline(draft.deadline),
        description: draft.description.trim() || undefined,
        eligibility: draft.eligibility.trim() || undefined,
        applicationUrl: draft.applicationUrl.trim() || undefined,
        socialLinks: draft.applicationUrl.trim() ? { website: draft.applicationUrl.trim() } : {},
        tags: selectedTags,
        emoji: CATEGORY_EMOJI[draft.category] || "✨",
      });
      await router.invalidate();
      navigate({ to: "/careers/$jobHandle", params: { jobHandle: getJobHandle(created) } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add opportunity.");
    } finally {
      setSaving(false);
    }
  }

  const lbl = "text-xs font-medium text-muted-foreground";
  const field = "space-y-1.5";
  const req = <span className="text-destructive ml-0.5">*</span>;

  return (
    <div>
      <Link to="/careers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to opportunities
      </Link>
      <PageHeader eyebrow="Opportunities" title="Add opportunity" />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <div className={field}>
          <label className={lbl}>Category{req}</label>
          <NativeSelect value={draft.category} onChange={(event) => setDraft((d) => ({ ...d, category: event.target.value as Job["category"] }))}>
            {OPPORTUNITY_CATEGORIES.map((category) => (
              <option key={category} value={category}>{CATEGORY_EMOJI[category] ?? "✨"} {category}</option>
            ))}
          </NativeSelect>
        </div>

        <div className={field}>
          <label className={lbl}>Title{req}</label>
          <Input required value={draft.title} onChange={(event) => setDraft((d) => ({ ...d, title: event.target.value }))} placeholder="e.g. Short-term Exchange Program" />
        </div>

        <div className={field}>
          <label className={lbl}>Organization{req}</label>
          <Input required value={draft.organization} onChange={(event) => setDraft((d) => ({ ...d, organization: event.target.value }))} placeholder="e.g. Waseda University" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={field}>
            <label className={lbl}>Location{req}</label>
            <Input required value={draft.location} onChange={(event) => setDraft((d) => ({ ...d, location: event.target.value }))} placeholder="Tokyo, Remote, Seoul…" />
          </div>
          <div className={field}>
            <label className={lbl}>Mode</label>
            <NativeSelect value={draft.mode} onChange={(event) => setDraft((d) => ({ ...d, mode: event.target.value as Job["mode"] }))}>
              <option value="Online">Online</option>
              <option value="In-Person">In-Person</option>
              <option value="Hybrid">Hybrid</option>
            </NativeSelect>
          </div>
        </div>

        <div className={field}>
          <label className={lbl}>Deadline</label>
          <Input type="date" value={draft.deadline} onChange={(event) => setDraft((d) => ({ ...d, deadline: event.target.value }))} />
        </div>

        <div className={field}>
          <label className={lbl}>Description</label>
          <Textarea value={draft.description} onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))} rows={4} placeholder="What is this opportunity about?" />
        </div>

        <div className={field}>
          <label className={lbl}>Eligibility</label>
          <Textarea value={draft.eligibility} onChange={(event) => setDraft((d) => ({ ...d, eligibility: event.target.value }))} rows={3} placeholder="Who can apply?" />
        </div>

        <div className={field}>
          <label className={lbl}>Tags</label>
          <TagPicker value={selectedTags} onChange={setSelectedTags} />
        </div>

        <div className={field}>
          <label className={lbl}>Application link</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input value={draft.applicationUrl} onChange={(event) => setDraft((d) => ({ ...d, applicationUrl: event.target.value }))} placeholder="https://" className="pl-9" />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add opportunity"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/careers" })}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
