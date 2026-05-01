"use client";

import React from "react";
import { INTEREST_GROUPS } from "@/data/profile-options";

export function TagPicker({
  value,
  onChange,
}: {
  value?: string[];
  onChange: (tags: string[]) => void;
}) {
  const selected = new Set(value ?? []);

  function toggle(tag: string) {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange(Array.from(next));
  }

  return (
    <div className="space-y-3">
      {INTEREST_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{group.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((tag) => {
              const isSelected = selected.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default TagPicker;
