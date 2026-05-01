import { Bookmark } from "lucide-react";
import { useState } from "react";

export function SaveButton({ initial = false }: { initial?: boolean }) {
  const [saved, setSaved] = useState(initial);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved((s) => !s);
      }}
      aria-label={saved ? "Remove bookmark" : "Save"}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-full border transition-colors ${
        saved
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}
