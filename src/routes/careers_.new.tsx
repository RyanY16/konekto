import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { Globe, ImagePlus, Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import TagPicker from "@/components/TagPicker";
import { addJob, getJobHandle, uploadOpportunityImage } from "@/data/backend";
import { OPPORTUNITY_CATEGORIES, CATEGORY_EMOJI } from "@/data/profile-options";
import { useAuth } from "@/components/AuthProvider";
import { anyContainsSlur } from "@/lib/profanity";
import { checkBeforePost } from "@/lib/moderation";
import { normalizeOpportunityDeadline } from "@/lib/opportunity-deadline";
import { SmartFill, type SmartFillResult } from "@/components/SmartFill";
import { filterValidTags, inferRelevantTags } from "@/data/tags";
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
  imageUrl: string;
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
  imageUrl: "",
};

function NewOpportunityPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { isAdmin, loading } = useAuth();
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLinkOpen, setImageLinkOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const jobId = `job-${crypto.randomUUID()}`;
      let imageUrl = draft.imageUrl.trim() || undefined;
      if (pendingImage) {
        imageUrl = await uploadOpportunityImage(jobId, pendingImage);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setPendingImage(null);
        setImagePreview(null);
      }
      const created = await addJob({
        id: jobId,
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
        imageUrl,
      });
      await router.invalidate();
      navigate({ to: "/careers/$jobHandle", params: { jobHandle: getJobHandle(created) } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add opportunity.");
    } finally {
      setSaving(false);
    }
  }

  function handleSmartFill(data: SmartFillResult, sourceUrl: string) {
    const rawCategory = data.category ?? "";
    const category = (OPPORTUNITY_CATEGORIES as readonly string[]).includes(rawCategory)
      ? rawCategory as Job["category"]
      : "Scholarship";
    const mode = data.mode === "Online" || data.mode === "Hybrid" || data.mode === "In-Person"
      ? data.mode
      : "In-Person";
    const rawData = data as SmartFillResult & Record<string, unknown>;
    const applicationUrl = [
      sourceUrl,
      rawData.applicationUrl,
      rawData.applicationURL,
      rawData.application_url,
      rawData.applyUrl,
      rawData.apply_url,
      rawData.url,
      rawData.website,
    ].find((value) => typeof value === "string" && value.trim()) as string;

    setDraft(() => ({
      organization: data.organization ?? data.brand ?? "",
      title: data.title ?? "",
      category,
      location: data.location ?? "",
      mode,
      deadline: normalizeOpportunityDeadline(data.deadline) || "",
      description: data.description ?? "",
      eligibility: data.eligibility ?? "",
      applicationUrl: applicationUrl.trim(),
      imageUrl: data.imageUrl ?? "",
    }));
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setPendingImage(null);
    setImagePreview(null);
    setImageLinkOpen(false);
    setSelectedTags(filterValidTags(inferRelevantTags({
      tags: data.tags,
      text: [data.title, data.organization, data.category, data.description, data.eligibility],
      limit: 4,
    })));
  }

  function handleImageFile(file: File) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setPendingImage(file);
    setImagePreview(URL.createObjectURL(file));
    setImageLinkOpen(false);
    setDraft((d) => ({ ...d, imageUrl: "" }));
  }

  const lbl = "text-xs font-medium text-muted-foreground";
  const field = "space-y-1.5";
  const req = <span className="text-destructive ml-0.5">*</span>;
  const opt = <span className="font-normal text-muted-foreground/60 ml-1">(optional)</span>;
  const displayImage = imagePreview ?? draft.imageUrl;

  return (
    <div>
      <Link to="/careers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to opportunities
      </Link>
      <PageHeader eyebrow="Opportunities" title="Add opportunity" />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        <SmartFill type="opportunity" onFill={handleSmartFill} />

        <div className={field}>
          <label className={lbl}>Opportunity image {opt}</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group h-32 w-32 shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-muted"
            >
              {displayImage ? (
                <>
                  <img src={displayImage} alt="Opportunity image" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xl">📷</span>
                  </div>
                </>
              ) : (
                <span className="text-3xl group-hover:scale-110 transition-transform">{CATEGORY_EMOJI[draft.category] ?? "✨"}</span>
              )}
            </button>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Choose the image shown for this opportunity</p>
              <p className="text-xs">PNG, JPG · Max 5 MB</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" size="sm" className="w-8 px-0 sm:w-auto sm:px-3" aria-label="New pic" title="New pic" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" />
                  <span className="hidden sm:inline">New pic</span>
                </Button>
                <Button type="button" variant="outline" size="sm" className="w-8 px-0 sm:w-auto sm:px-3" aria-label="From link" title="From link" onClick={() => setImageLinkOpen((open) => !open)}>
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">From link</span>
                </Button>
                {displayImage && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-8 px-0 sm:w-auto sm:px-3"
                    aria-label="Remove image"
                    title="Remove image"
                    onClick={() => {
                      if (imagePreview) URL.revokeObjectURL(imagePreview);
                      setPendingImage(null);
                      setImagePreview(null);
                      setImageLinkOpen(false);
                      setDraft((d) => ({ ...d, imageUrl: "" }));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          {imageLinkOpen && (
            <Input
              type="url"
              value={imagePreview ? "" : draft.imageUrl}
              onChange={(event) => {
                if (imagePreview) URL.revokeObjectURL(imagePreview);
                setPendingImage(null);
                setImagePreview(null);
                setDraft((d) => ({ ...d, imageUrl: event.target.value.trim() }));
              }}
              placeholder="Paste image link"
            />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImageFile(file);
              event.target.value = "";
            }}
          />
        </div>

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
