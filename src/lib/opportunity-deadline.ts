import { format } from "date-fns";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeOpportunityDeadline(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (ISO_DATE_RE.test(raw)) return raw;
  if (!/\d{4}/.test(raw)) return undefined;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return format(parsed, "yyyy-MM-dd");
}

export function formatOpportunityDeadline(value?: string | null) {
  const iso = normalizeOpportunityDeadline(value);
  if (!iso) return "";
  return format(new Date(`${iso}T00:00:00`), "MMM d, yyyy");
}
