import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Globe, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { tagClass } from "@/lib/tag-class";
import { Bookmark, Users, Briefcase, Pencil, Check, X, LogOut, Camera } from "lucide-react";
import { events } from "@/data/mock";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import {
  getProfile, upsertProfile, uploadAvatar, getCircles, getJoinedCircleIds,
  joinCircle, leaveCircle, getCircleHandle, type UserProfile,
} from "@/data/backend";
import type { Circle } from "@/data/mock";
import { UniversityPicker } from "@/components/UniversityPicker";
import { NationalityPicker } from "@/components/NationalityPicker";
import { CAREER_FIELDS, INTEREST_GROUPS, GOAL_GROUPS, GOALS, NATIONALITIES } from "@/data/profile-options";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Konekto" },
      { name: "description", content: "Your profile and account settings." },
    ],
  }),
  component: ProfilePage,
});

const DEGREE_TYPES = ["Bachelors", "Masters", "Doctorate"] as const;
type DegreeType = (typeof DEGREE_TYPES)[number];
const MAX_YEAR: Record<DegreeType, number> = { Bachelors: 4, Masters: 2, Doctorate: 6 };

function parseYear(raw: string): { degree: DegreeType; num: string } {
  const [degree, num] = raw.split(" ");
  const validDegree = DEGREE_TYPES.includes(degree as DegreeType) ? (degree as DegreeType) : "Bachelors";
  return { degree: validDegree, num: num ?? "1" };
}
function formatYear(degree: string, num: string) {
  return degree ? `${degree} ${num}`.trim() : "";
}

// ── University searchable combobox ────────────────────────────────────────────


// ── Goal group colours ────────────────────────────────────────────────────────

