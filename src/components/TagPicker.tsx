"use client";

import React from "react";
import { INTEREST_GROUPS } from "@/data/profile-options";
type TagGroup = { label: string; items: readonly string[] };

type ColourPair = { idle: string; active: string };

const GROUP_COLOURS: Record<string, ColourPair> = {
  "Technology":                        { idle: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",         active: "bg-blue-600 border-blue-600 text-white dark:bg-blue-500 dark:border-blue-500" },
  "Business / Career":                 { idle: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700",   active: "bg-amber-500 border-amber-500 text-white" },
  "International / Cultural Exchange": { idle: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700",         active: "bg-teal-600 border-teal-600 text-white dark:bg-teal-500 dark:border-teal-500" },
  "Sports":                            { idle: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",    active: "bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500" },
  "Arts":                              { idle: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700", active: "bg-purple-600 border-purple-600 text-white dark:bg-purple-500 dark:border-purple-500" },
  "Gaming":                            { idle: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700", active: "bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500" },
  "Community":                         { idle: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700",          active: "bg-rose-600 border-rose-600 text-white dark:bg-rose-500 dark:border-rose-500" },
  "Academic":                          { idle: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300 dark:border-cyan-700",          active: "bg-cyan-600 border-cyan-600 text-white dark:bg-cyan-500 dark:border-cyan-500" },
  "Lifestyle":                         { idle: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/50 dark:text-pink-300 dark:border-pink-700",          active: "bg-pink-500 border-pink-500 text-white" },
};

const DEFAULT_COLOURS: ColourPair = {
  idle: "bg-muted text-muted-foreground border-transparent",
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
                      isSelected ? colours.active : colours.idle + " hover:opacity-80"
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
