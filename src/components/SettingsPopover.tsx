"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, Moon, Sun } from "lucide-react";

type ColorScheme = "default" | "blue";

const COLOR_KEY = "konekto-color";
const THEME_KEY = "konekto-theme";

function getInitialColor(): ColorScheme {
  if (typeof window === "undefined") return "blue";
  const s = localStorage.getItem(COLOR_KEY);
  return s === "default" ? "default" : "blue";
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
  { id: "blue",    label: "Blue",  colors: ["#6ECFEA", "#6098E8", "#7B5CE6"] },
];

export function SettingsPopover() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<ColorScheme>("default");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = getInitialColor();
    const t = getInitialTheme();
    setColor(c);
    setTheme(t);
    applyScheme(c, t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-border bg-popover shadow-pop p-3 space-y-3">
          {/* Dark / Light */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Appearance</p>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>

          {/* Colour scheme */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Colour</p>
            <div className="flex gap-2">
              {SCHEMES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setColorScheme(s.id)}
                  title={s.label}
                  className={`flex items-center gap-1.5 flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    color === s.id
                      ? "border-foreground bg-muted"
                      : "border-border hover:bg-muted"
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
          </div>
        </div>
      )}
    </div>
  );
}
