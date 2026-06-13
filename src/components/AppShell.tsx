import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { BriefcaseBusiness, Home, Users, User, Calendar, Tag, Settings, Shield } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import AuthProvider, { useAuth } from "@/components/AuthProvider";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { KonektoLogo } from "@/components/KonektoLogo";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { setLanguage, type Language } from "@/i18n";

/**
 * Applies the saved language from localStorage after hydration.
 * i18n always initializes with "en" so SSR HTML matches the client's first
 * render; this effect then switches to the real locale without causing a mismatch.
 */
function I18nSync() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("konekto_lang");
      if (saved && saved !== i18next.language) {
        i18next.changeLanguage(saved);
      }
    } catch {
      // localStorage may be unavailable in restricted environments
    }
  }, []);
  return null;
}

type NavItem = { to: string; labelKey: string; icon: ComponentType<{ className?: string }> };

const navItems: NavItem[] = [
  { to: "/", labelKey: "nav.home", icon: Home },
  { to: "/circles", labelKey: "nav.circles", icon: Users },
  { to: "/events", labelKey: "nav.events", icon: Calendar },
  { to: "/discounts", labelKey: "nav.deals", icon: Tag },
  { to: "/careers", labelKey: "nav.opportunities", icon: BriefcaseBusiness },
  { to: "/profile", labelKey: "nav.profile", icon: User },
];

// Routes that manage their own full-screen layout (no app shell chrome)
const BARE_ROUTES = ["/login", "/signup"];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <KonektoLogo variant="icon" className="h-9 w-9" />
      <span className="text-lg font-semibold tracking-tight">Konekto</span>
    </Link>
  );
}

function ProfileGuard() {
  const { user, loading, profileReady, profileIncomplete } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`[guard] check — loading=${loading} profileReady=${profileReady} user=${user?.id ?? "null"} profileIncomplete=${profileIncomplete} pathname=${pathname}`);
    if (loading || !profileReady || !user || profileIncomplete === false) return;
    if (pathname === "/signup" || pathname === "/login") return;
    console.log("[guard] → redirecting to /login");
    navigate({ to: "/login" });
  }, [loading, profileReady, user, profileIncomplete, pathname]);

  return null;
}

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isBare = BARE_ROUTES.includes(pathname);
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <AuthProvider>
      <I18nSync />
      {isBare ? (
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
      ) : (
        <>
          <ProfileGuard />
          <div className="min-h-screen bg-background">
            {/* Top bar */}
            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
              <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-2 min-w-0">
                <Logo />
                <div className="hidden sm:flex md:hidden lg:flex flex-1 min-w-0 mx-2">
                  <GlobalSearch />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <AuthNav isActive={isActive} />
                  <NotificationsButton />
                  <AdminButton />
                  <LanguageToggle />
                  <Link
                    to="/settings"
                    aria-label="Settings"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <AuthControls />
                  </div>
                </div>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 md:pb-10 animate-fade-up" style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}>
              <Outlet />
            </main>

            {/* Footer */}
            <footer className="hidden md:block border-t border-border bg-background">
              <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between text-xs text-muted-foreground">
                <span suppressHydrationWarning>© {new Date().getFullYear()} Konekto</span>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.instagram.com/join.konekto"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="hover:text-foreground transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/joinkonekto"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="hover:text-foreground transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <div className="w-px h-3 bg-border" />
                  <Link
                    to="/about"
                    className="rounded-full border border-border px-3 py-1.5 font-medium hover:text-foreground hover:bg-muted transition-colors"
                  >
                    About
                  </Link>
                  <Link
                    to="/features"
                    className="rounded-full border border-border px-3 py-1.5 font-medium hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Features
                  </Link>
                </div>
              </div>
            </footer>

            {/* Bottom nav (mobile) */}
            <AuthBottomNav isActive={isActive} />
          </div>
        </>
      )}
    </AuthProvider>
  );
}

function AuthNav({ isActive }: { isActive: (to: string) => boolean }) {
  const { t } = useTranslation();
  return (
    <nav className="hidden md:flex items-center gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AuthBottomNav({ isActive }: { isActive: (to: string) => boolean }) {
  const { t } = useTranslation();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate px-0.5">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function LanguageToggle() {
  const { i18n } = useTranslation();
  const lang = (i18n.language?.startsWith("ja") ? "ja" : "en") as Language;

  function toggle() {
    const next: Language = lang === "en" ? "ja" : "en";
    setLanguage(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Switch language"
      className="inline-flex items-center justify-center h-9 px-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors gap-1 tracking-wide"
    >
      <span className="text-sm">{lang === "ja" ? "🇯🇵" : "🇬🇧"}</span>
      <span>{lang === "ja" ? "JP" : "EN"}</span>
    </button>
  );
}

function AdminButton() {
  try {
    const { isAdmin } = useAuth();
    if (!isAdmin) return null;
    return (
      <Link
        to="/admin"
        aria-label="Admin moderation"
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Shield className="h-4 w-4" />
      </Link>
    );
  } catch {
    return null;
  }
}

function NotificationsButton() {
  try {
    const { user } = useAuth();
    if (!user) return null;
    return <NotificationsDropdown userId={user.id} />;
  } catch {
    return null;
  }
}

function AuthControls() {
  try {
    const { user, loading, signOut } = useAuth();
    const { t } = useTranslation();
    if (loading) return <div className="h-8 w-8 rounded bg-muted animate-pulse" />;
    if (!user) {
      return (
        <div className="flex items-center gap-1.5">
          <Link to="/login" className="px-2.5 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap">
            {t("auth.login")}
          </Link>
        </div>
      );
    }
    return (
      <button className="text-sm text-muted-foreground hover:text-foreground transition-colors" onClick={() => signOut()}>
        {t("auth.signout")}
      </button>
    );
  } catch {
    return null;
  }
}
