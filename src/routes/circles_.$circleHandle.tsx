import { Link, createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TagPicker from "@/components/TagPicker";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { OwnerBadge } from "@/components/OwnerBadge";
import { ShareButton } from "@/components/ShareButton";
import { SaveButton } from "@/components/SaveButton";
import { useAuth } from "@/components/AuthProvider";
import {
  deleteCircle,
  getCircleByHandle,
  updateCircle,
  getCircleHandle,
  getProfile,
  uploadCircleIcon,
  getCircleManagers,
  addCircleManagerById,
  removeCircleManager,
  transferCircleOwnership,
  getCircleMembers,
  getMyJoinRequest,
  requestToJoinCircle,
  withdrawJoinRequest,
  getCircleJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  leaveCircle,
  removeMember,
  getJoinedCircleIds,
  updateMemberTitle,
  type UserProfile,
  type CircleMember,
  type CircleJoinRequest,
  type JoinRequestStatus,
} from "@/data/backend";
import { CIRCLE_CATEGORIES, ACTIVITY_LEVELS, CATEGORY_EMOJI, LANGUAGES } from "@/data/profile-options";
import { CIRCLE_TAG_GROUPS, filterValidTags } from "@/data/tags";
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
  tags: string[];
  university: string;
  location: string;
  primaryLanguage: string;
  recruiting: boolean;
  recruitingPeriod: string;
  recruitingConditions: string;
  membershipFee: string;
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
    tags: c.tags ?? [],
    university: c.university ?? "",
    location: (c as any).location ?? "",
    primaryLanguage: c.primaryLanguage ?? "",
    recruiting: c.recruiting ?? false,
    recruitingPeriod: c.recruitingPeriod ?? "",
    recruitingConditions: c.recruitingConditions ?? "",
    membershipFee: (c as any).membershipFee ?? "",
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
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [owner, setOwner] = useState<{ id: string; username: string; displayName: string; avatarUrl: string | null } | null>(null);
  const [draft, setDraft] = useState<Draft>(circle ? toDraft(circle) : {} as Draft);
  const [pendingIcon, setPendingIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Managers state
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [transferInput, setTransferInput] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferSuggestions, setTransferSuggestions] = useState<{ id: string; username: string; displayName: string; avatarUrl: string | null }[]>([]);
  const [transferSuggestionsOpen, setTransferSuggestionsOpen] = useState(false);
  const transferSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Members state
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [joinStatus, setJoinStatus] = useState<JoinRequestStatus | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ id: string; name: string; type: "demote" | "kick"; isManager: boolean } | null>(null);

  // Pending join requests (for owner/managers)
  const [pendingRequests, setPendingRequests] = useState<CircleJoinRequest[]>([]);
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);

  const isOwner = !!(user && circle?.ownerId && user.id === circle.ownerId);
  const isManager = managers.some((m) => m.id === user?.id);
  const canEdit = isOwner || isManager || isAdmin;
  const canManageRequests = isOwner || isManager || isAdmin;

  useEffect(() => {
    if (!circle?.ownerId) return;
    getProfile(circle.ownerId).then((p) => {
      if (p) {
        const name = p.username ?? p.displayName;
        setOwner({ id: circle.ownerId!, username: name, displayName: p.displayName, avatarUrl: p.avatarUrl });
        setDraft((d) => ({ ...d, ownerUsername: name }));
      }
    });
  }, [circle?.ownerId]);

  useEffect(() => {
    if (!circle?.id) return;
    getCircleManagers(circle.id).then(setManagers);
    getCircleMembers(circle.id).then(setMembers);
  }, [circle?.id]);

  useEffect(() => {
    if (!circle?.id || !user) return;
    getJoinedCircleIds(user.id).then((ids) => setIsMember(ids.includes(circle.id)));
    getMyJoinRequest(circle.id, user.id).then(setJoinStatus);
  }, [circle?.id, user?.id]);

  useEffect(() => {
    if (!circle?.id || !canManageRequests) return;
    getCircleJoinRequests(circle.id).then(setPendingRequests);
  }, [circle?.id, canManageRequests]);

  async function handlePromoteToManager(member: CircleMember) {
    if (!circle) return;
    setPromotingId(member.id);
    try {
      await addCircleManagerById(circle.id, member.id);
      setManagers(await getCircleManagers(circle.id));
    } catch (err) {
      console.error(err);
    } finally {
      setPromotingId(null);
    }
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

  async function handleRemoveManager(userId: string) {
    if (!circle) return;
    await removeCircleManager(circle.id, userId);
    setManagers((prev) => prev.filter((m) => m.id !== userId));
  }

  async function handleTransfer() {
    if (!circle || !transferInput.trim()) return;
    setTransferError(null);
    setTransferring(true);
    try {
      await transferCircleOwnership(circle.id, transferInput.trim().replace(/^@/, ""));
      setShowTransfer(false);
      setTransferInput("");
      router.invalidate();
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setTransferring(false);
    }
  }

  async function handleJoinRequest() {
    if (!circle || !user) return;
    setJoinLoading(true);
    try {
      await requestToJoinCircle({ id: circle.id, name: circle.name, ownerId: circle.ownerId }, user.id);
      setJoinStatus("pending");
    } catch (err) {
      console.error(err);
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!circle || !user) return;
    setJoinLoading(true);
    try {
      await withdrawJoinRequest(circle.id, user.id);
      setJoinStatus(null);
    } catch (err) {
      console.error(err);
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleLeave() {
    if (!circle || !user) return;
    setJoinLoading(true);
    try {
      if (isManager) {
        await removeCircleManager(circle.id, user.id);
        setManagers((prev) => prev.filter((m) => m.id !== user.id));
      }
      await leaveCircle(user.id, circle.id);
      setIsMember(false);
      setMembers((prev) => prev.filter((m) => m.id !== user.id));
    } catch (err) {
      console.error(err);
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleSaveTitle(userId: string) {
    if (!circle) return;
    const trimmed = titleDraft.trim();
    try {
      await updateMemberTitle(circle.id, userId, trimmed);
      setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, title: trimmed } : m));
    } catch (err) {
      console.error(err);
    } finally {
      setEditingTitleId(null);
    }
  }

  async function handleKickManager(m: CircleMember) {
    if (!circle) return;
    setPromotingId(m.id);
    try {
      await removeCircleManager(circle.id, m.id);
      await removeMember(circle.id, m.id);
      setManagers((prev) => prev.filter((mgr) => mgr.id !== m.id));
      setMembers((prev) => prev.filter((mem) => mem.id !== m.id));
    } catch (err) {
      console.error(err);
    } finally {
      setPromotingId(null);
    }
  }

  async function handleApprove(req: CircleJoinRequest) {
    if (!circle) return;
    setRequestActionLoading(req.userId);
    try {
      await approveJoinRequest({ id: circle.id, name: circle.name }, req.userId);
      const [updatedReqs, updatedMembers] = await Promise.all([
        getCircleJoinRequests(circle.id),
        getCircleMembers(circle.id),
      ]);
      setPendingRequests(updatedReqs);
      setMembers(updatedMembers);
    } catch (err) {
      console.error(err);
    } finally {
      setRequestActionLoading(null);
    }
  }

  async function handleReject(req: CircleJoinRequest) {
    if (!circle) return;
    setRequestActionLoading(req.userId);
    try {
      await rejectJoinRequest({ id: circle.id, name: circle.name }, req.userId);
      getCircleJoinRequests(circle.id).then(setPendingRequests);
    } catch (err) {
      console.error(err);
    } finally {
      setRequestActionLoading(null);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!circle) return;
    await removeMember(circle.id, userId);
    setMembers((prev) => prev.filter((m) => m.id !== userId));
  }

  async function handleConfirm() {
    if (!confirmAction) return;
    const { id, type, isManager } = confirmAction;
    setConfirmAction(null);
    if (type === "demote") {
      await handleRemoveManager(id);
    } else {
      if (isManager) await handleKickManager({ id } as CircleMember);
      else await handleRemoveMember(id);
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
        tags: draft.tags,
        university: draft.university,
        location: draft.location,
        primaryLanguage: draft.primaryLanguage,
        recruiting: draft.recruiting,
        recruitingPeriod: draft.recruitingPeriod,
        recruitingConditions: draft.recruitingConditions,
        membershipFee: draft.membershipFee,
        socialLinks: {
          website: draft.website || undefined,
          instagram: draft.instagram || undefined,
          linkedin: draft.linkedin || undefined,
          line: draft.line || undefined,
        },
        iconUrl: newIconUrl,
      });
      setEditing(false);
      const newHandle = getCircleHandle({ id: circle!.id, name: draft.name });
      await navigate({ to: "/circles/$circleHandle", params: { circleHandle: newHandle }, replace: true });
      router.invalidate();
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
    <div className="space-y-4">
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
              <label className="text-xs font-medium text-muted-foreground">University</label>
              <UniversityPicker
                value={draft.university}
                onChange={(v) => setDraft((d) => ({ ...d, university: v }))}
                extraOptions={["Online", "No university"]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Specific location</label>
              <Input
                value={draft.location}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                placeholder="e.g. Building 14 Room 203, Main Campus Gate"
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

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Membership fee</label>
              <Input
                value={draft.membershipFee}
                onChange={(e) => setDraft((d) => ({ ...d, membershipFee: e.target.value }))}
                placeholder="e.g. Free, ¥3,000/year, ¥500/month"
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
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <TagPicker value={draft.tags} onChange={(t) => setDraft((d) => ({ ...d, tags: t }))} groups={CIRCLE_TAG_GROUPS} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Owner</label>
              <p className="text-sm py-1 px-1">
                {owner ? <span>@{owner.username.replace(/^@/, "")}</span> : <span className="text-muted-foreground">No owner</span>}
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

            {/* Transfer ownership (owner/admin only, inside edit form) */}
            {(isOwner || isAdmin) && (
              <div className="space-y-3 pt-2 border-t border-border">

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
            {(circle as any).location && (
              <p className="text-sm text-muted-foreground">📍 {(circle as any).location}</p>
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

            {(circle as any).membershipFee && (
              <p className="text-sm text-muted-foreground">💴 Membership fee: <span className="font-medium text-foreground">{(circle as any).membershipFee}</span></p>
            )}

            {owner && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>👑 Owned by</span>
                <OwnerBadge username={owner.username} displayName={owner.displayName} avatarUrl={owner.avatarUrl} />
              </div>
            )}

            {managers.length > 0 && (
              <p className="text-sm text-muted-foreground">
                🛡️ Managers:{" "}
                {managers.map((m, i) => (
                  <span key={m.id}>
                    {i > 0 && <span>, </span>}
                    <Link to="/users/$username" params={{ username: m.username ?? m.id }} className="font-medium text-foreground hover:underline">
                      @{m.username ?? m.displayName}
                    </Link>
                  </span>
                ))}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 items-center">
              {filterValidTags(circle.tags).map((tag) => (
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
        ) : (
          <div className="absolute bottom-4 right-4 flex gap-1.5 items-center">
            <ShareButton title={circle.name} />
            <SaveButton itemId={circle.id} itemType="circle" />
            {/* Join / leave / request button — not shown to owner/admin */}
            {user && !isOwner && !isAdmin && (
              isMember ? (
                <button
                  onClick={handleLeave}
                  disabled={joinLoading}
                  className="text-xs text-muted-foreground hover:text-destructive border border-border rounded-md px-2.5 py-1 transition-colors"
                >
                  {joinLoading ? "…" : "Leave"}
                </button>
              ) : joinStatus === "pending" ? (
                <button
                  onClick={handleWithdraw}
                  disabled={joinLoading}
                  className="text-xs text-muted-foreground hover:text-destructive border border-border rounded-md px-2.5 py-1 transition-colors"
                >
                  {joinLoading ? "…" : "Withdraw request"}
                </button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleJoinRequest} disabled={joinLoading}>
                  {joinLoading ? "…" : "Request to join"}
                </Button>
              )
            )}
            {canEdit && (
              <button
                onClick={startEditing}
                className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-2.5 py-1 transition-colors"
              >
                Edit
              </button>
            )}
            {(isOwner || isAdmin) && <DeleteRecordButton label={circle.name} onDelete={handleDelete} />}
          </div>
        )}
      </section>

      {/* ── Join requests (owner/managers only) ── */}
      {!editing && canManageRequests && (
        <section className="card-base p-6 space-y-3">
          <h2 className="text-sm font-semibold">
            Join Requests
            {pendingRequests.filter((r) => r.status === "pending").length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold h-4 px-1.5">
                {pendingRequests.filter((r) => r.status === "pending").length}
              </span>
            )}
          </h2>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No join requests yet</p>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((req) => {
                const initials = (req.displayName || req.username || "?").slice(0, 2).toUpperCase();
                const loading = requestActionLoading === req.userId;
                const isPending = req.status === "pending";
                return (
                  <div key={req.userId} className="flex items-center gap-3">
                    <Link to="/users/$username" params={{ username: req.username ?? req.userId }} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
                      {req.avatarUrl ? (
                        <img src={req.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">{initials}</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{req.displayName}</p>
                        {req.username && <p className="text-xs text-muted-foreground truncate">@{req.username}</p>}
                      </div>
                    </Link>
                    {isPending ? (
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" onClick={() => handleApprove(req)} disabled={loading}>
                          {loading ? "…" : "Approve"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(req)} disabled={loading}>
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                        req.status === "approved"
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {req.status === "approved" ? "Approved" : "Declined"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Members ── */}
      <section className="card-base p-6 space-y-3">
          {(() => {
            const ownerEntry: CircleMember | null = owner
              ? { id: owner.id, username: owner.username, displayName: owner.displayName, avatarUrl: owner.avatarUrl, title: "", university: "", year: "", bio: "", careerField: "", goals: [], tags: [], interests: [], languages: [], nationality: "" }
              : null;
            const memberIds = new Set(members.map((m) => m.id));
            const managerIds = new Set(managers.map((m) => m.id));
            const combined: CircleMember[] = [
              ...(ownerEntry && !memberIds.has(ownerEntry.id) ? [ownerEntry] : []),
              ...members,
            ];
            const rank = (m: CircleMember) =>
              m.id === circle?.ownerId ? 0 : managerIds.has(m.id) ? 1 : 2;
            const name = (m: CircleMember) =>
              (m.displayName || m.username || "").toLowerCase();
            const displayMembers = [...combined].sort((a, b) => {
              const dr = rank(a) - rank(b);
              return dr !== 0 ? dr : name(a).localeCompare(name(b));
            });
            const total = displayMembers.length;
            return (
              <>
                <h2 className="text-sm font-semibold">Members{total > 0 && ` (${total})`}</h2>
                {total === 0 ? (
                  <p className="text-sm text-muted-foreground">No members yet — be the first to join!</p>
                ) : (
                  <div className="space-y-1">
                    {displayMembers.map((m) => {
                      const isThisOwner = m.id === circle?.ownerId;
                      const isAlreadyManager = managers.some((mgr) => mgr.id === m.id);
                      const actioning = promotingId === m.id;
                      const initials = (m.displayName || m.username || "?").slice(0, 2).toUpperCase();
                      return (
                        <div key={m.id} className="flex items-center gap-2 py-1.5">
                          <Link
                            to="/users/$username"
                            params={{ username: m.username ?? m.id }}
                            className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80"
                          >
                            {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">{initials}</div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-tight truncate">{m.displayName || m.username}</p>
                              {m.username && <p className="text-xs text-muted-foreground truncate">@{m.username}</p>}
                            </div>
                          </Link>

                          {isThisOwner ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold shrink-0">Owner</span>
                          ) : isAlreadyManager ? (
                            <>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 font-medium shrink-0">Manager</span>
                              {editing && (isOwner || isAdmin) && (
                                <>
                                  <button onClick={() => setConfirmAction({ id: m.id, name: m.displayName || m.username, type: "demote", isManager: true })} disabled={actioning} className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 transition-colors shrink-0">
                                    Demote
                                  </button>
                                  <button onClick={() => setConfirmAction({ id: m.id, name: m.displayName || m.username, type: "kick", isManager: true })} disabled={actioning} className="text-xs text-muted-foreground hover:text-destructive border border-border hover:border-destructive/40 rounded px-1.5 py-0.5 transition-colors shrink-0">
                                    Kick
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-medium shrink-0">Member</span>
                              {editing && canManageRequests && (
                                <>
                                  {(isOwner || isAdmin) && (
                                    <button onClick={() => handlePromoteToManager(m)} disabled={actioning} className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 transition-colors shrink-0">
                                      {actioning ? "…" : "Promote"}
                                    </button>
                                  )}
                                  <button onClick={() => setConfirmAction({ id: m.id, name: m.displayName || m.username, type: "kick", isManager: false })} disabled={actioning} className="text-xs text-muted-foreground hover:text-destructive border border-border hover:border-destructive/40 rounded px-1.5 py-0.5 transition-colors shrink-0">
                                    Kick
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </section>

      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "demote" ? "Demote manager" : "Kick member"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "demote"
                ? `Remove manager role from ${confirmAction?.name}? They'll stay as a regular member.`
                : `Remove ${confirmAction?.name} from this circle? They'll need to rejoin.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {confirmAction?.type === "demote" ? "Demote" : "Kick"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
