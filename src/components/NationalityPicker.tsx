import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { NATIONALITIES } from "@/data/profile-options";

export function NationalityPicker({ value, onChange, className }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? NATIONALITIES.filter((n) => n.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : NATIONALITIES.slice(0, 8);

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = NATIONALITIES.find((n) => n.name === value);

  return (
    <div ref={wrapRef} className={`relative w-full ${className ?? ""}`}>
      <div className="relative">
        {selected && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">
            {selected.flag}
          </span>
        )}
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search nationality…"
          autoComplete="off"
          className={selected ? "pl-9" : ""}
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md text-sm">
          {filtered.map((n) => (
            <li key={n.name}>
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(n.name);
                  setQuery(n.name);
                  setOpen(false);
                }}
              >
                <span>{n.flag}</span>
                <span>{n.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
