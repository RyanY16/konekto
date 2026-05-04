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
import { Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Konekto" }] }),
  component: SignUpPage,
});

const YEAR_OPTIONS = [
  "1st year", "2nd year", "3rd year", "4th year",
  "Masters", "PhD", "Exchange student", "Alumni",
];

function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, user, profileIncomplete, refreshUser } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step1Error, setStep1Error] = useState("");
  const [step1Loading, setStep1Loading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 2 (verification)
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState("");

  // Step 3 (profile)
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [university, setUniversity] = useState("");
  const [year, setYear] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // If already logged in: complete profile if needed, otherwise go home
  useEffect(() => {
    if (!user) return;
    if (profileIncomplete) {
      setUserId(user.id);
      setStep(3);
    } else if (step !== 3) {
      navigate({ to: "/" });
    }
  }, [user, profileIncomplete]);

  // Listen for email verification in same browser (step 2)
  useEffect(() => {
    if (step !== 2 || !supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id);
        setStep(3);
      }
    });
    return () => sub?.subscription.unsubscribe();
  }, [step]);

  // Username uniqueness check
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

  // ── Step 1: create account ────────────────────────────────────────────────
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setStep1Error("Password must be at least 8 characters.");
      return;
    }
    setStep1Error("");
    setStep1Loading(true);
    try {
      const result = await signUp(email.trim(), password);
      if (result?.id) setUserId(result.id);
      setStep(2);
    } catch (err: any) {
      setStep1Error(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setStep1Loading(false);
    }
  }

  // ── Step 2: check if verified ─────────────────────────────────────────────
  async function handleCheckVerification() {
    if (!supabase) return;
    setCheckLoading(true);
    setCheckError("");
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUserId(data.session.user.id);
        setStep(3);
      } else {
        setCheckError("Email not verified yet — check your inbox and click the link.");
      }
    } finally {
      setCheckLoading(false);
    }
  }

  // ── Step 3: save profile ──────────────────────────────────────────────────
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

  const passwordStrength = password.length === 0 ? null
    : password.length < 8 ? "weak"
    : password.length < 12 ? "ok"
    : "strong";

  const strengthColor = passwordStrength === "weak" ? "bg-destructive"
    : passwordStrength === "ok" ? "bg-yellow-400"
    : "bg-green-500";

  const strengthWidth = passwordStrength === "weak" ? "w-1/3"
    : passwordStrength === "ok" ? "w-2/3"
    : "w-full";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4 hover:opacity-90 transition-opacity">
              K
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 1 && "Create your account"}
            {step === 2 && "Check your email"}
            {step === 3 && "Set up your profile"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 && "Join thousands of students across Japan"}
            {step === 2 && `We sent a link to ${email}`}
            {step === 3 && "Almost there — tell us a bit about yourself"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* ── Step 1 ──────────────────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleCreateAccount} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strengthColor} ${strengthWidth}`} />
                  </div>
                  <p className={`text-xs ${passwordStrength === "weak" ? "text-destructive" : passwordStrength === "ok" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                    {passwordStrength === "weak" ? "Too short" : passwordStrength === "ok" ? "Good" : "Strong"}
                  </p>
                </div>
              )}
            </div>

            {step1Error && <p className="text-sm text-destructive">{step1Error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={step1Loading || !email.trim() || password.length < 8}
            >
              {step1Loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account…</> : "Continue"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">Log in</Link>
            </p>
          </form>
        )}

        {/* ── Step 2 ──────────────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-4xl">
              ✉️
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Click the confirmation link in your inbox. Once verified, you'll automatically move to the next step.
              </p>
              <p className="text-xs text-muted-foreground">
                Can't find it? Check your spam folder.
              </p>
            </div>

            {checkError && <p className="text-sm text-destructive">{checkError}</p>}

            <div className="space-y-2">
              <Button onClick={handleCheckVerification} className="w-full" disabled={checkLoading}>
                {checkLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking…</> : "I've verified my email →"}
              </Button>
              <button
                onClick={() => { setStep(1); setStep1Error(""); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Use a different email
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 ──────────────────────────────────────────────────────── */}
        {step === 3 && (
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
              <Label htmlFor="university">University</Label>
              <UniversityPicker value={university} onChange={setUniversity} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="year">Year</Label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— Select year —</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
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
