import { CalendarPlus, Globe, Instagram, Linkedin, MessageCircle, Ticket } from "lucide-react";
import type { SocialLinks as SocialLinksType } from "@/data/mock";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.033.058a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

const items = [
  { key: "website",   label: "Website",   icon: Globe },
  { key: "luma",      label: "Luma",      icon: CalendarPlus },
  { key: "tickets",   label: "Tickets",   icon: Ticket },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "discord",   label: "Discord",   icon: DiscordIcon },
  { key: "line",      label: "LINE",      icon: MessageCircle },
  { key: "linkedin",  label: "LinkedIn",  icon: Linkedin },
] as const;

export function SocialLinks({ links }: { links?: SocialLinksType }) {
  const visible = items.filter((item) => links?.[item.key]);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((item) => {
        const Icon = item.icon;
        const raw = links?.[item.key] ?? "";
        const href = toHref(item.key, raw);
        const display = toDisplay(item.key, raw);

        return (
          <a
            key={item.key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {display}
          </a>
        );
      })}
    </div>
  );
}

function toHref(key: keyof SocialLinksType, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "");
  if (key === "luma") {
    if (/^(lu\.ma|luma\.com)\//i.test(value)) return `https://${value}`;
    return `https://lu.ma/${handle}`;
  }
  if (key === "instagram") return `https://instagram.com/${handle}`;
  if (key === "line")      return `https://line.me/R/ti/p/~${handle}`;
  if (key === "discord")   return /^https?:\/\//i.test(value) ? value : `https://discord.gg/${handle}`;
  if (key === "linkedin")  return `https://linkedin.com/in/${handle}`;
  return `https://${value}`;
}

function toDisplay(key: keyof SocialLinksType, value: string): string {
  if (key === "website") {
    try {
      return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.replace(/^www\./, "");
    } catch {
      return "Website";
    }
  }
  if (key === "luma") return "Luma";
  if (key === "tickets") return "Tickets";
  if (key === "discord") return "Discord";
  if (key === "instagram") {
    if (/^https?:\/\//i.test(value)) {
      const match = value.match(/instagram\.com\/([^/?#]+)/i);
      return match ? `@${match[1]}` : "Instagram";
    }
    return `@${value.replace(/^@/, "")}`;
  }
  if (key === "line") {
    if (/^https?:\/\//i.test(value)) {
      const match = value.match(/line\.me\/.*\/~?([^/?#]+)/i);
      return match ? `@${match[1]}` : "LINE";
    }
    return `@${value.replace(/^@/, "")}`;
  }
  if (key === "linkedin") {
    if (/^https?:\/\//i.test(value)) {
      const match = value.match(/linkedin\.com\/(?:in|company)\/([^/?#]+)/i);
      return match ? match[1] : "LinkedIn";
    }
    return value.replace(/^@/, "");
  }
  return value;
}
