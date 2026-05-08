import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { UNIVERSITIES } from "@/data/universities";

export function UniversityPicker({ value, onChange, className, extraOptions }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  extraOptions?: string[];
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const extras = (extraOptions ?? []).filter((e) => !query || e.toLowerCase().includes(query.toLowerCase()));
  const filtered = query.length > 0
    ? UNIVERSITIES.filter((u) => u.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];
  const allOptions = [...extras, ...filtered];

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className={`relative w-full ${className ?? ""}`}>
      <Input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search school…"
        autoComplete="off"
      />
      {open && allOptions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md text-sm">
          {allOptions.map((uni) => (
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
