"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "People & Social",
    emojis: ["👥", "🤝", "👫", "👨‍👩‍👧‍👦", "🧑‍🤝‍🧑", "🫂", "🙌", "👋", "✊", "💪", "🧑‍🎓", "👩‍💼", "🧑‍💻", "👨‍🔬", "🎓"],
  },
  {
    label: "Activities",
    emojis: ["⚽", "🏀", "🎾", "🏊", "🚴", "🧗", "🎮", "🎲", "♟️", "🎯", "🏋️", "🤸", "🎭", "🎨", "🎬"],
  },
  {
    label: "Arts & Culture",
    emojis: ["🎵", "🎸", "🎹", "🎺", "🥁", "🎤", "📸", "🖼️", "✏️", "📚", "📖", "🎪", "🎠", "🎡", "🌸"],
  },
  {
    label: "Tech & Science",
    emojis: ["💻", "🔬", "🔭", "🤖", "⚡", "🛸", "🧬", "🧪", "📡", "🔧", "💡", "🚀", "🛰️", "🧮", "📱"],
  },
  {
    label: "Food & Drink",
    emojis: ["🍕", "🍣", "🍜", "🧋", "☕", "🍺", "🥂", "🍰", "🍱", "🥗", "🍛", "🍙", "🥟", "🍡", "🎂"],
  },
  {
    label: "Nature & Travel",
    emojis: ["🌍", "🗾", "🗻", "🌊", "🌿", "🌺", "🦋", "🐾", "🏔️", "🏖️", "🌅", "🌌", "🌳", "🦊", "🐬"],
  },
  {
    label: "Objects & Symbols",
    emojis: ["⭐", "🔥", "💎", "🏆", "🎖️", "🎗️", "💰", "📣", "🔑", "🌈", "❤️", "💜", "🧡", "💛", "💚"],
  },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allEmojis = EMOJI_GROUPS.flatMap((g) => g.emojis);
  const filtered = search.trim()
    ? allEmojis.filter((e) => e.includes(search.trim()))
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-10 w-10 text-xl rounded-md border border-input bg-background hover:bg-accent transition-colors flex items-center justify-center shrink-0"
          aria-label="Pick emoji"
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <Input
          placeholder="Search emoji…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
          autoFocus
        />
        <div className="max-h-56 overflow-y-auto space-y-2">
          {filtered ? (
            <div className="flex flex-wrap gap-0.5">
              {filtered.length > 0
                ? filtered.map((e) => <EmojiBtn key={e} emoji={e} onClick={() => { onChange(e); setOpen(false); setSearch(""); }} />)
                : <p className="text-xs text-muted-foreground py-2">No results</p>
              }
            </div>
          ) : (
            EMOJI_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{group.label}</p>
                <div className="flex flex-wrap gap-0.5">
                  {group.emojis.map((e) => (
                    <EmojiBtn key={e} emoji={e} onClick={() => { onChange(e); setOpen(false); setSearch(""); }} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EmojiBtn({ emoji, onClick }: { emoji: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 w-8 text-lg rounded hover:bg-accent transition-colors flex items-center justify-center"
    >
      {emoji}
    </button>
  );
}
