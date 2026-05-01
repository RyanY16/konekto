import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Home, Users, Calendar, Tag, Briefcase, MapPin, User } from "lucide-react";
import type { ComponentType } from "react";
import { ThemeToggle } from "./ThemeToggle";
import AuthProvider, { useAuth } from "@/components/AuthProvider";
import SignInDialog from "@/components/SignInDialog";

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }> };

const nav: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/circles", label: "Circles", icon: Users },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/deals", label: "Deals", icon: Tag },
  { to: "/careers", label: "Careers", icon: Briefcase },
  { to: "/japan-life", label: "Japan Life", icon: MapPin },
  { to: "/profile", label: "Profile", icon: User },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
        K
      </div>
      <span className="text-lg font-semibold tracking-tight">Konekto</span>
    </Link>
  );
}

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
      {/* Top bar (mobile + desktop) */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
            <ThemeToggle />
            <div className="ml-3 flex items-center gap-2">
              <AuthControls />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-10 animate-fade-up">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="grid grid-cols-7 h-16">
          {nav.map((item) => {
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
                <span className="truncate px-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </AuthProvider>
  );
}

function AuthControls() {
  try {
    const { user, loading, signOut } = useAuth();
    if (loading) return <div className="h-8 w-8 rounded bg-muted" />;
    if (!user) return <SignInDialog />;

    return (
      <div className="flex items-center gap-2">
        <button className="text-sm text-muted-foreground" onClick={() => signOut()}>Sign out</button>
      </div>
    );
  } catch (err) {
    return null;
  }
}
