import type { SocialLinks } from "@/data/mock";

type SocialLinksFromFormOptions = {
  classifyLuma?: boolean;
};

export function socialLinksFromForm(form: FormData, options: SocialLinksFromFormOptions = {}): SocialLinks {
  const website = cleanLink(form.get("website"));
  const explicitLuma = cleanLink(form.get("luma"));
  const luma = explicitLuma ?? (options.classifyLuma && isLumaUrl(website) ? website : undefined);

  return {
    website: website && website !== luma ? website : undefined,
    luma,
    tickets: cleanLink(form.get("tickets")),
    instagram: cleanLink(form.get("instagram")),
    line: cleanLink(form.get("line")),
    linkedin: cleanLink(form.get("linkedin")),
    discord: cleanLink(form.get("discord")),
  };
}

export function normalizeSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const links = value as Record<string, unknown>;
  const website = cleanLink(links.website);
  const luma = cleanLink(links.luma) ?? (isLumaUrl(website) ? website : undefined);

  return {
    website: website && website !== luma ? website : undefined,
    luma,
    tickets: cleanLink(links.tickets),
    instagram: cleanLink(links.instagram),
    line: cleanLink(links.line),
    linkedin: cleanLink(links.linkedin),
    discord: cleanLink(links.discord),
  };
}

function cleanLink(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function isLumaUrl(value: unknown): value is string {
  const link = cleanLink(value);
  if (!link) return false;

  try {
    const url = new URL(/^https?:\/\//i.test(link) ? link : `https://${link}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return host === "lu.ma" || host.endsWith(".lu.ma") || host === "luma.com" || host.endsWith(".luma.com");
  } catch {
    return false;
  }
}
