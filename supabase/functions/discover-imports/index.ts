const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

type Source = {
  id: string;
  name: string;
  type: "event" | "circle" | "deal" | "mixed";
  url: string;
  cadence: "manual" | "daily" | "weekly";
};

const EVENT_CATEGORIES = ["Social", "Career", "Hackathon", "Workshop", "Casual", "Travel"] as const;
const IMPORT_TAGS = [
  "Computer Science", "Data Science and AI", "Cybersecurity", "Robotics and Hardware", "Hackathons",
  "Consulting", "Finance and Economics", "Startups", "Marketing", "Content Creation", "Career and Networking",
  "Learn English", "Learn Japanese", "Cultural Exchange", "Language Exchange",
  "Fitness and Training", "Team Sports", "Martial Arts", "Water Sports", "Winter Sports", "Outdoors and Adventure",
  "Anime and Manga", "Cosplay", "Movies", "Literature and Writing", "Theatre and Performance", "Dance", "Music",
  "Photography and Videography", "Japanese Culture", "Visual Arts and Design",
  "Video Games", "eSports", "Rhythm Games", "Vtubers", "Board Games", "Trading Card Games",
  "Volunteering", "Activism", "Community Events", "Sustainability", "LGBTQ+", "Religion",
  "Science", "Engineering", "Social Sciences", "Medicine", "Law and Politics", "Education",
  "Cooking", "Fashion", "Travel", "Beauty", "Cars", "Food and Drink", "Karaoke", "Café",
] as const;
const LANGUAGES = [
  "Japanese", "English", "Mandarin Chinese", "Korean", "Spanish", "French", "German", "Portuguese", "Italian",
  "Russian", "Arabic", "Hindi", "Bengali", "Turkish", "Vietnamese", "Thai", "Indonesian", "Malay", "Dutch",
  "Polish", "Swedish", "Norwegian", "Danish", "Finnish", "Greek", "Romanian", "Czech", "Hungarian", "Ukrainian",
  "Tagalog", "Cantonese", "Taiwanese Mandarin", "Swahili", "Other",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!supabaseUrl || !serviceKey || !openaiKey) {
    return json({ error: "Discovery is not configured. Missing Supabase service role or OpenAI key." }, 500);
  }

  const cronSecret = Deno.env.get("DISCOVERY_CRON_SECRET");
  const isCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  if (!isCron) {
    const ok = await verifyAdmin(req, supabaseUrl, serviceKey);
    if (!ok) return json({ error: "Admin access required" }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === "manual" ? "manual" : "scheduled";
  const now = new Date().toISOString();

  const sourcesRes = await fetch(`${supabaseUrl}/rest/v1/import_sources?enabled=eq.true&select=*`, {
    headers: restHeaders(serviceKey),
  });
  if (!sourcesRes.ok) return json({ error: await sourcesRes.text() }, 500);
  const allSources = await sourcesRes.json() as Source[];
  const sources = allSources.filter((source) => mode === "manual" || source.cadence === "daily");

  let inserted = 0;
  let skipped = 0;
  let repeated = 0;
  const errors: string[] = [];

  for (const source of sources) {
    try {
      const candidates = await discoverCandidatesForSource(openaiKey, source);

      for (const candidate of candidates) {
        const rawItemUrl = candidate.itemUrl || candidate.url || "";
        const itemUrl = normalizeUrl(rawItemUrl || source.url, source.url);
        const type = normalizeType(candidate.type, source.type);
        if (!itemUrl || !type || !candidate.title) {
          skipped++;
          continue;
        }

        const normalizedPayload = normalizePayload(type, candidate, itemUrl);
        const duplicateKey = buildDuplicateKey(type, itemUrl, source.url, candidate.title, !rawItemUrl);
        const row = {
          id: `candidate-${crypto.randomUUID()}`,
          source_id: source.id,
          source_name: source.name,
          source_url: source.url,
          item_url: itemUrl,
          type,
          title: normalizedPayload.title ?? normalizedPayload.name ?? normalizedPayload.brand ?? candidate.title,
          description: normalizedPayload.description ?? candidate.description ?? "",
          normalized_payload: normalizedPayload,
          raw_payload: candidate,
          confidence: clamp(Number(candidate.confidence ?? 0.6), 0, 1),
          duplicate_key: duplicateKey,
          status: "new",
          updated_at: now,
        };

        const upsertRes = await fetch(`${supabaseUrl}/rest/v1/import_candidates?on_conflict=duplicate_key`, {
          method: "POST",
          headers: { ...restHeaders(serviceKey), Prefer: "resolution=ignore-duplicates,return=representation" },
          body: JSON.stringify(row),
        });
        if (!upsertRes.ok) {
          errors.push(`${source.name}: ${await upsertRes.text()}`);
        } else {
          const rows = await upsertRes.json().catch(() => []);
          if (Array.isArray(rows) && rows.length > 0) {
            inserted++;
          } else {
            repeated++;
            await touchDuplicateCandidate(supabaseUrl, serviceKey, duplicateKey, now);
          }
        }
      }

      await updateSourceStatus(supabaseUrl, serviceKey, source.id, {
        last_scraped_at: now,
        last_status: `ok: ${candidates.length} candidate(s)`,
        error_count: 0,
        updated_at: now,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${source.name}: ${message}`);
      await updateSourceStatus(supabaseUrl, serviceKey, source.id, {
        last_scraped_at: now,
        last_status: message,
        error_count: 1,
        updated_at: now,
      }, true);
    }
  }

  return json({ inserted, skipped, repeated, sources: sources.length, errors });
});

async function discoverCandidatesForSource(openaiKey: string, source: Source): Promise<any[]> {
  const pageText = await fetchSourceText(source.url);
  if (!pageText) throw new Error("No readable content found");

  const sourceIsLuma = isLumaUrl(source.url);
  const sourceRawPage = sourceIsLuma ? await fetchRawPage(source.url).catch(() => "") : "";
  if (sourceIsLuma && isLumaEventPage(source.url, pageText, sourceRawPage)) {
    const sourceType = source.type === "mixed" ? "event" : source.type;
    return extractDetailCandidates(openaiKey, source, source.url, pageText, true, sourceType);
  }

  let detailUrls = extractDetailUrls(source.url, pageText);
  if (sourceIsLuma) {
    const rawUrls = extractDetailUrls(source.url, sourceRawPage);
    detailUrls = [...new Set([...rawUrls, ...detailUrls])];
  }
  if (detailUrls.length === 0) return extractCandidates(openaiKey, source, pageText);

  const candidates: any[] = [];
  const sourceType = source.type === "mixed" && sourceIsLuma ? "event" : source.type;
  for (const detailUrl of detailUrls.slice(0, 20)) {
    try {
      const isLumaDetail = isLumaUrl(detailUrl);
      const detailText = await fetchSourceText(detailUrl);
      if (!detailText) continue;
      if (isLumaDetail) {
        const rawDetail = await fetchRawPage(detailUrl).catch(() => "");
        if (!isLumaEventPage(detailUrl, detailText, rawDetail)) continue;
      }
      candidates.push(...await extractDetailCandidates(openaiKey, source, detailUrl, detailText, isLumaDetail, sourceType));
    } catch (err) {
      console.warn(`Could not extract detail page ${detailUrl}:`, err);
    }
  }
  return candidates;
}

async function extractDetailCandidates(
  openaiKey: string,
  source: Source,
  detailUrl: string,
  detailText: string,
  isLumaDetail: boolean,
  sourceType: Source["type"],
): Promise<any[]> {
  const detailSource = { ...source, type: sourceType, url: detailUrl } as Source;
  const extracted = await extractCandidates(openaiKey, detailSource, detailText);
  return extracted.slice(0, isLumaDetail ? 1 : 3).map((candidate) => {
    const itemUrl = isLumaDetail ? detailUrl : (candidate.itemUrl || candidate.url || detailUrl);
    return {
      ...candidate,
      type: normalizeType(candidate.type, sourceType) ?? sourceType,
      itemUrl,
      url: itemUrl,
      luma: isLumaDetail ? detailUrl : candidate.luma,
      website: isLumaDetail ? undefined : (candidate.website || detailUrl),
      tickets: isLumaDetail ? undefined : candidate.tickets,
    };
  });
}

function restHeaders(serviceKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${serviceKey}`,
    "apikey": serviceKey,
  };
}

async function verifyAdmin(req: Request, supabaseUrl: string, serviceKey: string): Promise<boolean> {
  const auth = req.headers.get("authorization");
  if (!auth) return false;

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      "Authorization": auth,
      "apikey": serviceKey,
    },
  });
  if (!userRes.ok) return false;
  const user = await userRes.json();
  if (!user?.id) return false;

  const profileRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}&select=role`, {
    headers: restHeaders(serviceKey),
  });
  if (!profileRes.ok) return false;
  const rows = await profileRes.json();
  const profile = Array.isArray(rows) ? rows[0] : rows;
  return profile?.role === "admin";
}

async function fetchSourceText(url: string): Promise<string> {
  const normalized = normalizeUrl(url, url);
  if (!normalized) return "";
  const jinaUrl = `https://r.jina.ai/${normalized}`;
  const res = await fetch(jinaUrl, {
    headers: { "Accept": "text/plain", "X-Return-Format": "text" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return (await res.text()).slice(0, 16_000);
}

async function fetchRawPage(url: string): Promise<string> {
  const normalized = normalizeUrl(url, url);
  if (!normalized) return "";
  const res = await fetch(normalized, {
    headers: {
      "Accept": "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 KonektoDiscoveryBot/1.0",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return "";
  return (await res.text()).slice(0, 80_000);
}

function extractDetailUrls(sourceUrl: string, pageText: string): string[] {
  if (!isLumaUrl(sourceUrl)) return [];

  const source = normalizeUrl(sourceUrl, sourceUrl);
  if (!source) return [];
  const sourcePath = new URL(source).pathname.replace(/\/$/, "");
  const urls = new Set<string>();

  const add = (value: string) => {
    const url = normalizeUrl(value.replace(/\\u002F/g, "/").replace(/&amp;/g, "&"), source);
    if (!url || !isLumaUrl(url)) return;

    const parsed = new URL(url);
    parsed.hash = "";
    const path = parsed.pathname.replace(/\/$/, "");
    if (!path || path === "/" || path === sourcePath) return;
    if (isLumaNonEventPath(path)) return;
    urls.add(parsed.toString());
  };

  for (const match of pageText.matchAll(/https?:\/\/(?:www\.)?(?:lu\.ma|luma\.com)\/[^\s)"'<>\\]+/gi)) {
    add(match[0]);
  }
  for (const match of pageText.matchAll(/https?:\\u002F\\u002F(?:www\.)?(?:lu\.ma|luma\.com)\\u002F[^"'<>\s]+/gi)) {
    add(match[0]);
  }
  for (const match of pageText.matchAll(/\]\((\/[^)\s]+)\)/g)) {
    add(match[1]);
  }
  for (const match of pageText.matchAll(/href=["'](\/[^"']+)["']/g)) {
    add(match[1]);
  }

  return [...urls].slice(0, 30);
}

function isLumaNonEventPath(path: string): boolean {
  const first = path.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
  if (first.startsWith("@")) return true;
  return [
    "about",
    "auth",
    "calendar",
    "c",
    "club",
    "community",
    "company",
    "create",
    "discover",
    "explore",
    "home",
    "host",
    "hosts",
    "login",
    "org",
    "organization",
    "profile",
    "pricing",
    "s",
    "search",
    "signin",
    "signup",
    "space",
    "tokyo",
    "u",
    "user",
    "venue",
  ].includes(first);
}

function isLumaEventPage(url: string, pageText: string, rawPage: string): boolean {
  const path = new URL(url).pathname.replace(/\/$/, "");
  if (isLumaNonEventPath(path)) return false;

  const text = pageText.toLowerCase();
  const looksLikeCalendar =
    text.includes("upcoming events")
    || text.includes("past events")
    || text.includes("followers")
    || text.includes("follow this calendar")
    || text.includes("calendar ·")
    || text.includes("hosted events")
    || text.includes("events hosted by");
  if (looksLikeCalendar) return false;

  if (hasMatchingJsonLdEvent(rawPage, url)) return true;

  const hasEventSchema = /"@type"\s*:\s*"Event"/i.test(rawPage);
  const hasEventRecord = /"event_api_id"\s*:|"api_id"\s*:\s*"evt-|data-event-api-id=/i.test(rawPage);
  const hasEventDetails =
    /(^|\n)\s*(date and time|location|about event|registration|register|approval required|add to calendar)\b/i.test(pageText);

  return hasEventDetails && (hasEventSchema || hasEventRecord);
}

function hasMatchingJsonLdEvent(rawPage: string, url: string): boolean {
  const current = normalizeComparablePath(url);
  for (const match of rawPage.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1].trim()));
      if (jsonLdContainsMatchingEvent(parsed, current)) return true;
    } catch {
      // Ignore non-JSON script payloads.
    }
  }
  return false;
}

function jsonLdContainsMatchingEvent(value: unknown, currentPath: string): boolean {
  if (Array.isArray(value)) return value.some((item) => jsonLdContainsMatchingEvent(item, currentPath));
  if (!value || typeof value !== "object") return false;

  const object = value as Record<string, unknown>;
  const type = object["@type"];
  const isEvent = Array.isArray(type) ? type.includes("Event") : type === "Event";
  if (isEvent) {
    const eventUrl = typeof object.url === "string" ? object.url : typeof object["@id"] === "string" ? object["@id"] : "";
    return !!eventUrl && normalizeComparablePath(eventUrl) === currentPath;
  }

  return Object.values(object).some((child) => jsonLdContainsMatchingEvent(child, currentPath));
}

function normalizeComparablePath(value: string): string {
  try {
    const parsed = new URL(value);
    return `${parsed.hostname.toLowerCase().replace(/^www\./, "").replace(/^luma\.com$/, "lu.ma")}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return value.toLowerCase().replace(/\/$/, "");
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function extractCandidates(openaiKey: string, source: Source, pageText: string): Promise<any[]> {
  const prompt =
    `Source: ${source.name}\nURL: ${source.url}\nPreferred type: ${source.type}\n\n` +
    `Readable page content:\n---\n${pageText}\n---\n\n` +
    `Extract up to 15 promising student-relevant events, circles/clubs, or student deals from this page. ` +
    `Return ONLY JSON in this shape: {"candidates":[...]}. Each candidate should include: ` +
    `type ("event"|"circle"|"deal"), title, description, itemUrl, confidence 0-1, and relevant fields. ` +
    `Write event title, description, location, cost, and howToJoin bilingually as "English / 日本語" when both can be inferred; keep enum values in English. ` +
    `For events include category, date, location, startDate ISO if known, cost, primaryLanguage, online, howToJoin, luma/website, and tags. ` +
    `Event category must be exactly one of: ${EVENT_CATEGORIES.join(", ")}. ` +
    `Event primaryLanguage must be exactly one of: ${LANGUAGES.join(", ")}; use "Japanese" for Japanese-only pages, "English" for English-only pages, and the main spoken/listing language when mixed. ` +
    `Event tags must use exact strings from this list only, max 4: ${IMPORT_TAGS.map((tag) => `"${tag}"`).join(", ")}. ` +
    `For cost, extract the actual price/free status when present. If the page only says sold out/full, use "Sold out / 売り切れ" and mention sold out in howToJoin. ` +
    `For date, provide both a human date string and startDate as ISO 8601 with timezone whenever possible. ` +
    `For Luma event detail pages, use the source URL as the event itemUrl/luma URL and do not include organizer, calendar, or group links as website. ` +
    `For circles include name, category, university, tags, recruiting, website/instagram. ` +
    `For deals include brand, title, category, originalPrice, newPrice, studentOnly, mode, website. ` +
    `Skip vague navigation links, generic pages, and anything not relevant to students in Japan.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You extract concise structured import candidates for an admin review queue. Return valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`OpenAI failed (${res.status})`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{\"candidates\":[]}");
  return Array.isArray(parsed.candidates) ? parsed.candidates : [];
}

function normalizePayload(type: "event" | "circle" | "deal", candidate: any, itemUrl: string): Record<string, unknown> {
  if (type === "event") {
    const category = normalizeEventCategory(candidate.category, [candidate.title, candidate.description, candidate.location, candidate.tags].join(" "));
    const cost = normalizeCost(candidate.cost, candidate.description);
    const howToJoin = withSoldOutNote(candidate.howToJoin, candidate.cost, candidate.description);
    return {
      title: candidate.title ?? "Untitled Event",
      description: candidate.description ?? "",
      category,
      date: candidate.date ?? "TBD",
      location: candidate.location ?? "TBD",
      emoji: candidate.emoji ?? eventEmoji(category),
      tags: normalizeTags(candidate.tags),
      cost,
      primaryLanguage: normalizeLanguage(candidate.primaryLanguage, [candidate.title, candidate.description, candidate.location].join(" ")),
      online: candidate.online ?? false,
      startDate: candidate.startDate ?? undefined,
      howToJoin,
      socialLinks: {
        luma: candidate.luma ?? (isLumaUrl(itemUrl) ? itemUrl : undefined),
        website: candidate.website ?? (!isLumaUrl(itemUrl) ? itemUrl : undefined),
        tickets: candidate.tickets ?? undefined,
      },
    };
  }
  if (type === "circle") {
    return {
      name: candidate.name ?? candidate.title ?? "Untitled Circle",
      description: candidate.description ?? "",
      category: candidate.category ?? "Community",
      university: candidate.university ?? undefined,
      primaryLanguage: candidate.primaryLanguage ?? undefined,
      englishFriendly: candidate.englishFriendly ?? false,
      recruiting: candidate.recruiting ?? false,
      tags: Array.isArray(candidate.tags) ? candidate.tags : [],
      emoji: candidate.emoji ?? "👥",
      socialLinks: {
        website: candidate.website ?? itemUrl,
        instagram: candidate.instagram ?? undefined,
      },
    };
  }
  return {
    brand: candidate.brand ?? "Unknown",
    title: candidate.title ?? "Untitled Deal",
    description: candidate.description ?? "",
    category: candidate.category ?? "Other",
    originalPrice: candidate.originalPrice ?? undefined,
    newPrice: candidate.newPrice ?? undefined,
    studentOnly: candidate.studentOnly ?? true,
    mode: candidate.mode ?? "Online",
    socialLinks: { website: candidate.website ?? itemUrl },
  };
}

function normalizeEventCategory(value: unknown, text = ""): string {
  if (typeof value === "string" && EVENT_CATEGORIES.includes(value as any)) return value;
  const lower = `${typeof value === "string" ? value : ""} ${text}`.toLowerCase();
  if (/(hackathon|hack|coding|developer|dev|engineer|ai|artificial intelligence|tech|technology|software|web3|crypto|game jam)/.test(lower)) return "Hackathon";
  if (/(career|job|intern|recruit|network|founder|startup|business|finance|consult|vc|venture|pitch)/.test(lower)) return "Career";
  if (/(workshop|seminar|talk|lecture|class|study|learn|session|lesson)/.test(lower)) return "Workshop";
  if (/(travel|trip|tour|hike|hiking|outdoor|excursion)/.test(lower)) return "Travel";
  if (/(casual|picnic|party|social|mixer|meetup|food|drink|culture|交流)/.test(lower)) return "Social";
  return "Social";
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized = new Map(IMPORT_TAGS.map((tag) => [normalizeText(tag), tag]));
  return [...new Set(value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => normalized.get(normalizeText(tag)))
    .filter((tag): tag is string => Boolean(tag)))]
    .slice(0, 4);
}

function normalizeLanguage(value: unknown, text = ""): string | undefined {
  if (typeof value === "string") {
    const exact = LANGUAGES.find((language) => language.toLowerCase() === value.trim().toLowerCase());
    if (exact) return exact;
    if (/日本|japanese|日本語/i.test(value)) return "Japanese";
    if (/英語|english/i.test(value)) return "English";
  }
  if (/日本語|開催|参加|会場|無料|受付/.test(text) && !/[A-Za-z]{20,}/.test(text)) return "Japanese";
  if (/[A-Za-z]{20,}/.test(text) && !/[ぁ-んァ-ン一-龯]/.test(text)) return "English";
  return undefined;
}

function normalizeCost(cost: unknown, text: unknown): string | undefined {
  const raw = [cost, text].filter((value): value is string => typeof value === "string").join(" ");
  if (!raw.trim()) return undefined;
  const price = raw.match(/(?:¥|￥)\s?[\d,]+(?:\s?[-–~]\s?(?:¥|￥)?\s?[\d,]+)?|(?:free|無料)/i)?.[0];
  if (price) return price.replace(/\s+/g, " ").trim();
  if (/(sold\s*out|full|満席|売り切れ|完売|受付終了)/i.test(raw)) return "Sold out / 売り切れ";
  return typeof cost === "string" && cost.trim() ? cost.trim() : undefined;
}

function withSoldOutNote(howToJoin: unknown, cost: unknown, description: unknown): string | undefined {
  const current = typeof howToJoin === "string" && howToJoin.trim() ? howToJoin.trim() : "";
  const raw = [cost, description, howToJoin].filter((value): value is string => typeof value === "string").join(" ");
  if (!/(sold\s*out|full|満席|売り切れ|完売|受付終了)/i.test(raw)) return current || undefined;
  if (/sold\s*out|売り切れ|完売|満席|受付終了/i.test(current)) return current;
  return current ? `${current} Sold out / 売り切れ.` : "Sold out / 売り切れ.";
}

function eventEmoji(category: string): string {
  return {
    Social: "🥂",
    Career: "💼",
    Hackathon: "⚡",
    Workshop: "🛠️",
    Casual: "🌸",
    Travel: "✈️",
  }[category] ?? "📅";
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function updateSourceStatus(supabaseUrl: string, serviceKey: string, id: string, patch: Record<string, unknown>, increment = false) {
  if (increment) {
    const sourceRes = await fetch(`${supabaseUrl}/rest/v1/import_sources?id=eq.${id}&select=error_count`, {
      headers: restHeaders(serviceKey),
    });
    const rows = sourceRes.ok ? await sourceRes.json() : [];
    patch.error_count = Number(rows?.[0]?.error_count ?? 0) + 1;
  }
  await fetch(`${supabaseUrl}/rest/v1/import_sources?id=eq.${id}`, {
    method: "PATCH",
    headers: restHeaders(serviceKey),
    body: JSON.stringify(patch),
  });
}

async function touchDuplicateCandidate(supabaseUrl: string, serviceKey: string, duplicateKey: string, now: string) {
  const res = await fetch(`${supabaseUrl}/rest/v1/import_candidates?duplicate_key=eq.${encodeURIComponent(duplicateKey)}`, {
    method: "PATCH",
    headers: restHeaders(serviceKey),
    body: JSON.stringify({ updated_at: now }),
  });
  if (!res.ok) console.warn("Could not touch duplicate candidate", await res.text());
}

function normalizeType(value: unknown, sourceType: Source["type"]): "event" | "circle" | "deal" | null {
  if (value === "event" || value === "circle" || value === "deal") return value;
  if (sourceType === "event" || sourceType === "circle" || sourceType === "deal") return sourceType;
  return null;
}

function buildDuplicateKey(type: "event" | "circle" | "deal", itemUrl: string, sourceUrl: string, title: string, usedSourceFallback: boolean): string {
  const normalizedItemUrl = itemUrl.toLowerCase().replace(/\/$/, "");
  const normalizedSourceUrl = normalizeUrl(sourceUrl, sourceUrl)?.toLowerCase().replace(/\/$/, "");
  if (usedSourceFallback || normalizedItemUrl === normalizedSourceUrl) {
    return `${type}:${normalizedItemUrl}:title:${slugKey(title)}`;
  }
  return `${type}:${normalizedItemUrl}`;
}

function slugKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "untitled";
}

function normalizeUrl(value: unknown, base: string): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : value, base).toString();
  } catch {
    return null;
  }
}

function isLumaUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    return host === "lu.ma" || host.endsWith(".lu.ma") || host === "luma.com" || host.endsWith(".luma.com");
  } catch {
    return false;
  }
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}
