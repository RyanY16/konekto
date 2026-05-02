import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

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

import { PageHeader } from "@/components/PageHeader";
import { SocialLinks } from "@/components/SocialLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagPicker from "@/components/TagPicker";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { useAuth } from "@/components/AuthProvider";
import {
  deleteCircle,
  getCircleByHandle,
  updateCircle,
  getProfile,
  getProfileByUsername,
  uploadCircleIcon,
} from "@/data/backend";
import { CIRCLE_CATEGORIES, ACTIVITY_LEVELS, COMMITMENT_LEVELS, CATEGORY_EMOJI } from "@/data/profile-options";
import type { Circle } from "@/data/mock";

export const Route = createFileRoute("/circles_/$circleHandle")({
  loader: ({ params }) => getCircleByHandle(params.circleHandle),
  component: CircleDetailPage,
});

type Draft = {
  name: string;
  description: string;
  category: string;
  activity: string;
  commitment: string;
  englishFriendly: boolean;
  tags: string[];
  ownerUsername: string;
};

function toDraft(c: Circle, ownerUsername = ""): Draft {
  return {
    name: c.name,
    description: c.description,
    category: c.category,
    activity: c.activity,
    commitment: c.commitment,
    englishFriendly: c.englishFriendly,
    tags: c.tags ?? [],
    ownerUsername,
  };
}

