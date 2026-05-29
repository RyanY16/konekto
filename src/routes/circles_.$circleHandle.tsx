import { Link, createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

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

import { Calendar, Globe, Instagram, Linkedin, MapPin, MessageCircle } from "lucide-react";
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
  getCircleEvents,
  getCircleEventCollabRequests,
  getEventHandle,
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
  approveEventCircleCollaboration,
  declineEventCircleCollaboration,
  leaveCircle,
  removeMember,
  getJoinedCircleIds,
  updateMemberTitle,
  searchUsers,
  type UserProfile,
  type CircleMember,
  type CircleJoinRequest,
  type CircleEventCollabRequest,
  type JoinRequestStatus,
} from "@/data/backend";
import { CIRCLE_CATEGORIES, ACTIVITY_LEVELS, CATEGORY_EMOJI, LANGUAGES } from "@/data/profile-options";
import { CIRCLE_TAG_GROUPS, filterValidTags, tagLabel } from "@/data/tags";
import { UniversityPicker } from "@/components/UniversityPicker";
import type { Circle, EventItem } from "@/data/mock";
import { NativeSelect } from "@/components/ui/native-select";

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
  tags: string[];
  university: string;
  primaryLanguage: string;
  englishFriendly: boolean;
  recruiting: boolean;
  recruitingPeriod: string;
  recruitingConditions: string;
  membershipFee: string;
  howToJoin: string;
  website: string;
  instagram: string;
  linkedin: string;
  line: string;
  discord: string;
  lineVisibility: "everyone" | "members";
  discordVisibility: "everyone" | "members";
  memberTitles: Record<string, string>;
  vibe: string;
};

function toDraft(c: Circle): Draft {
  const sl = (c as any).socialLinks ?? {};
  const vis = c.socialLinksVisibility ?? {};
  return {
    name: c.name,
    description: c.description,
    category: c.category,
    tags: c.tags ?? [],
    university: c.university ?? "",
    primaryLanguage: c.primaryLanguage ?? "",
    englishFriendly: c.englishFriendly ?? false,
    recruiting: c.recruiting ?? false,
    recruitingPeriod: c.recruitingPeriod ?? "",
    recruitingConditions: c.recruitingConditions ?? "",
    membershipFee: (c as any).membershipFee ?? "",
    howToJoin: c.howToJoin ?? "",
    website: sl.website ?? "",
    instagram: sl.instagram ?? "",
    linkedin: sl.linkedin ?? "",
    line: sl.line ?? "",
    discord: sl.discord ?? "",
    lineVisibility: vis.line ?? "everyone",
    discordVisibility: vis.discord ?? "members",
    memberTitles: {},
    vibe: (c as any).vibe || "Casual",
  };
}


