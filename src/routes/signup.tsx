import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagPicker } from "@/components/TagPicker";
import { UniversityPicker } from "@/components/UniversityPicker";
import { useAuth } from "@/components/AuthProvider";
import { getProfileByUsername, checkEmailExists } from "@/data/backend";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Konekto" }] }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [university, setUniversity] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "taken" | "available">("idle");
  const emailCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const u = username.trim();
    if (!u) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    usernameCheckRef.current = setTimeout(async () => {
      const existing = await getProfileByUsername(u);
      setUsernameStatus(existing ? "taken" : "available");
    }, 400);
  }, [username]);

  useEffect(() => {
    const e = email.trim();
    if (!e || !e.includes("@")) { setEmailStatus("idle"); return; }
    setEmailStatus("checking");
    if (emailCheckRef.current) clearTimeout(emailCheckRef.current);
    emailCheckRef.current = setTimeout(async () => {
      const exists = await checkEmailExists(e);
      setEmailStatus(exists ? "taken" : "available");
    }, 400);
  }, [email]);

  const handleNext = async () => {
    if (step === 1) {
      if (!fullName.trim() || !username.trim() || !email.trim()) {
        setError("Please fill in all fields.");
        return;
      }
      if (usernameStatus === "taken") {
        setError("That username is already taken.");
        return;
      }
      if (usernameStatus === "checking") {
        setError("Still checking username availability, please wait.");
        return;
      }
      if (emailStatus === "taken") {
        setError("An account with that email already exists.");
        return;
      }
      if (emailStatus === "checking") {
        setError("Still checking email, please wait.");
        return;
      }
      setError("");
      setStep(2);
    } else if (step === 2) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      setError("");
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, {
        display_name: fullName,
        username: username.trim().toLowerCase(),
        university,
        interests: selectedInterests,
      });

      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="h-16 w-16 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-4 text-3xl">✉️</div>
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate({ to: "/login" })}>
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">K</div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Step {step} of 3</p>
        </div>

        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          ← Back to home
        </Link>

        {/* Step indicators */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <form onSubmit={step < 3 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-4" noValidate>
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Yuki Tanaka" autoFocus />
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
                    className={`pl-7 ${usernameStatus === "taken" ? "border-destructive focus-visible:ring-destructive" : usernameStatus === "available" ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                    autoComplete="username"
                  />
                </div>
                {usernameStatus === "checking" && <p className="text-xs text-muted-foreground">Checking availability…</p>}
                {usernameStatus === "taken" && <p className="text-xs text-destructive">@{username} is already taken</p>}
                {usernameStatus === "available" && <p className="text-xs text-green-600 dark:text-green-400">@{username} is available</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={emailStatus === "taken" ? "border-destructive focus-visible:ring-destructive" : emailStatus === "available" ? "border-green-500 focus-visible:ring-green-500" : ""}
                />
                {emailStatus === "checking" && <p className="text-xs text-muted-foreground">Checking…</p>}
                {emailStatus === "taken" && <p className="text-xs text-destructive">An account with this email already exists</p>}
                {emailStatus === "available" && <p className="text-xs text-green-600 dark:text-green-400">Email is available</p>}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="university">University</Label>
                <UniversityPicker value={university} onChange={setUniversity} />
              </div>
              <div className="space-y-1.5">
                <Label>Interests</Label>
                <TagPicker value={selectedInterests} onChange={setSelectedInterests} />
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => { setStep((step - 1) as 1 | 2 | 3); setError(""); }}>
                Back
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={
                loading ||
                (step === 1 && (
                  !fullName.trim() ||
                  !username.trim() ||
                  !email.trim() ||
                  usernameStatus === "idle" ||
                  usernameStatus === "checking" ||
                  usernameStatus === "taken" ||
                  emailStatus === "idle" ||
                  emailStatus === "checking" ||
                  emailStatus === "taken"
                ))
              }
            >
              {step < 3 ? "Next" : loading ? "Creating account…" : "Create account"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