function CircleDetailPage() {
  const circle = Route.useLoaderData();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState<string>("");
  const [draft, setDraft] = useState<Draft>(circle ? toDraft(circle) : {} as Draft);
  const [pendingIcon, setPendingIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!circle?.ownerId) return;
    getProfile(circle.ownerId).then((p) => {
      const name = p?.username ?? p?.displayName ?? "";
      setOwnerUsername(name);
      setDraft((d) => ({ ...d, ownerUsername: name }));
    });
  }, [circle?.ownerId]);

  if (!circle) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Circle not found</h1>
        <Link to="/circles" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  function startEditing() {
    setDraft(toDraft(circle!, ownerUsername));
    setPendingIcon(null);
    setIconPreview(null);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setPendingIcon(null);
    setIconPreview(null);
    setEditing(false);
  }

  function handleIconFile(file: File) {
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setPendingIcon(file);
    setIconPreview(URL.createObjectURL(file));
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      let resolvedOwnerId: string | null = circle!.ownerId ?? null;
      const inputUsername = draft.ownerUsername.replace(/^@/, "").trim();
      if (inputUsername !== ownerUsername.replace(/^@/, "").trim()) {
        if (inputUsername === "") {
          resolvedOwnerId = null;
        } else {
          const profile = await getProfileByUsername(inputUsername);
          if (!profile) {
            setSaveError(`No user found with username @${inputUsername}`);
            setSaving(false);
            return;
          }
          resolvedOwnerId = profile.id;
        }
      }

      let newIconUrl: string | undefined = (circle as any).iconUrl;
      if (pendingIcon) {
        newIconUrl = await uploadCircleIcon(circle!.id, pendingIcon);
        URL.revokeObjectURL(iconPreview!);
        setPendingIcon(null);
        setIconPreview(null);
      }

      await updateCircle(circle!.id, {
        name: draft.name,
        description: draft.description,
        category: draft.category,
        emoji: CATEGORY_EMOJI[draft.category] ?? circle!.emoji,
        activity: draft.activity as Circle["activity"],
        commitment: draft.commitment as Circle["commitment"],
        englishFriendly: draft.englishFriendly,
        tags: draft.tags,
        ownerId: resolvedOwnerId ?? undefined,
        socialLinks: (circle as any).socialLinks ?? {},
        iconUrl: newIconUrl,
      });
      if (inputUsername !== ownerUsername) setOwnerUsername(inputUsername);
      await router.invalidate();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteCircle(circle!.id);
    router.navigate({ to: "/circles" });
  }

  const currentIcon = iconPreview ?? (circle as any).iconUrl ?? null;

  const sel = (cls: string) =>
    `h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${cls}`;

  return (
    <div>
      <PageHeader
        eyebrow="Circles"
        title={editing ? draft.name || circle.name : circle.name}
        subtitle={editing ? undefined : circle.description}
      />

      <section className="card-base p-6 space-y-5">
        {/* ── Action bar ── */}
        <div className="flex justify-end gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
              <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>Cancel</Button>
            </>
          ) : isAdmin ? (
            <>
              <Button size="sm" onClick={startEditing}>Edit</Button>
              <DeleteRecordButton label={circle.name} onDelete={handleDelete} />
            </>
          ) : null}
        </div>

        {editing ? (
          /* ── Edit form ── */
          <div className="space-y-4">
            {/* Icon uploader */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Circle Icon</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-muted"
                >
                  {currentIcon ? (
                    <>
                      <img src={currentIcon} alt="Circle icon" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xl">📷</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-3xl group-hover:scale-110 transition-transform">{draft.emoji || "📷"}</span>
                  )}
                </button>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Click to upload an icon image</p>
                  <p>PNG, JPG · Max 2 MB</p>
                  {currentIcon && (
                    <button
                      type="button"
                      className="text-destructive hover:underline"
                      onClick={() => {
                        if (iconPreview) URL.revokeObjectURL(iconPreview);
                        setPendingIcon(null);
                        setIconPreview(null);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleIconFile(file);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Circle name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Short description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  className={sel("")}
                >
                  {CIRCLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Activity</label>
                <select
                  value={draft.activity}
                  onChange={(e) => setDraft((d) => ({ ...d, activity: e.target.value }))}
                  className={sel("")}
                >
                  {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Commitment</label>
                <select
                  value={draft.commitment}
                  onChange={(e) => setDraft((d) => ({ ...d, commitment: e.target.value }))}
                  className={sel("")}
                >
                  {COMMITMENT_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={draft.englishFriendly}
                onChange={(e) => setDraft((d) => ({ ...d, englishFriendly: e.target.checked }))}
                className="h-4 w-4"
              />
              English-friendly
            </label>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <TagPicker value={draft.tags} onChange={(t) => setDraft((d) => ({ ...d, tags: t }))} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Owner username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                <Input
                  value={draft.ownerUsername.replace(/^@/, "")}
                  onChange={(e) => setDraft((d) => ({ ...d, ownerUsername: e.target.value.replace(/^@/, "") }))}
                  placeholder="username (leave blank to remove)"
                  className="pl-7"
                />
              </div>
            </div>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
        ) : (
          /* ── View mode ── */
          <>
            {(circle as any).iconUrl && (
              <img
                src={(circle as any).iconUrl}
                alt={`${circle.name} icon`}
                className="w-24 h-24 rounded-xl object-cover border border-border"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail label="Category" value={circle.category} />
              <Detail label="Members" value={`${circle.members}`} />
              <Detail label="Activity" value={circle.activity} />
              <Detail label="Commitment" value={circle.commitment} />
            </div>

            {ownerUsername && (
              <p className="text-sm text-muted-foreground">👑 Owned by <span className="font-medium text-foreground">@{ownerUsername}</span></p>
            )}

            <div className="flex flex-wrap gap-1.5 items-center">
              {circle.englishFriendly && <span className="chip chip-accent">🌏 English-friendly</span>}
              {circle.tags.map((tag) => (
                <span key={tag} className="chip">{tag}</span>
              ))}
            </div>

            {relativeTime(circle.updatedAt) && (
              <p className="text-xs text-muted-foreground">{relativeTime(circle.updatedAt)}</p>
            )}

            <SocialLinks links={(circle as any).socialLinks} />
          </>
        )}

        <Link to="/circles" className="inline-block text-sm font-semibold text-primary hover:underline">
          ← Back to circles
        </Link>
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
