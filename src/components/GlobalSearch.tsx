import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { searchAll, type SearchResult } from "@/data/backend";

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await searchAll(q);
      setResults(res);
      setActive(0);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function clear() {
    setQ("");
    setResults([]);
    inputRef.current?.focus();
  }

  function navigate(r: SearchResult) {
    setFocused(false);
    setQ("");
    setResults([]);
    if (r.type === "circle") {
      router.navigate({ to: "/circles/$circleHandle", params: { circleHandle: r.handle } });
    } else {
      router.navigate({ to: "/users/$username", params: { username: r.username } });
    }
  }

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) navigate(results[active]);
  }, [results, active]);

  const showDropdown = focused && q.trim().length >= 2;
  const circles = results.filter((r) => r.type === "circle");
  const people  = results.filter((r) => r.type === "person");

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className={`flex items-center gap-2 h-9 px-3 rounded-full border bg-muted/50 transition-colors ${focused ? "border-ring ring-1 ring-ring" : "border-border"}`}>
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKey}
          placeholder="Search circles and people…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
        />
        {q && (
          <button onClick={clear} className="shrink-0">
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          {loading && (
            <p className="px-4 py-4 text-center text-sm text-muted-foreground">Searching…</p>
          )}

          {!loading && results.length === 0 && (
            <p className="px-4 py-4 text-center text-sm text-muted-foreground">No results for "{q}"</p>
          )}

          {!loading && circles.length > 0 && (
            <section>
              <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Circles</p>
              {circles.map((r) => {
                const idx = results.indexOf(r);
                return <ResultRow key={r.id} result={r} highlighted={idx === active} onMouseEnter={() => setActive(idx)} onClick={() => navigate(r)} />;
              })}
            </section>
          )}

          {!loading && people.length > 0 && (
            <section>
              <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">People</p>
              {people.map((r) => {
                const idx = results.indexOf(r);
                return <ResultRow key={r.id} result={r} highlighted={idx === active} onMouseEnter={() => setActive(idx)} onClick={() => navigate(r)} />;
              })}
            </section>
          )}

          <div className="h-2" />
        </div>
      )}
    </div>
  );
}

function ResultRow({ result, highlighted, onMouseEnter, onClick }: {
  result: SearchResult;
  highlighted: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${highlighted ? "bg-muted" : "hover:bg-muted/50"}`}
    >
      <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center overflow-hidden bg-muted/80">
        {result.type === "circle" ? (
          result.iconUrl
            ? <img src={result.iconUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-base leading-none">{result.emoji}</span>
        ) : (
          result.avatarUrl
            ? <img src={result.avatarUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-xs font-bold text-muted-foreground">{result.name[0].toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{result.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {result.type === "circle" ? result.category : `@${result.username}${result.university ? ` · ${result.university}` : ""}`}
        </p>
      </div>
    </button>
  );
}
