import { Bookmark } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/components/AuthProvider";
import { useSaves } from "@/lib/saves";

export function SaveButton({ itemId, itemType }: { itemId?: string; itemType?: "circle" | "event" | "deal" | "opportunity" }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isSaved, toggle } = useSaves(user?.id);
  const [localSaved, setLocalSaved] = useState(false);

  const connected = Boolean(itemId && itemType);
  const saved = user && connected ? isSaved(itemType!, itemId!) : localSaved;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
          navigate({ to: "/login" });
          return;
        }
        if (connected) toggle(itemType!, itemId!);
        else setLocalSaved((s) => !s);
      }}
      disabled={loading}
      aria-label={saved ? "Remove bookmark" : "Save"}
      title={user ? undefined : "Log in to save"}
      className={`relative z-10 h-8 w-8 inline-flex items-center justify-center rounded-full border transition-colors ${
        saved
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted disabled:opacity-60"
      }`}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}
