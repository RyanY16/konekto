import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Bell, Palette, UserX, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Konekto" }] }),
  component: SettingsPage,
});

// ── Theme / colour helpers ──────────────────────────────────────────────────

type ColorScheme = "default" | "blue";
const COLOR_KEY = "konekto-color";
const THEME_KEY = "konekto-theme";

function getInitialColor(): ColorScheme {
  if (typeof window === "undefined") return "default";
  return localStorage.getItem(COLOR_KEY) === "default" ? "default" : "blue";
}

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const s = localStorage.getItem(THEME_KEY);
  if (s === "dark" || s === "light") return s;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyScheme(color: ColorScheme, theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("scheme-blue", color === "blue");
}

const SCHEMES: { id: ColorScheme; label: string; colors: string[] }[] = [
  { id: "default", label: "Orange", colors: ["#F4895A", "#E0569E", "#9B59E8"] },
  { id: "blue",    label: "Blue",   colors: ["#6ECFEA", "#6098E8", "#7B5CE6"] },
];

type Tab = "appearance" | "notifications" | "account";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account",       label: "Account",       icon: UserX },
];

// ── Main page ───────────────────────────────────────────────────────────────

function SettingsPage() {
  const [tab, setTab] = useState<Tab | null>(null);

  const panel = tab === "appearance"    ? <AppearancePanel />
              : tab === "notifications" ? <NotificationsPanel />
              : tab === "account"       ? <AccountPanel />
              : null;

  return (
    <div className="max-w-3xl">
      {/* ── Mobile: drill-down ─────────────────────────────────────── */}
      <div className="md:hidden">
        {tab === null ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <button
                onClick={() => setTab(null)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <ChevronLeft className="h-4 w-4" /> Settings
              </button>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-6">
              {TABS.find((t) => t.id === tab)?.label}
            </h1>
            {panel}
          </>
        )}
      </div>

      {/* ── Desktop: sidebar + panel ────────────────────────────────── */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>
        <div className="flex gap-6">
          <nav className="w-44 shrink-0">
            <ul className="space-y-0.5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <li key={id}>
                  <button
                    onClick={() => setTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      tab === id
                        ? "bg-primary-soft text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex-1 min-w-0">
            {tab
              ? panel
              : <p className="text-sm text-muted-foreground pt-2">Select a category.</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Appearance ──────────────────────────────────────────────────────────────

function AppearancePanel() {
  const [color, setColor] = useState<ColorScheme>("default");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const c = getInitialColor();
    const t = getInitialTheme();
    setColor(c);
    setTheme(t);
    applyScheme(c, t);
  }, []);

  function setColorScheme(c: ColorScheme) {
    setColor(c);
    localStorage.setItem(COLOR_KEY, c);
    applyScheme(c, theme);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyScheme(color, next);
  }

  return (
    <Panel title="Appearance">
      <Row label="Theme" description={theme === "dark" ? "Dark mode" : "Light mode"}>
        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </Row>

      <Row label="Colour" description="App colour scheme">
        <div className="flex gap-2">
          {SCHEMES.map((s) => (
            <button
              key={s.id}
              onClick={() => setColorScheme(s.id)}
              title={s.label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                color === s.id ? "border-foreground bg-muted" : "border-border hover:bg-muted"
              }`}
            >
              <span className="flex gap-0.5 shrink-0">
                {s.colors.map((c) => (
                  <span key={c} className="h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </Row>
    </Panel>
  );
}

// ── Notifications ───────────────────────────────────────────────────────────

function NotificationsPanel() {
  return (
    <Panel title="Notifications">
      <div className="py-8 text-center text-muted-foreground text-sm">
        Notification preferences coming soon.
      </div>
    </Panel>
  );
}

// ── Account ─────────────────────────────────────────────────────────────────

function AccountPanel() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await signOut();
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Account">
      <Row label="Delete account" description="Permanently delete your account and all your data">
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Are you sure?</span>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting…" : "Yes, delete"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="destructive" onClick={() => setConfirming(true)}>
            Delete account
          </Button>
        )}
      </Row>
    </Panel>
  );
}

// ── Shared primitives ────────────────────────────────────────────────────────

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {children}
      </div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

