import { Globe, Instagram, Linkedin, MessageCircle } from "lucide-react";
import type { SocialLinks as SocialLinksType } from "@/data/mock";

const items = [
  { key: "website", label: "Website", icon: Globe },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "line", label: "LINE", icon: MessageCircle },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
] as const;

export function SocialLinks({ links }: { links?: SocialLinksType }) {
  const visible = items.filter((item) => links?.[item.key]);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((item) => {
        const Icon = item.icon;
        const href = toHref(item.key, links?.[item.key] ?? "");

        return (
          <a
            key={item.key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </a>
        );
      })}
    </div>
  );
}

function toHref(key: keyof SocialLinksType, value: string) {
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (key === "instagram") return `https://instagram.com/${value.replace(/^@/, "")}`;
  if (key === "linkedin") return `https://linkedin.com/in/${value.replace(/^@/, "")}`;
  return `https://${value}`;
}
