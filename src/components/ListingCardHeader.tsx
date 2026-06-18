import type { ReactNode } from "react";

type ListingCardHeaderProps = {
  category: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  action?: ReactNode;
};

export function ListingCardHeader({ category, title, subtitle, badges, action }: ListingCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex min-h-6 flex-wrap items-center gap-1.5">
          <span className="chip chip-primary">{category}</span>
          {badges}
        </div>
        <h3 className="font-semibold leading-snug">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="relative z-10 shrink-0">{action}</div>}
    </div>
  );
}
