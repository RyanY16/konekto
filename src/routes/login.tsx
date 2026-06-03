import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagPicker } from "@/components/TagPicker";
import { UniversityPicker } from "@/components/UniversityPicker";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getProfileByUsername, upsertProfile } from "@/data/backend";
import { CheckCircle2, Loader2 } from "lucide-react";
import { KonektoLogo } from "@/components/KonektoLogo";
import { NativeSelect } from "@/components/ui/native-select";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Konekto" }] }),
  component: LoginPage,
});

const LEVEL_OPTIONS = ["High School", "Undergraduate", "Masters", "PhD", "Research Student"] as const;
type Level = typeof LEVEL_OPTIONS[number];

function LoginPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, user, profileIncomplete, profileReady, refreshUser } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [university, setUniversity] = useState("");
  const [level, setLevel] = useState<Level | "">("");
  const [yearNum, setYearNum] = useState("");
  const year = level && yearNum ? `${level} Year ${yearNum}` : (level || "");
  const [interests, setInterests] = useState<string[]>([]);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!user || !profileReady) return;
    if (profileIncomplete) {
      setStep(2);
    } else {
      navigate({ to: "/" });
    }
  }, [user, profileReady, profileIncomplete]);

  useEffect(() => {
    const u = username.trim();
    if (!u) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      const existing = await getProfileByUsername(u).catch(() => null);
      setUsernameStatus(existing ? "taken" : "available");
    }, 400);
  }, [username]);

  async function handleGoogle() {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setGoogleError(err?.message ?? "Google sign-in failed.");
      setGoogleLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setProfileError("Please enter your name."); return; }
    if (!username.trim()) { setProfileError("Please choose a username."); return; }
    if (usernameStatus === "taken") { setProfileError("That username is taken."); return; }
    if (usernameStatus === "checking") { setProfileError("Still checking username, please wait."); return; }

    if (!supabase) { setProfileError("Session expired — please refresh and try again."); return; }
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    const uid = sessionUser?.id ?? null;
    if (!uid) { setProfileError("Session expired — please refresh and try again."); return; }

    setProfileLoading(true);
    setProfileError("");
    try {
      await upsertProfile(uid, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        university,
        year,
        interests,
      });
      await refreshUser();
      navigate({ to: "/" });
    } catch (err: any) {
      setProfileError(err?.message ?? "Could not save profile.");
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/">
            <KonektoLogo variant="full" className="h-20 w-20 mx-auto mb-4 hover:opacity-90 transition-opacity" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 1 ? "Welcome to Konekto" : "Set up your profile"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 ? "Sign in or create an account to continue" : "Almost there — tell us a bit about yourself"}
          </p>
        </div>

        {step === 2 && (
          <div className="flex gap-1.5 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </Button>

            {googleError && <p className="text-sm text-destructive text-center">{googleError}</p>}
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Full name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Yuki Tanaka"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none pointer-events-none">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                  placeholder="yukitanaka"
                  autoComplete="username"
                  className={`pl-7 pr-8 ${
                    usernameStatus === "taken" ? "border-destructive focus-visible:ring-destructive" :
                    usernameStatus === "available" ? "border-green-500 focus-visible:ring-green-500" : ""
                  }`}
                  required
                />
                {usernameStatus === "checking" && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {usernameStatus === "taken" && (
                <p className="text-xs text-destructive">@{username} is already taken</p>
              )}
              {usernameStatus === "available" && (
                <p className="text-xs text-green-600 dark:text-green-400">@{username} is available ✓</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="university">School</Label>
              <UniversityPicker value={university} onChange={setUniversity} extraOptions={["Other"]} />
            </div>

            <div className="space-y-1.5">
              <Label>Year</Label>
              <div className="flex gap-2">
                <NativeSelect
                  wrapperClassName="flex-1"
                  value={level}
                  onChange={(e) => { setLevel(e.target.value as Level | ""); setYearNum(""); }}
                >
                  <option value="">— Level —</option>
                  {LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </NativeSelect>
                {level && level !== "Research Student" && (
                  <input
                    type="number"
                    min={1}
                    value={yearNum}
                    onChange={(e) => setYearNum(e.target.value)}
                    placeholder="Year"
                    className="h-10 w-24 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Interests <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <TagPicker value={interests} onChange={setInterests} />
            </div>

            {profileError && <p className="text-sm text-destructive">{profileError}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={
                profileLoading ||
                !displayName.trim() ||
                !username.trim() ||
                usernameStatus === "idle" ||
                usernameStatus === "checking" ||
                usernameStatus === "taken"
              }
            >
              {profileLoading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                : "Finish — take me in"
              }
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              You can update all of this later in your profile settings.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
