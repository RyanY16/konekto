import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { BriefcaseBusiness, Globe, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { SocialLinks } from "@/components/SocialLinks";
import TagPicker from "@/components/TagPicker";
import { deleteJob, getJobByHandle, updateJob } from "@/data/backend";
import { useAuth } from "@/components/AuthProvider";
import { OPPORTUNITY_CATEGORIES, CATEGORY_EMOJI } from "@/data/profile-options";
import { filterValidTags, tagLabel } from "@/data/tags";
import { tagClass } from "@/lib/tag-class";
import { anyContainsSlur } from "@/lib/profanity";
import { checkBeforePost } from "@/lib/moderation";
import { formatOpportunityDeadline, normalizeOpportunityDeadline } from "@/lib/opportunity-deadline";
import type { Job } from "@/data/mock";

export const Route = createFileRoute("/careers_/$jobHandle")({
  loader: ({ params }) => getJobByHandle(params.jobHandle),
  component: JobDetailPage,
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
  tags: string[];
};

function toDraft(job: Job): Draft {
  return {
    organization: job.organization,
    title: job.title,
    category: job.category,
    location: job.location,
    mode: job.mode,
    deadline: job.deadline ?? "",
    description: job.description ?? "",
    eligibility: job.eligibility ?? "",
    applicationUrl: job.applicationUrl ?? job.socialLinks?.website ?? "",
    tags: filterValidTags(job.tags),
  };
}

function JobDetailPage() {
  const job = Route.useLoaderData();
  const { isAdmin } = useAuth();
  const { i18n } = useTranslation();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => job ? toDraft(job) : {
    organization: "",
    title: "",
    category: "Other",
    location: "",
    mode: "In-Person",
    deadline: "",
    description: "",
    eligibility: "",
    applicationUrl: "",
    tags: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!job) {
    return <NotFound name="opportunity" to="/careers" />;
  }

  function startEditing() {
    setDraft(toDraft(job));
    setError("");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    const textForModeration = [
      draft.organization,
      draft.title,
      draft.location,
      draft.deadline,
      draft.description,
      draft.eligibility,
      draft.tags.join(" "),
    ].filter(Boolean).join(" ");

    if (anyContainsSlur(textForModeration)) {
      setError("Your post contains inappropriate language and could not be submitted. Please review and try again.");
      setSaving(false);
      return;
    }

    const aiCheck = await checkBeforePost(textForModeration)
      .catch(() => ({ blocked: true as const, reason: "Content safety check failed — please try again in a moment." }));
    if (aiCheck.blocked) {
      setError(aiCheck.reason!);
      setSaving(false);
      return;
    }

    try {
      await updateJob(job.id, {
        organization: draft.organization.trim(),
        title: draft.title.trim(),
        category: draft.category,
        location: draft.location.trim(),
        mode: draft.mode,
        deadline: normalizeOpportunityDeadline(draft.deadline),
        description: draft.description.trim() || undefined,
        eligibility: draft.eligibility.trim() || undefined,
        applicationUrl: draft.applicationUrl.trim() || undefined,
        socialLinks: { ...(job.socialLinks ?? {}), website: draft.applicationUrl.trim() || undefined },
        tags: draft.tags,
        emoji: CATEGORY_EMOJI[draft.category] || "✨",
      });
      setEditing(false);
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  const tags = filterValidTags(job.tags);
  const lbl = "text-xs font-medium text-muted-foreground";
  const field = "space-y-1.5";
  const req = <span className="text-destructive ml-0.5">*</span>;

  return (
    <div>
      <Link to="/careers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to opportunities
      </Link>

      {editing ? (
        <div className="max-w-2xl space-y-5">
          <PageHeader eyebrow="Opportunities" title="Edit opportunity" />

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
            <TagPicker value={draft.tags} onChange={(tags) => setDraft((d) => ({ ...d, tags }))} />
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
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button variant="outline" onClick={() => { setEditing(false); setDraft(toDraft(job)); setError(""); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <PageHeader
            eyebrow={job.category}
            eyebrowVariant="chip"
            title={job.title}
            subtitle={job.organization}
          />

          <section className="card-base p-6 space-y-4 relative pb-16">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center text-4xl shrink-0">
                {job.emoji || CATEGORY_EMOJI[job.category] || <BriefcaseBusiness className="h-8 w-8" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{job.location}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail label="Category" value={job.category} />
              <Detail label="Location" value={job.location} />
              <Detail label="Mode" value={job.mode} />
              {job.deadline && <Detail label="Deadline" value={formatOpportunityDeadline(job.deadline)} />}
            </div>

            {job.description && (
              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <p className="text-sm font-medium mb-1">About this opportunity</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
            )}

            {job.eligibility && (
              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <p className="text-sm font-medium mb-1">Eligibility</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.eligibility}</p>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>
                    {tagLabel(tag, i18n.language)}
                  </span>
                ))}
              </div>
            )}

            {!job.applicationUrl && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Application details coming soon
              </span>
            )}

            <SocialLinks links={job.socialLinks} />

            <div className="absolute bottom-4 right-4 flex gap-1.5 items-center">
              <ShareButton title={job.title} />
              <SaveButton itemId={job.id} itemType="opportunity" />
              {isAdmin && (
                <button
                  onClick={startEditing}
                  className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors"
                >
                  Edit
                </button>
              )}
              {isAdmin && <DeleteRecordButton label={job.title} onDelete={() => deleteJob(job.id)} navigateTo="/careers" />}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function NotFound({ name, to }: { name: string; to: string }) {
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-bold">{name} not found</h1>
      <Link to={to} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        Go back
      </Link>
    </div>
  );
}
