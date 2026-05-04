import { useEffect, useRef, useState } from "react";
import { getMyEditableCircles, getCircleHandle } from "@/data/backend";
import type { Circle } from "@/data/mock";
import { ChevronDown, X } from "lucide-react";

interface CirclePickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  userId: string;
}

export default function CirclePicker({ value, onChange, userId }: CirclePickerProps) {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMyEditableCircles(userId).then(setCircles).catch(() => {});
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = circles.filter((c) => value.includes(c.id));
  const unselected = circles.filter((c) => !value.includes(c.id));

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  if (circles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-1">
        You don't own or edit any circles yet.
      </p>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div
        className="min-h-[2.5rem] w-full rounded-md border border-input bg-background px-3 py-1.5 flex flex-wrap gap-1.5 items-center cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        {selected.length === 0 && (
          <span className="text-sm text-muted-foreground">Select circles…</span>
        )}
        {selected.map((c) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
          >
            {c.emoji} {c.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggle(c.id); }}
              className="hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          {unselected.length === 0 && selected.length > 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">All your circles selected</p>
          )}
          {unselected.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => { toggle(c.id); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left transition-colors"
            >
              <span>{c.emoji}</span>
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground text-xs ml-auto">{c.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