function CircleDetailPage() {
  const circle = Route.useLoaderData();
  const { i18n } = useTranslation();
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
  const [eventCollabRequests, setEventCollabRequests] = useState<CircleEventCollabRequest[]>([]);
  const [eventCollabLoading, setEventCollabLoading] = useState<string | null>(null);
  const [circleEvents, setCircleEvents] = useState<EventItem[]>([]);

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

  useEffect(() => {
    if (!circle?.id) return;
    getCircleEvents(circle.id).then(setCircleEvents).catch(() => setCircleEvents([]));
  }, [circle?.id]);

  useEffect(() => {
    if (!circle?.id || !canManageRequests) {
      setEventCollabRequests([]);
      return;
    }
    getCircleEventCollabRequests(circle.id).then(setEventCollabRequests).catch(() => setEventCollabRequests([]));
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

  async function handleEventCollabDecision(req: CircleEventCollabRequest, decision: "approved" | "declined") {
    if (!circle || !user) return;
    setEventCollabLoading(req.eventId);
    try {
      if (decision === "approved") {
        await approveEventCircleCollaboration(req.eventId, circle.id, user.id);
      } else {
        await declineEventCircleCollaboration(req.eventId, circle.id, user.id);
      }
      const [requests, events] = await Promise.all([
        getCircleEventCollabRequests(circle.id),
        getCircleEvents(circle.id),
      ]);
      setEventCollabRequests(requests);
      setCircleEvents(events);
      router.invalidate();
    } catch (err) {
      console.error(err);
    } finally {
      setEventCollabLoading(null);
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
    const d = toDraft(circle!);
    d.memberTitles = Object.fromEntries(members.map((m) => [m.id, m.title ?? ""]));
    setDraft(d);
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
        tags: draft.tags,
        university: draft.university,
        primaryLanguage: draft.primaryLanguage,
        vibe: draft.vibe || undefined,
        englishFriendly: draft.englishFriendly,
        recruiting: draft.recruiting,
        recruitingPeriod: draft.recruitingPeriod,
        recruitingConditions: draft.recruitingConditions,
        membershipFee: draft.membershipFee,
        howToJoin: draft.howToJoin || undefined,
        socialLinks: {
          website: draft.website || undefined,
          instagram: draft.instagram || undefined,
          linkedin: draft.linkedin || undefined,
          line: draft.line || undefined,
          discord: draft.discord || undefined,
        },
        socialLinksVisibility: {
          line: draft.lineVisibility,
          discord: draft.discordVisibility,
        },
        iconUrl: newIconUrl,
      });

      // Save any pending member title changes
      const titleChanges = Object.entries(draft.memberTitles).filter(([id, title]) => {
        const member = members.find((m) => m.id === id);
        return member && member.title !== title;
      });
      if (titleChanges.length > 0) {
        await Promise.all(titleChanges.map(([id, title]) => updateMemberTitle(circle!.id, id, title)));
        setMembers((prev) => prev.map((m) => {
          const updated = draft.memberTitles[m.id];
          return updated !== undefined ? { ...m, title: updated } : m;
        }));
      }

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
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Primary language</label>
              <NativeSelect value={draft.primaryLanguage} onChange={(e) => setDraft((d) => ({ ...d, primaryLanguage: e.target.value }))}>
                <option value="">— Select —</option>
                {LANGUAGES.map((l) => <option key={l.name} value={l.name}>{l.flag} {l.name}</option>)}
              </NativeSelect>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={draft.englishFriendly}
                onChange={(e) => setDraft((d) => ({ ...d, englishFriendly: e.target.checked }))}
                className="h-4 w-4 rounded"
              />
              🌏 English-friendly
            </label>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Vibe</label>
              <div className="flex gap-2 flex-wrap">
                {["Casual", "Serious", "Drinking-friendly"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, vibe: d.vibe === v ? "" : v }))}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      draft.vibe === v
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
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
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Membership fee</label>
                    <Input
                      value={draft.membershipFee}
                      onChange={(e) => setDraft((d) => ({ ...d, membershipFee: e.target.value }))}
                      placeholder="e.g. Free, ¥3,000/year, ¥500/month"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">How to join</label>
                    <Textarea
                      value={draft.howToJoin}
                      onChange={(e) => setDraft((d) => ({ ...d, howToJoin: e.target.value }))}
                      placeholder="e.g. Fill out the form on our website, attend an open meeting, DM us on Instagram…"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <NativeSelect value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
                {CIRCLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </NativeSelect>
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
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.033.058a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <Input
                      value={draft.discord}
                      onChange={(e) => setDraft((d) => ({ ...d, discord: e.target.value }))}
                      placeholder="discord.gg/invite or server ID"
                      className="pl-9"
                    />
                  </div>
                  <NativeSelect
                    wrapperClassName="shrink-0"
                    className="h-9 w-auto bg-transparent text-xs"
                    value={draft.discordVisibility}
                    onChange={(e) => setDraft((d) => ({ ...d, discordVisibility: e.target.value as "everyone" | "members" }))}
                  >
                    <option value="members">Members only</option>
                    <option value="everyone">Everyone</option>
                  </NativeSelect>
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
            </div>

            {circle.university && (
              <p className="text-sm text-muted-foreground">🏫 {circle.university}</p>
            )}
            {circle.englishFriendly && (
              <p className="text-sm text-muted-foreground">🌏 English-friendly</p>
            )}

            {(circle as any).vibe && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                {(circle as any).vibe}
              </span>
            )}

            {circle.primaryLanguage && (() => {
              const lang = LANGUAGES.find((l) => l.name === circle.primaryLanguage);
              return <p className="text-sm text-muted-foreground">{lang?.flag ?? "🌐"} {circle.primaryLanguage}</p>;
            })()}

            {circle.recruiting && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 space-y-1.5">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">✅ Recruiting</p>
                {circle.recruitingPeriod && <p className="text-xs text-muted-foreground">Period: {circle.recruitingPeriod}</p>}
                {circle.recruitingConditions && <p className="text-xs text-muted-foreground">{circle.recruitingConditions}</p>}
                {(circle as any).membershipFee && <p className="text-xs text-muted-foreground">💴 Fee: <span className="font-medium text-foreground">{(circle as any).membershipFee}</span></p>}
                {circle.howToJoin && (
                  <div className="pt-1 border-t border-green-500/20 space-y-0.5">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400">How to join</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{circle.howToJoin}</p>
                  </div>
                )}
              </div>
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
                <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>{tagLabel(tag, i18n.language)}</span>
              ))}
            </div>

            {relativeTime(circle.updatedAt) && (
              <p className="text-xs text-muted-foreground">{relativeTime(circle.updatedAt)}</p>
            )}

            {(() => {
              const canSeePrivate = isMember || isOwner || isManager || isAdmin;
              const vis = circle.socialLinksVisibility ?? {};
              const sl = (circle as any).socialLinks ?? {};
              const visibleLinks = {
                ...sl,
                line: vis.line === "everyone" || canSeePrivate ? sl.line : undefined,
                discord: vis.discord === "everyone" || canSeePrivate ? sl.discord : undefined,
              };
              const hasHiddenLinks = !canSeePrivate && (
                (sl.line && vis.line !== "everyone") ||
                (sl.discord && vis.discord !== "everyone")
              );
              return (
                <>
                  <SocialLinks links={visibleLinks} />
                  {hasHiddenLinks && (
                    <p className="text-xs text-muted-foreground">🔒 Some links are members only — join to see them</p>
                  )}
                </>
              );
            })()}
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

      {/* ── Event collaboration requests (owner/managers only) ── */}
      {!editing && canManageRequests && (
        <section className="card-base p-6 space-y-3">
          <h2 className="text-sm font-semibold">
            Event Collab Requests
            {eventCollabRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold h-4 px-1.5">
                {eventCollabRequests.length}
              </span>
            )}
          </h2>
          {eventCollabRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No event collab requests yet</p>
          ) : (
            <div className="space-y-3">
              {eventCollabRequests.map((req) => {
                const event = req.event;
                const organizer = req.organizer;
                const loading = eventCollabLoading === req.eventId;
                return (
                  <div key={req.eventId} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        {event ? (
                          <Link
                            to="/events/$eventHandle"
                            params={{ eventHandle: getEventHandle(event) }}
                            className="font-medium text-sm hover:underline"
                          >
                            {event.title}
                          </Link>
                        ) : (
                          <p className="font-medium text-sm">{req.eventId}</p>
                        )}
                        {event?.date && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" /> {event.date}
                          </p>
                        )}
                        {event?.location && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" /> {event.location}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Requesting organizer:{" "}
                          {organizer ? (
                            <Link
                              to="/users/$username"
                              params={{ username: organizer.username ?? organizer.id }}
                              className="font-medium text-foreground hover:underline"
                            >
                              @{organizer.username ?? organizer.displayName}
                            </Link>
                          ) : (
                            <span className="font-medium text-foreground">Unknown</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" onClick={() => handleEventCollabDecision(req, "approved")} disabled={loading}>
                          {loading ? "…" : "Approve"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEventCollabDecision(req, "declined")} disabled={loading}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Events ── */}
      {!editing && (() => {
        const now = new Date();
        const eventDate = (e: EventItem) => e.startDate ? new Date(e.startDate) : new Date(0);
        const upcoming = circleEvents.filter((e) => eventDate(e) >= now).sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime());
        const past = circleEvents.filter((e) => eventDate(e) < now).sort((a, b) => eventDate(b).getTime() - eventDate(a).getTime());

        const EventCard = ({ event }: { event: EventItem }) => (
          <Link
            key={event.id}
            to="/events/$eventHandle"
            params={{ eventHandle: getEventHandle(event) }}
            className="rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">{event.emoji}</span>
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-sm truncate">{event.title}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" /> {event.date}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> {event.location}
                </p>
              </div>
            </div>
          </Link>
        );

        return (
          <>
            <section className="card-base p-6 space-y-3">
              <h2 className="text-sm font-semibold">Upcoming events{upcoming.length > 0 && ` (${upcoming.length})`}</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upcoming.map((event) => <EventCard key={event.id} event={event} />)}
                </div>
              )}
            </section>

            {past.length > 0 && (
              <section className="card-base p-6 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Past events ({past.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
                  {past.map((event) => <EventCard key={event.id} event={event} />)}
                </div>
              </section>
            )}
          </>
        );
      })()}

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
                      const displayTitle = editing ? (draft.memberTitles?.[m.id] ?? m.title) : m.title;
                      const hasTag = !!(displayTitle && displayTitle !== "Member");
                      const canEditThisTag = !!(user && (isOwner || isAdmin || (isManager && m.id === user.id)));
                      const isEditingTag = editingTitleId === m.id;
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {m.username && <p className="text-xs text-muted-foreground truncate">@{m.username}</p>}
                                {hasTag && (
                                  <span className="text-[11px] px-1.5 py-0 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-medium leading-5">{displayTitle}</span>
                                )}
                              </div>
                            </div>
                          </Link>

                          {/* Tag editing */}
                          {editing && canEditThisTag && (
                            isEditingTag ? (
                              <input
                                autoFocus
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setDraft((d) => ({ ...d, memberTitles: { ...d.memberTitles, [m.id]: titleDraft.trim() } }));
                                    setEditingTitleId(null);
                                  }
                                  if (e.key === "Escape") setEditingTitleId(null);
                                }}
                                onBlur={() => setEditingTitleId(null)}
                                placeholder="e.g. Finance Lead"
                                className="h-7 w-32 text-xs rounded border border-input bg-transparent px-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setEditingTitleId(m.id); setTitleDraft(hasTag ? (draft.memberTitles?.[m.id] ?? m.title ?? "") : ""); }}
                                className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 shrink-0"
                              >
                                {hasTag ? "Edit tag" : "Add tag"}
                              </button>
                            )
                          )}

                          {isThisOwner ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold shrink-0">Owner</span>
                          ) : isAlreadyManager ? (
                            <>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 font-medium shrink-0">Manager</span>
                              {editing && (isOwner || isAdmin) && (
                                <>
                                  <button onClick={() => setConfirmAction({ id: m.id, name: m.displayName || m.username, type: "demote", isManager: true })} disabled={actioning} className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                                    Demote
                                  </button>
                                  <button onClick={() => setConfirmAction({ id: m.id, name: m.displayName || m.username, type: "kick", isManager: true })} disabled={actioning} className="text-xs text-muted-foreground hover:text-destructive border border-border hover:border-destructive/40 rounded px-1.5 py-0.5 shrink-0">
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
                                    <button onClick={() => handlePromoteToManager(m)} disabled={actioning} className="text-xs text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                                      {actioning ? "…" : "Promote"}
                                    </button>
                                  )}
                                  <button onClick={() => setConfirmAction({ id: m.id, name: m.displayName || m.username, type: "kick", isManager: false })} disabled={actioning} className="text-xs text-muted-foreground hover:text-destructive border border-border hover:border-destructive/40 rounded px-1.5 py-0.5 shrink-0">
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
