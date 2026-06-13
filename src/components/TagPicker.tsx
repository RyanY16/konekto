"use client";

import React from "react";
import { INTEREST_GROUPS } from "@/data/profile-options";
import { tagGroupLabel, tagLabel } from "@/data/tags";
import { tagClass } from "@/lib/tag-class";
import { useTranslation } from "react-i18next";
type TagGroup = { label: string; items: readonly string[] };

export function TagPicker({
  value,
  onChange,
  groups,
}: {
  value?: string[];
  onChange: (tags: string[]) => void;
  groups?: readonly TagGroup[];
}) {
  const { i18n } = useTranslation();
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
        return (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{tagGroupLabel(group.label, i18n.language)}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((tag) => {
                const isSelected = selected.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggle(tag)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all ${tagClass(tag)} ${
                      isSelected
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : "opacity-75 hover:opacity-100"
                    }`}
                  >
                    {tagLabel(tag, i18n.language)}
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
