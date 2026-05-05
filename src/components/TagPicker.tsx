"use client";

import React from "react";
import { INTEREST_GROUPS } from "@/data/profile-options";

type TagGroup = { label: string; items: readonly string[] };

const GROUP_COLOURS: Record<string, { idle: string; active: string }> = {
  "Tech":                 { idle: "border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950",      active: "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500" },
  "Business & Finance":   { idle: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950", active: "bg-amber-500 border-amber-500 text-white" },
  "Business & Career":    { idle: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950", active: "bg-amber-500 border-amber-500 text-white" },
  "Health & Wellness":    { idle: "border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950",       active: "bg-teal-600 border-teal-600 text-white dark:bg-teal-500 dark:border-teal-500" },
  "Outdoors & Health":    { idle: "border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950",       active: "bg-teal-600 border-teal-600 text-white dark:bg-teal-500 dark:border-teal-500" },
  "Arts & Culture":       { idle: "border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950", active: "bg-purple-600 border-purple-600 text-white dark:bg-purple-500 dark:border-purple-500" },
  "Arts & Creative":      { idle: "border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950", active: "bg-purple-600 border-purple-600 text-white dark:bg-purple-500 dark:border-purple-500" },
  "Social & Languages":   { idle: "border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950",  active: "bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500" },
  "Social & Community":   { idle: "border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950",  active: "bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500" },
  "Research & Academia":  { idle: "border-cyan-200 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-950",        active: "bg-cyan-600 border-cyan-600 text-white dark:bg-cyan-500 dark:border-cyan-500" },
  "Events":               { idle: "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950", active: "bg-orange-500 border-orange-500 text-white" },
  "Lifestyle":            { idle: "border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-950",        active: "bg-pink-500 border-pink-500 text-white" },
};

const DEFAULT_COLOURS = {
  idle: "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
  active: "bg-primary border-primary text-primary-foreground",
};

export function TagPicker({
  value,
  onChange,
  groups,
}: {
  value?: string[];
  onChange: (tags: string[]) => void;
  groups?: readonly TagGroup[];
}) {
  const resolvedGroups = groups ?? INTEREST_GROUPS;
  const selected = new Set(value ?? []);

  function toggle(tag: string) {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange(Array.from(next));
  }

  return (
    <div className="space-y-3">
      {resolvedGroups.map((group) => {
        const colours = GROUP_COLOURS[group.label] ?? DEFAULT_COLOURS;
        return (
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
                    className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${
                      isSelected ? colours.active : colours.idle
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TagPicker;
