import type { SocialLinks } from "@/data/mock";

export function socialLinksFromForm(form: FormData): SocialLinks {
  return {
    website: cleanLink(form.get("website")),
    luma: cleanLink(form.get("luma")),
    tickets: cleanLink(form.get("tickets")),
    instagram: cleanLink(form.get("instagram")),
    line: cleanLink(form.get("line")),
    linkedin: cleanLink(form.get("linkedin")),
  };
}

export function normalizeSocialLinks(value: unknown): SocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const links = value as Record<string, unknown>;
  return {
    website: cleanLink(links.website),
    luma: cleanLink(links.luma),
    tickets: cleanLink(links.tickets),
    instagram: cleanLink(links.instagram),
    line: cleanLink(links.line),
    linkedin: cleanLink(links.linkedin),
  };
}

function cleanLink(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
