import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { UNIVERSITIES } from "@/data/universities";
import { CAREER_FIELDS, INTEREST_GROUPS, GOALS } from "@/data/profile-options";

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

function UniversityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const filtered = query.length > 0
    ? UNIVERSITIES.filter((u) => u.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full">
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search university…"
        className="h-8 text-sm"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md text-sm">
          {filtered.map((uni) => (
            <li key={uni}>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 hover:bg-muted truncate"
                onMouseDown={(e) => { e.preventDefault(); onChange(uni); setQuery(uni); setOpen(false); }}
              >
                {uni}
              </button>
            </li>
          ))}
        </ul>
      )}
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

function InterestPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const set = new Set(value);
  const toggle = (item: string) => {
    const next = new Set(set);
    next.has(item) ? next.delete(item) : next.add(item);
    onChange(Array.from(next));
  };
  return (
    <div className="space-y-4">
      {INTEREST_GROUPS.map((group) => (
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
        </div>
      ))}
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

type Draft = Partial<UserProfile> & { degree: DegreeType; yearNum: string };

// ── Main page ─────────────────────────────────────────────────────────────────

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
    getProfile(user.id).then(setProfile);
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

  function startEditing() {
    const { degree, num } = parseYear(profile?.year ?? "");
    setDraft({
      username: profile?.username ?? "",
      displayName: profile?.displayName ?? "",
      university: profile?.university ?? "",
      degree,
      yearNum: num || "1",
      bio: profile?.bio ?? "",
      interests: profile?.interests ?? [],
      careerField: profile?.careerField ?? "",
      goals: profile?.goals ?? [],
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
        year: formatYear(draft.degree ?? "Bachelors", draft.yearNum ?? "1"),
        bio: draft.bio ?? "",
        avatarUrl,
        tags: profile?.tags ?? [],
        interests: draft.interests ?? [],
        careerField: draft.careerField ?? "",
        goals: draft.goals ?? [],
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

  return (
    <div>
      <PageHeader eyebrow="Profile" title="Your hub." />

      {/* ── Profile identity card ── */}
      <section className="card-base p-6 mb-4">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <AvatarUploader src={avatarSrc} initials={initials} editing={editing} onUpload={handleAvatarFile} />

          <div className="flex-1 min-w-0 space-y-2">
            {editing ? (
              <Input
                value={draft.displayName ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
                placeholder="Display name"
                className="font-bold h-9"
              />
            ) : (
              <h2 className="text-2xl font-bold">{profile?.displayName || "—"}</h2>
            )}

            {editing ? (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">@</span>
                <Input
                  value={draft.username ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() }))}
                  placeholder="username"
                  className="h-7 text-sm w-40"
                />
              </div>
            ) : profile?.username ? (
              <p className="text-sm font-medium text-muted-foreground">@{profile.username}</p>
            ) : null}

            <p className="text-sm text-muted-foreground">{user.email}</p>

            <span className={`inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-xs font-semibold ${
              user.role === "admin"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}>
              {user.role === "admin" ? "⚡ Admin" : "User"}
            </span>

            {editing ? (
              <div className="space-y-2">
                <UniversityPicker
                  value={draft.university ?? ""}
                  onChange={(v) => setDraft((d) => ({ ...d, university: v }))}
                />
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value={draft.degree}
                    onChange={(e) => setDraft((d) => ({ ...d, degree: e.target.value as DegreeType, yearNum: "1" }))}
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {DEGREE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <span className="text-sm text-muted-foreground">Year</span>
                  <input
                    type="number" min={1} max={MAX_YEAR[draft.degree ?? "Bachelors"]}
                    value={draft.yearNum ?? "1"}
                    onChange={(e) => setDraft((d) => ({ ...d, yearNum: e.target.value }))}
                    className="h-8 w-14 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {[profile?.university, gradeLabel].filter(Boolean).join(" · ") || "No university info yet"}
              </p>
            )}
          </div>

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

        {/* Bio */}
        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">About me</p>
          {editing ? (
            <textarea
              value={draft.bio ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
              placeholder="Write a short bio…"
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {profile?.bio || <span className="italic">No bio yet — click Edit to add one.</span>}
            </p>
          )}
          {saveError && <p className="text-sm text-destructive mt-2">{saveError}</p>}
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
                <span key={i} className="chip chip-primary">{i}</span>
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
            <ChipPicker
              options={GOALS}
              value={draft.goals ?? []}
              onChange={(v) => setDraft((d) => ({ ...d, goals: v }))}
            />
          ) : profile?.goals && profile.goals.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.goals.map((g) => (
                <span key={g} className="chip">{g}</span>
              ))}
            </div>
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
