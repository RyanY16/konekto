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

import { Globe, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { tagClass } from "@/lib/tag-class";
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
  getCircleEditors,
  addCircleEditor,
  removeCircleEditor,
  transferCircleOwnership,
  searchUsers,
  type UserProfile,
} from "@/data/backend";
import { CIRCLE_CATEGORIES, ACTIVITY_LEVELS, CATEGORY_EMOJI, LANGUAGES } from "@/data/profile-options";
import { UniversityPicker } from "@/components/UniversityPicker";
import type { Circle } from "@/data/mock";

function CircleLoadingskeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-8 w-64 bg-muted rounded" />
      <div className="card-base p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
        </div>
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/circles_/$circleHandle")({
  loader: ({ params }) => getCircleByHandle(params.circleHandle),
  staleTime: 30_000,
  pendingComponent: CircleLoadingskeleton,
  component: CircleDetailPage,
});

type Draft = {
  name: string;
  description: string;
  category: string;
  activity: string;
  englishFriendly: boolean;
  tags: string[];
  university: string;
  primaryLanguage: string;
  recruiting: boolean;
  recruitingPeriod: string;
  recruitingConditions: string;
  website: string;
  instagram: string;
  linkedin: string;
  line: string;
};

function toDraft(c: Circle): Draft {
  const sl = (c as any).socialLinks ?? {};
  return {
    name: c.name,
    description: c.description,
    category: c.category,
    activity: c.activity,
    englishFriendly: c.englishFriendly,
    tags: c.tags ?? [],
    university: c.university ?? "",
    primaryLanguage: c.primaryLanguage ?? "",
    recruiting: c.recruiting ?? false,
    recruitingPeriod: c.recruitingPeriod ?? "",
    recruitingConditions: c.recruitingConditions ?? "",
    website: sl.website ?? "",
    instagram: sl.instagram ?? "",
    linkedin: sl.linkedin ?? "",
    line: sl.line ?? "",
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

  // Editors state
  const [editors, setEditors] = useState<UserProfile[]>([]);
  const [editorInput, setEditorInput] = useState("");
  const [editorError, setEditorError] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSuggestions, setEditorSuggestions] = useState<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]>([]);
  const [editorSuggestionsOpen, setEditorSuggestionsOpen] = useState(false);
  const editorSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [transferInput, setTransferInput] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferSuggestions, setTransferSuggestions] = useState<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]>([]);
  const [transferSuggestionsOpen, setTransferSuggestionsOpen] = useState(false);
  const transferSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwner = !!(user && circle?.ownerId && user.id === circle.ownerId);
  const isEditor = editors.some((e) => e.id === user?.id);
  const canEdit = isOwner || isEditor || isAdmin;

  useEffect(() => {
    if (!circle?.ownerId) return;
    getProfile(circle.ownerId).then((p) => {
      const name = p?.username ?? p?.displayName ?? "";
      setOwnerUsername(name);
      setDraft((d) => ({ ...d, ownerUsername: name }));
    });
  }, [circle?.ownerId]);

  useEffect(() => {
    if (!circle?.id) return;
    getCircleEditors(circle.id).then(setEditors);
  }, [circle?.id]);

  function onEditorInputChange(val: string) {
    setEditorInput(val);
    setEditorError(null);
    if (editorSearchRef.current) clearTimeout(editorSearchRef.current);
    const q = val.replace(/^@/, "").trim();
    if (q.length === 0) { setEditorSuggestions([]); setEditorSuggestionsOpen(false); return; }
    editorSearchRef.current = setTimeout(async () => {
      const results = await searchUsers(q);
      setEditorSuggestions(results.filter((r) => !editors.some((e) => e.id === r.id) && r.id !== circle?.ownerId));
      setEditorSuggestionsOpen(true);
    }, 180);
  }

  function onTransferInputChange(val: string) {
    setTransferInput(val);
    setTransferError(null);
    if (transferSearchRef.current) clearTimeout(transferSearchRef.current);
    const q = val.replace(/^@/, "").trim();
    if (q.length === 0) { setTransferSuggestions([]); setTransferSuggestionsOpen(false); return; }
    transferSearchRef.current = setTimeout(async () => {
      const results = await searchUsers(q);
      setTransferSuggestions(results);
      setTransferSuggestionsOpen(true);
    }, 180);
  }

  async function handleAddEditor() {
    if (!circle || !editorInput.trim()) return;
    const username = editorInput.trim().replace(/^@/, "");
    setEditorError(null);
    setEditorLoading(true);
    setEditorSuggestionsOpen(false);
    try {
      const profile = await getProfileByUsername(username);
      if (!profile) {
        setEditorError(`No user found with username @${username}`);
        return;
      }
      if (editors.some((e) => e.id === profile.id)) {
        setEditorError(`@${username} is already an editor`);
        return;
      }
      await addCircleEditor(circle.id, username);
      setEditors(await getCircleEditors(circle.id));
      setEditorInput("");
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Failed to add editor");
    } finally {
      setEditorLoading(false);
    }
  }

  async function handleRemoveEditor(userId: string) {
    if (!circle) return;
    await removeCircleEditor(circle.id, userId);
    setEditors((prev) => prev.filter((e) => e.id !== userId));
  }

  async function handleTransfer() {
    if (!circle || !transferInput.trim()) return;
    setTransferError(null);
    setTransferring(true);
    try {
      await transferCircleOwnership(circle.id, transferInput.trim().replace(/^@/, ""));
      await router.invalidate();
      setShowTransfer(false);
      setTransferInput("");
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setTransferring(false);
    }
  }

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
    setDraft(toDraft(circle!));
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
        englishFriendly: draft.englishFriendly,
        tags: draft.tags,
        university: draft.university,
        primaryLanguage: draft.primaryLanguage,
        recruiting: draft.recruiting,
        recruitingPeriod: draft.recruitingPeriod,
        recruitingConditions: draft.recruitingConditions,
        socialLinks: {
          website: draft.website || undefined,
          instagram: draft.instagram || undefined,
          linkedin: draft.linkedin || undefined,
          line: draft.line || undefined,
        },
        iconUrl: newIconUrl,
      });
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
      <Link to="/circles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        ← Back to circles
      </Link>

      <PageHeader
        eyebrow="Circles"
        title={editing ? draft.name || circle.name : circle.name}
      />
      {!editing && circle.description && (
        <p className="whitespace-pre-wrap text-muted-foreground max-w-2xl -mt-4 mb-6">{circle.description}</p>
      )}

      <section className="card-base p-6 space-y-5 relative pb-16">

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
                    <span className="text-3xl group-hover:scale-110 transition-transform">{circle.emoji || "📷"}</span>
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
                rows={6}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">University / Location</label>
              <UniversityPicker
                value={draft.university}
                onChange={(v) => setDraft((d) => ({ ...d, university: v }))}
                extraOptions={["Online", "No university"]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Primary language</label>
              <select
                value={draft.primaryLanguage}
                onChange={(e) => setDraft((d) => ({ ...d, primaryLanguage: e.target.value }))}
                className={sel("")}
              >
                <option value="">— Select —</option>
                {LANGUAGES.map((l) => <option key={l.name} value={l.name}>{l.flag} {l.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.recruiting}
                  onChange={(e) => setDraft((d) => ({ ...d, recruiting: e.target.checked }))}
                  className="h-4 w-4"
                />
                Currently recruiting
              </label>
              {draft.recruiting && (
                <div className="space-y-2 pl-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Recruiting period</label>
                    <Input
                      value={draft.recruitingPeriod}
                      onChange={(e) => setDraft((d) => ({ ...d, recruitingPeriod: e.target.value }))}
                      placeholder="e.g. April–May, Spring semester"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Conditions / requirements</label>
                    <Textarea
                      value={draft.recruitingConditions}
                      onChange={(e) => setDraft((d) => ({ ...d, recruitingConditions: e.target.value }))}
                      placeholder="e.g. Open to all levels, must attend trial session"
                      rows={2}
                    />
                  </div>
                </div>
              )}
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
              <label className="text-xs font-medium text-muted-foreground">Owner</label>
              <p className="text-sm py-1 px-1">
                {ownerUsername ? <span>@{ownerUsername.replace(/^@/, "")}</span> : <span className="text-muted-foreground">No owner</span>}
              </p>
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

            {/* Editors (owner/admin only, inside edit form) */}
            {(isOwner || isAdmin) && (
              <div className="space-y-3 pt-2 border-t border-border">
                <label className="text-xs font-medium text-muted-foreground">Editors</label>

                {editors.length > 0 && (
                  <div className="space-y-1.5">
                    {editors.map((e) => (
                      <div key={e.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm">
                          {e.displayName || e.username}
                          {e.username && <span className="text-muted-foreground ml-1">@{e.username}</span>}
                        </span>
                        <button onClick={() => handleRemoveEditor(e.id)} className="text-xs text-destructive hover:underline shrink-0">Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">@</span>
                    <input
                      value={editorInput}
                      onChange={(e) => onEditorInputChange(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddEditor(); if (e.key === "Escape") setEditorSuggestionsOpen(false); }}
                      onFocus={() => editorInput.trim() && setEditorSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setEditorSuggestionsOpen(false), 150)}
                      placeholder="username"
                      className="w-full pl-7 h-8 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    {editorSuggestionsOpen && editorSuggestions.length > 0 && (
                      <ul className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {editorSuggestions.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                              onMouseDown={(e) => { e.preventDefault(); setEditorInput(s.username); setEditorSuggestionsOpen(false); }}
                            >
                              {s.avatarUrl && <img src={s.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />}
                              <span className="font-medium">{s.displayName}</span>
                              <span className="text-muted-foreground">@{s.username}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Button size="sm" onClick={handleAddEditor} disabled={editorLoading || !editorInput.trim()}>
                    {editorLoading ? "Adding…" : "Add"}
                  </Button>
                </div>
                {editorError && <p className="text-xs text-destructive">{editorError}</p>}

                {/* Transfer ownership */}
                {!showTransfer ? (
                  <button onClick={() => setShowTransfer(true)} className="text-xs text-muted-foreground hover:text-foreground underline">
                    Transfer ownership…
                  </button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                    <p className="text-xs font-medium text-destructive">Transfer ownership to another user</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">@</span>
                        <input
                          value={transferInput}
                          onChange={(e) => onTransferInputChange(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Escape") setTransferSuggestionsOpen(false); }}
                          onFocus={() => transferInput.trim() && setTransferSuggestionsOpen(true)}
                          onBlur={() => setTimeout(() => setTransferSuggestionsOpen(false), 150)}
                          placeholder="new owner username"
                          className="w-full pl-7 h-8 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {transferSuggestionsOpen && transferSuggestions.length > 0 && (
                          <ul className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {transferSuggestions.map((s) => (
                              <li key={s.id}>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                                  onMouseDown={(e) => { e.preventDefault(); setTransferInput(s.username); setTransferSuggestionsOpen(false); }}
                                >
                                  {s.avatarUrl && <img src={s.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />}
                                  <span className="font-medium">{s.displayName}</span>
                                  <span className="text-muted-foreground">@{s.username}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Button size="sm" variant="destructive" onClick={handleTransfer} disabled={transferring || !transferInput.trim()}>
                        {transferring ? "…" : "Transfer"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setShowTransfer(false); setTransferInput(""); setTransferError(null); }}>Cancel</Button>
                    </div>
                    {transferError && <p className="text-xs text-destructive">{transferError}</p>}
                  </div>
                )}
              </div>
            )}

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
            </div>

            {circle.university && (
              <p className="text-sm text-muted-foreground">🏫 {circle.university}</p>
            )}

            {circle.primaryLanguage && (() => {
              const lang = LANGUAGES.find((l) => l.name === circle.primaryLanguage);
              return <p className="text-sm text-muted-foreground">{lang?.flag ?? "🌐"} {circle.primaryLanguage}</p>;
            })()}

            {circle.recruiting && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 space-y-0.5">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">✅ Recruiting</p>
                {circle.recruitingPeriod && <p className="text-xs text-muted-foreground">Period: {circle.recruitingPeriod}</p>}
                {circle.recruitingConditions && <p className="text-xs text-muted-foreground">{circle.recruitingConditions}</p>}
              </div>
            )}

            {ownerUsername && (
              <p className="text-sm text-muted-foreground">
                👑 Owned by{" "}
                <Link to="/users/$username" params={{ username: ownerUsername }} className="font-medium text-foreground hover:underline">
                  @{ownerUsername}
                </Link>
              </p>
            )}

            {editors.length > 0 && (
              <p className="text-sm text-muted-foreground">
                ✏️ Editors:{" "}
                {editors.map((e, i) => (
                  <span key={e.id}>
                    {i > 0 && <span>, </span>}
                    <Link to="/users/$username" params={{ username: e.username ?? e.id }} className="font-medium text-foreground hover:underline">
                      @{e.username ?? e.displayName}
                    </Link>
                  </span>
                ))}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 items-center">
              {circle.englishFriendly && <span className="chip chip-accent">🌏 English-friendly</span>}
              {circle.tags.map((tag) => (
                <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>{tag}</span>
              ))}
            </div>

            {relativeTime(circle.updatedAt) && (
              <p className="text-xs text-muted-foreground">{relativeTime(circle.updatedAt)}</p>
            )}

            <SocialLinks links={(circle as any).socialLinks} />
          </>
        )}

        {/* ── Bottom-corner action buttons ── */}
        {editing ? (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>Cancel</Button>
          </div>
        ) : canEdit ? (
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            <button
              onClick={startEditing}
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors"
            >
              Edit
            </button>
            {(isOwner || isAdmin) && <DeleteRecordButton label={circle.name} onDelete={handleDelete} />}
          </div>
        ) : null}
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
