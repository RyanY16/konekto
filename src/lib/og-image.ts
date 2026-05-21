const cache = new Map<string, string | null>();

export async function fetchOgImage(url: string): Promise<string | null> {
  if (cache.has(url)) return cache.get(url)!;
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=false&video=false`);
    if (!res.ok) { cache.set(url, null); return null; }
    const json = await res.json();
    const img = json?.data?.image?.url ?? null;
    cache.set(url, img);
    return img;
  } catch {
    cache.set(url, null);
    return null;
  }
}
