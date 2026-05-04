import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Globe, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { tagClass } from "@/lib/tag-class";
import { PageHeader } from "@/components/PageHeader";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagPicker from "@/components/TagPicker";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { ShareButton } from "@/components/ShareButton";
import { useAuth } from "@/components/AuthProvider";
import {
  deleteEvent,
  getEventByHandle,
  updateEvent,
  getProfile,
} from "@/data/backend";
import type { EventItem } from "@/data/mock";

const EVENT_CATEGORIES = ["Social", "Career", "Hackathon", "Networking"] as const;

const CATEGORY_EMOJI: Record<string, string> = {
  Social: "🥂",
  Career: "💼",
  Hackathon: "⚡",
  Networking: "🚀",
};

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

function EventSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-8 w-64 bg-muted rounded" />
      <div className="card-base p-6 space-y-4">
        <div className="h-16 w-16 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
        </div>
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/events_/$eventHandle")({
  loader: ({ params }) => getEventByHandle(params.eventHandle),
  staleTime: 30_000,
  pendingComponent: EventSkeleton,
  component: EventDetailPage,
});

type Draft = {
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  emoji: string;
  tags: string[];
  website: string;
  instagram: string;
  linkedin: string;
  line: string;
};

function toDraft(e: EventItem): Draft {
  const sl = e.socialLinks ?? {};
  return {
    title: e.title,
    description: e.description ?? "",
    category: e.category,
    date: e.date,
    location: e.location,
    emoji: e.emoji,
    tags: e.tags ?? [],
    website: sl.website ?? "",
    instagram: sl.instagram ?? "",
    linkedin: sl.linkedin ?? "",
    line: sl.line ?? "",
  };
}

function EventDetailPage() {
  const event = Route.useLoaderData();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState<string>("");
  const [draft, setDraft] = useState<Draft>(event ? toDraft(event) : {} as Draft);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isOwner = !!(user && event?.ownerId && user.id === event.ownerId);
  const canEdit = isOwner || isAdmin;

  useEffect(() => {
    if (!event?.ownerId) return;
    getProfile(event.ownerId).then((p) => {
      setOwnerUsername(p?.username ?? p?.displayName ?? "");
    });
  }, [event?.ownerId]);

  if (!event) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Link to="/events" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  function startEditing() {
    setDraft(toDraft(event!));
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      await updateEvent(event!.id, {
        title: draft.title,
        description: draft.description,
        category: draft.category as EventItem["category"],
        date: draft.date,
        location: draft.location,
        emoji: draft.emoji || CATEGORY_EMOJI[draft.category] || "📅",
        tags: draft.tags,
        socialLinks: {
          website: draft.website || undefined,
          instagram: draft.instagram || undefined,
          linkedin: draft.linkedin || undefined,
          line: draft.line || undefined,
        },
      });
      setEditing(false);
      router.invalidate();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteEvent(event!.id);
    router.navigate({ to: "/events" });
  }

  const sel = `h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`;

  return (
    <div>
      <Link to="/events" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to events
      </Link>

      <PageHeader
        eyebrow="Events"
        title={editing ? draft.title || event.title : event.title}
      />
      {!editing && event.description && (
        <p className="whitespace-pre-wrap text-muted-foreground max-w-2xl -mt-4 mb-6">{event.description}</p>
      )}

      <section className="card-base p-6 space-y-5 relative pb-16">
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="What's this event about?"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  className={sel}
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Emoji</label>
                <Input
                  value={draft.emoji}
                  onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))}
                  placeholder={CATEGORY_EMOJI[draft.category] ?? "📅"}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date &amp; time</label>
              <Input
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                placeholder="e.g. Fri, May 8 · 7:00 PM"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <Input
                value={draft.location}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                placeholder="e.g. Shibuya, Tokyo Big Sight, Online"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <TagPicker value={draft.tags} onChange={(t) => setDraft((d) => ({ ...d, tags: t }))} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Social links</label>
              <div className="space-y-2">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={draft.website}
                    onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
                    placeholder="https://yoursite.com"
                    className="pl-9"
                  />
                </div>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                  <Input
                    value={draft.instagram.replace(/^@/, "")}
                    onChange={(e) => setDraft((d) => ({ ...d, instagram: e.target.value.replace(/^@/, "") }))}
                    placeholder="handle"
                    className="pl-14"
                  />
                </div>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={draft.linkedin}
                    onChange={(e) => setDraft((d) => ({ ...d, linkedin: e.target.value }))}
                    placeholder="linkedin.com/in/yourprofile"
                    className="pl-9"
                  />
                </div>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                  <Input
                    value={draft.line.replace(/^@/, "")}
                    onChange={(e) => setDraft((d) => ({ ...d, line: e.target.value.replace(/^@/, "") }))}
                    placeholder="LINE ID"
                    className="pl-14"
                  />
                </div>
              </div>
            </div>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-soft to-accent-soft flex items-center justify-center text-4xl shrink-0">
                {event.emoji}
              </div>
              <div>
                <span className="chip chip-primary">{event.category}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail label="Date" value={event.date} />
              <Detail label="Location" value={event.location} />
              <Detail label="Going" value={`${event.going} people`} />
            </div>

            {ownerUsername && (
              <p className="text-sm text-muted-foreground">
                👑 Organized by{" "}
                <Link
                  to="/users/$username"
                  params={{ username: ownerUsername }}
                  className="font-medium text-foreground hover:underline"
                >
                  @{ownerUsername}
                </Link>
              </p>
            )}

            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {relativeTime(event.updatedAt) && (
              <p className="text-xs text-muted-foreground">{relativeTime(event.updatedAt)}</p>
            )}

            <SocialLinks links={event.socialLinks} />
          </>
        )}

        {editing ? (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>Cancel</Button>
          </div>
        ) : (
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            <ShareButton title={event.title} />
            {canEdit && (
              <button
                onClick={startEditing}
                className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors"
              >
                Edit
              </button>
            )}
            {canEdit && (
              <DeleteRecordButton
                label={event.title}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
      </section>
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
