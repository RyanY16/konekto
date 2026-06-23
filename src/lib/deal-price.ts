function firstPriceLikeValue(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  const currencyMatch = normalized.match(/(?:¥|￥|\$|€|£)\s*\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s*(?:円|yen|jpy|usd|eur|gbp|dollars?)/i);
  if (currencyMatch) return currencyMatch[0].replace(/\s+/g, "");
  const numberMatch = normalized.match(/\d[\d,]*(?:\.\d+)?/);
  return numberMatch?.[0] ?? normalized;
}

export function normalizeDealPriceNumber(value: string | null | undefined): string {
  if (!value) return "";
  const price = firstPriceLikeValue(value);
  return price.replace(/[^\d.]/g, "");
}

export function formatYenPrice(value: string | null | undefined): string {
  if (!value) return "";
  const numeric = normalizeDealPriceNumber(value);
  return numeric ? `¥${numeric}` : "";
}
