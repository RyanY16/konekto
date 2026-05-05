import { Link } from "@tanstack/react-router";

interface Props {
  username: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export function OwnerBadge({ username, displayName, avatarUrl }: Props) {
  const label = displayName ?? username;
  const initial = label.slice(0, 1).toUpperCase();

  return (
    <Link
      to="/users/$username"
      params={{ username }}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors shrink-0"
    >
      <span className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 font-semibold text-primary text-[10px] overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt={label} className="w-full h-full object-cover rounded-full" />
        ) : (
          initial
        )}
      </span>
      <span>{label}</span>
    </Link>
  );
}
