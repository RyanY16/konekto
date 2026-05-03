import { Globe, Instagram, Linkedin, MessageCircle } from "lucide-react";
import type { SocialLinks as SocialLinksType } from "@/data/mock";

const items = [
  { key: "website",   label: "Website",   icon: Globe },
  { key: "instagram", label: "Instagram", icon: Instagram },
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
  if (key === "instagram") return `https://instagram.com/${handle}`;
  if (key === "line")      return `https://line.me/R/ti/p/~${handle}`;
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
  if (key === "instagram" || key === "line") {
    const handle = value.replace(/^@/, "");
    return `@${handle}`;
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