const GOAL_COLOURS: Record<string, { idle: string; active: string; chip: string }> = {
  "Career":          { idle: "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950", active: "bg-orange-500 border-orange-500 text-white", chip: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  "Academic":        { idle: "border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950", active: "bg-violet-600 border-violet-600 text-white dark:bg-violet-500 dark:border-violet-500", chip: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  "Social & Culture":{ idle: "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950",           active: "bg-rose-500 border-rose-500 text-white",   chip: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
};
const GOAL_DEFAULT = { idle: "border-border text-muted-foreground hover:bg-muted", active: "bg-primary border-primary text-primary-foreground", chip: "bg-muted text-muted-foreground" };

function goalGroupFor(item: string) {
  return GOAL_GROUPS.find((g) => g.items.includes(item as any))?.label ?? null;
}

function GoalPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const set = new Set(value);
  const toggle = (item: string) => {
    const next = new Set(set);
    next.has(item) ? next.delete(item) : next.add(item);
    onChange(Array.from(next));
  };
  return (
    <div className="space-y-4">
      {GOAL_GROUPS.map((group) => {
        const colours = GOAL_COLOURS[group.label] ?? GOAL_DEFAULT;
        return (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => {
                const active = set.has(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle(item)}
                    className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${active ? colours.active : colours.idle}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GoalChips({ goals }: { goals: string[] }) {
  return (
    <div className="space-y-2">
      {GOAL_GROUPS.map((group) => {
        const chips = goals.filter((g) => group.items.includes(g as any));
        if (chips.length === 0) return null;
        const colours = GOAL_COLOURS[group.label] ?? GOAL_DEFAULT;
        return (
          <div key={group.label} className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground w-20 shrink-0">{group.label}</span>
            {chips.map((g) => (
              <span key={g} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colours.chip}`}>{g}</span>
            ))}
          </div>
        );
      })}
      {(() => {
        const ungrouped = goals.filter((g) => !goalGroupFor(g));
        return ungrouped.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {ungrouped.map((g) => <span key={g} className="chip">{g}</span>)}
          </div>
        ) : null;
      })()}
    </div>
  );
}

// ── Multi-select chip picker (flat list) ─────────────────────────────────────

function ChipPicker({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const set = new Set(value);
  const toggle = (item: string) => {
    const next = new Set(set);
    next.has(item) ? next.delete(item) : next.add(item);
    onChange(Array.from(next));
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((item) => {
        const active = set.has(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

// ── Grouped interest picker ───────────────────────────────────────────────────

const GROUP_COLOURS: Record<string, { idle: string; active: string }> = {
  "Tech":                { idle: "border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950",     active: "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500" },
  "Business & Finance":  { idle: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950", active: "bg-amber-500 border-amber-500 text-white" },
  "Health & Wellness":   { idle: "border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950",     active: "bg-teal-600 border-teal-600 text-white dark:bg-teal-500 dark:border-teal-500" },
  "Arts & Culture":      { idle: "border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950", active: "bg-purple-600 border-purple-600 text-white dark:bg-purple-500 dark:border-purple-500" },
  "Social & Languages":  { idle: "border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950", active: "bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500" },
  "Research & Academia": { idle: "border-cyan-200 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-950",     active: "bg-cyan-600 border-cyan-600 text-white dark:bg-cyan-500 dark:border-cyan-500" },
};
const DEFAULT_COLOURS = { idle: "border-border text-muted-foreground hover:bg-muted", active: "bg-primary border-primary text-primary-foreground" };

function InterestPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const set = new Set(value);
  const toggle = (item: string) => {
    const next = new Set(set);
    next.has(item) ? next.delete(item) : next.add(item);
    onChange(Array.from(next));
  };
  return (
    <div className="space-y-4">
      {INTEREST_GROUPS.map((group) => {
        const colours = GROUP_COLOURS[group.label] ?? DEFAULT_COLOURS;
        return (
        <div key={group.label}>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item) => {
              const active = set.has(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${active ? colours.active : colours.idle}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}

// ── Avatar uploader ───────────────────────────────────────────────────────────

function AvatarUploader({
  src, initials, editing, onUpload,
}: {
  src: string | null; initials: string; editing: boolean; onUpload: (f: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative shrink-0">
      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl text-primary-foreground font-bold overflow-hidden">
        {src ? <img src={src} alt="avatar" className="h-full w-full object-cover" /> : initials}
      </div>
      {editing && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity"
          >
            <Camera className="h-6 w-6" />
          </button>
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
          />
        </>
      )}
    </div>
  );
}

// ── Draft type ────────────────────────────────────────────────────────────────

type Draft = Partial<UserProfile> & { degree: DegreeType; yearNum: string; nationality: string };

// ── Main page ─────────────────────────────────────────────────────────────────

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>({ degree: "Bachelors", yearNum: "1" });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [allCircles, setAllCircles] = useState<Circle[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [circleEditing, setCircleEditing] = useState(false);
  const [circleError, setCircleError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const savedEvents = events.slice(0, 3);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => { setProfile(p); setProfileLoading(false); });
    getCircles().then(setAllCircles);
    getJoinedCircleIds(user.id).then((ids) => setJoinedIds(new Set(ids)));
  }, [user]);

  async function toggleCircle(circleId: string) {
    setCircleError(null);
    setTogglingId(circleId);
    try {
      if (joinedIds.has(circleId)) {
        await leaveCircle(user!.id, circleId);
        setJoinedIds((s) => { const n = new Set(s); n.delete(circleId); return n; });
      } else {
        await joinCircle(user!.id, circleId);
        setJoinedIds((s) => new Set(s).add(circleId));
      }
    } catch (err) {
      setCircleError(err instanceof Error ? err.message : "Failed to update membership");
    } finally {
      setTogglingId(null);
    }
  }

  const handleAvatarFile = useCallback((file: File) => {
    setPendingAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, []);

  if (!user) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold">Not signed in</h2>
        <p className="text-sm text-muted-foreground mt-2">Please sign in to view your profile.</p>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div>
        <PageHeader eyebrow="Profile" title="Your hub." />
        <div className="card-base p-6 mb-4 space-y-5 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-4 w-52 rounded bg-muted" />
              <div className="h-4 w-36 rounded bg-muted" />
            </div>
          </div>
          <div className="pt-5 border-t border-border space-y-2">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
        </div>
        <div className="card-base p-6 animate-pulse space-y-3">
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 w-24 rounded-full bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  function startEditing() {
    const { degree, num } = parseYear(profile?.year ?? "");
    setDraft({
      username: profile?.username ?? "",
      displayName: profile?.displayName ?? "",
      university: profile?.university ?? "",
      nationality: profile?.nationality ?? "",
      degree,
      yearNum: num || "1",
      bio: profile?.bio ?? "",
      interests: profile?.interests ?? [],
      careerField: profile?.careerField ?? "",
      goals: profile?.goals ?? [],
      socialLinks: profile?.socialLinks ?? {},
    });
    setAvatarPreview(null);
    setPendingAvatar(null);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setEditing(false);
    setAvatarPreview(null);
    setPendingAvatar(null);
    setSaveError(null);
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    try {
      let avatarUrl = profile?.avatarUrl ?? null;
      if (pendingAvatar) avatarUrl = await uploadAvatar(user!.id, pendingAvatar);
      const updated = await upsertProfile(user!.id, {
        username: draft.username?.trim() || null,
        displayName: draft.displayName ?? "",
        university: draft.university ?? "",
        nationality: draft.nationality ?? "",
        year: formatYear(draft.degree ?? "Bachelors", draft.yearNum ?? "1"),
        bio: draft.bio ?? "",
        avatarUrl,
        tags: profile?.tags ?? [],
        interests: draft.interests ?? [],
        careerField: draft.careerField ?? "",
        goals: draft.goals ?? [],
        socialLinks: draft.socialLinks ?? {},
      });
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setProfile(updated);
      setEditing(false);
      setAvatarPreview(null);
      setPendingAvatar(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const { degree: savedDegree, num: savedNum } = parseYear(profile?.year ?? "");
  const gradeLabel = profile?.year ? `${savedDegree} · Year ${savedNum}` : null;
  const initials = (profile?.displayName || user.email || "?")[0].toUpperCase();
  const avatarSrc = avatarPreview ?? profile?.avatarUrl ?? null;

  const completionSteps = [
    { label: "Add your name",        done: Boolean(profile?.displayName) },
    { label: "Pick a username",      done: Boolean(profile?.username) },
    { label: "Add a photo",          done: Boolean(profile?.avatarUrl) },
    { label: "Set your university",  done: Boolean(profile?.university) },
    { label: "Add your nationality", done: Boolean(profile?.nationality) },
    { label: "Write a bio",          done: Boolean(profile?.bio) },
    { label: "Choose interests",     done: (profile?.interests?.length ?? 0) > 0 },
    { label: "Set your goals",       done: (profile?.goals?.length ?? 0) > 0 },
  ];
  const doneCount = completionSteps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / completionSteps.length) * 100);
  const isComplete = doneCount === completionSteps.length;

  return (
    <div>
      <PageHeader eyebrow="Profile" title="Your hub." />

      {/* ── Onboarding completion banner ── */}
      {!isComplete && !editing && (
        <div className="card-base p-5 mb-4 border-primary/30 bg-primary/5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-semibold text-sm">Complete your profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">{doneCount} of {completionSteps.length} steps done</p>
            </div>
            <span className="text-2xl font-bold text-primary shrink-0">{pct}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
            {completionSteps.map((s) => (
              <div key={s.label} className={`flex items-center gap-2 text-xs ${s.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                <span className={`flex-shrink-0 h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${s.done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                  {s.done ? "✓" : ""}
                </span>
                {s.label}
              </div>
            ))}
          </div>
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Fill in profile
          </button>
        </div>
      )}

      {/* ── Profile identity card ── */}
      <section className="card-base p-6 mb-4">

        {/* Top bar: avatar + save/edit button */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <AvatarUploader src={avatarSrc} initials={initials} editing={editing} onUpload={handleAvatarFile} />
          {editing ? (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={save} disabled={saving}>
                <Check className="h-4 w-4 mr-1" />{saving ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-muted shrink-0"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
          )}
        </div>

        {/* Fields */}
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Name</p>
              <Input
                value={draft.displayName ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Username</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                <Input
                  value={draft.username ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() }))}
                  placeholder="username"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">University</p>
              <UniversityPicker
                value={draft.university ?? ""}
                onChange={(v) => setDraft((d) => ({ ...d, university: v }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Nationality</p>
              <NationalityPicker
                value={draft.nationality ?? ""}
                onChange={(v) => setDraft((d) => ({ ...d, nationality: v }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Degree &amp; Year</p>
              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={draft.degree}
                  onChange={(e) => setDraft((d) => ({ ...d, degree: e.target.value as DegreeType, yearNum: "1" }))}
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {DEGREE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <span className="text-sm text-muted-foreground">Year</span>
                <input
                  type="number" min={1} max={MAX_YEAR[draft.degree ?? "Bachelors"]}
                  value={draft.yearNum ?? "1"}
                  onChange={(e) => setDraft((d) => ({ ...d, yearNum: e.target.value }))}
                  className="h-9 w-16 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">About me</p>
              <textarea
                value={draft.bio ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                placeholder="Write a short bio…"
                rows={9}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
        ) : (
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{profile?.displayName || "—"}</h2>
            {profile?.username && <p className="text-sm font-medium text-muted-foreground">@{profile.username}</p>}
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              user.role === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {user.role === "admin" ? "⚡ Admin" : "User"}
            </span>
            <div className="pt-1 space-y-0.5">
              <p className="text-sm text-muted-foreground">
                {[profile?.university, gradeLabel].filter(Boolean).join(" · ") || "No university info yet"}
              </p>
              {profile?.nationality && (() => {
                const nat = NATIONALITIES.find((n) => n.name === profile.nationality);
                return <p className="text-sm text-muted-foreground">{nat?.flag} {profile.nationality}</p>;
              })()}
            </div>
          </div>
        )}

        {/* Bio (view mode) */}
        {!editing && (
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">About me</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {profile?.bio || <span className="italic">No bio yet — click Edit to add one.</span>}
            </p>
          </div>
        )}

        {/* Social links */}
        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Social links</p>
          {editing ? (
            <div className="space-y-2 max-w-sm">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  value={draft.socialLinks?.website ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, socialLinks: { ...d.socialLinks, website: e.target.value } }))}
                  placeholder="https://yoursite.com"
                  className="w-full pl-9 h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                <input
                  value={(draft.socialLinks?.instagram ?? "").replace(/^@/, "")}
                  onChange={(e) => setDraft((d) => ({ ...d, socialLinks: { ...d.socialLinks, instagram: e.target.value.replace(/^@/, "") } }))}
                  placeholder="handle"
                  className="w-full pl-14 h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  value={draft.socialLinks?.linkedin ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, socialLinks: { ...d.socialLinks, linkedin: e.target.value } }))}
                  placeholder="linkedin.com/in/yourprofile"
                  className="w-full pl-9 h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                <input
                  value={(draft.socialLinks?.line ?? "").replace(/^@/, "")}
                  onChange={(e) => setDraft((d) => ({ ...d, socialLinks: { ...d.socialLinks, line: e.target.value.replace(/^@/, "") } }))}
                  placeholder="LINE ID"
                  className="w-full pl-14 h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          ) : (
            (() => {
              const sl = profile?.socialLinks ?? {};
              const links = [
                sl.website && { key: "website", href: /^https?:\/\//i.test(sl.website) ? sl.website : `https://${sl.website}`, label: (() => { try { return new URL(/^https?:\/\//i.test(sl.website) ? sl.website : `https://${sl.website}`).hostname.replace(/^www\./, ""); } catch { return "Website"; } })(), Icon: Globe },
                sl.instagram && { key: "instagram", href: `https://instagram.com/${sl.instagram.replace(/^@/, "")}`, label: `@${sl.instagram.replace(/^@/, "")}`, Icon: Instagram },
                sl.linkedin && { key: "linkedin", href: /^https?:\/\//i.test(sl.linkedin) ? sl.linkedin : `https://linkedin.com/in/${sl.linkedin.replace(/^@/, "")}`, label: (() => { const m = sl.linkedin.match(/linkedin\.com\/(?:in|company)\/([^/?#]+)/i); return m ? m[1] : sl.linkedin.replace(/^@/, ""); })(), Icon: Linkedin },
                sl.line && { key: "line", href: `https://line.me/R/ti/p/~${sl.line.replace(/^@/, "")}`, label: `@${sl.line.replace(/^@/, "")}`, Icon: MessageCircle },
              ].filter(Boolean) as { key: string; href: string; label: string; Icon: any }[];
              return links.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {links.map(({ key, href, label, Icon }) => (
                    <a key={key} href={href} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                      <Icon className="h-3.5 w-3.5 shrink-0" />{label}
                    </a>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground italic">No links added yet.</p>;
            })()
          )}
        </div>
      </section>

      {/* ── Interests / Career / Goals card ── */}
      <section className="card-base p-6 mb-6 space-y-6">
        {/* Interests */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Interests</p>
          {editing ? (
            <InterestPicker
              value={draft.interests ?? []}
              onChange={(v) => setDraft((d) => ({ ...d, interests: v }))}
            />
          ) : profile?.interests && profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((i) => (
                <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(i)}`}>{i}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No interests added yet.</p>
          )}
        </div>

        {/* Career */}
        <div className="pt-5 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Career field</p>
          {editing ? (
            <select
              value={draft.careerField ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, careerField: e.target.value }))}
              className="h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a field…</option>
              {CAREER_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          ) : profile?.careerField ? (
            <span className="chip chip-primary">{profile.careerField}</span>
          ) : (
            <p className="text-sm text-muted-foreground italic">No career field selected.</p>
          )}
        </div>

        {/* Goals */}
        <div className="pt-5 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Goals</p>
          {editing ? (
            <GoalPicker value={draft.goals ?? []} onChange={(v) => setDraft((d) => ({ ...d, goals: v }))} />
          ) : profile?.goals && profile.goals.length > 0 ? (
            <GoalChips goals={profile.goals} />
          ) : (
            <p className="text-sm text-muted-foreground italic">No goals added yet.</p>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Stat icon={<Bookmark />} label="Saved items" value="14" />
        <Stat icon={<Users />} label="Joined circles" value={`${joinedIds.size}`} />
        <Stat icon={<Briefcase />} label="Applications" value="6" />
      </div>

      {/* ── Circles section ── */}
      <section className="card-base p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">My circles</p>
          <button
            onClick={() => { setCircleEditing((v) => !v); setCircleError(null); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-muted"
          >
            {circleEditing ? <><X className="h-3 w-3" /> Done</> : <><Pencil className="h-3 w-3" /> Manage</>}
          </button>
        </div>

        {circleError && <p className="text-sm text-destructive mb-3">{circleError}</p>}

        {circleEditing ? (
          <div className="space-y-2">
            {allCircles.map((c) => {
              const joined = joinedIds.has(c.id);
              const loading = togglingId === c.id;
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                  <span className="text-2xl shrink-0">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.category} · {c.members} members</p>
                  </div>
                  <button
                    onClick={() => toggleCircle(c.id)}
                    disabled={loading}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${
                      joined
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/80"
                        : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {loading ? "…" : joined ? "Joined" : "Join"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : joinedIds.size > 0 ? (
          <div className="space-y-2">
            {allCircles.filter((c) => joinedIds.has(c.id)).map((c) => (
              <div key={c.id} className="card-base p-3 flex items-center gap-3">
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.category} · {c.members} members</p>
                </div>
                <Link
                  to="/circles/$circleHandle"
                  params={{ circleHandle: getCircleHandle(c) }}
                  className="shrink-0 text-xs font-semibold text-primary hover:underline"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No circles joined yet — click Manage to join some.</p>
        )}
      </section>

      {/* ── Saved events ── */}
      <Block title="Saved events" className="mb-8">
        <div className="space-y-2">
          {savedEvents.map((e) => (
            <div key={e.id} className="card-base p-3 flex items-center gap-3">
              <span className="text-2xl">{e.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.date}</p>
              </div>
              <span className="chip">{e.category}</span>
            </div>
          ))}
        </div>
      </Block>

      {/* ── Account ── */}
      <section className="card-base p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Account</p>
        <div className="flex items-center justify-between text-sm border-b border-border pb-3 mb-3">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{user.email}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">User ID</span>
          <span className="font-mono text-xs text-muted-foreground">{user.id}</span>
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-base p-5 flex items-center gap-4">
      <div className="h-11 w-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Block({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}
