const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

const CIRCLE_CATEGORIES = [
  "Technology",
  "Business / Career",
  "International / Cultural Exchange",
  "Sports",
  "Arts",
  "Gaming",
  "Community",
  "Academic",
  "Lifestyle",
];

const EVENT_CATEGORIES = ["Social", "Career", "Hackathon", "Workshop", "Casual", "Travel"];

const LANGUAGES = [
  "Japanese", "English", "Chinese", "Korean", "French", "Spanish",
  "German", "Portuguese", "Arabic", "Hindi", "Vietnamese", "Thai",
  "Indonesian", "Malay", "Italian", "Russian",
];

const TAGS = [
  "Computer Science", "Data Science and AI", "Cybersecurity", "Robotics and Hardware", "Hackathons",
  "Consulting", "Finance and Economics", "Startups", "Marketing", "Content Creation", "Career and Networking",
  "Learn English", "Learn Japanese", "Cultural Exchange", "Language Exchange",
  "Fitness and Training", "Team Sports", "Martial Arts", "Water Sports", "Winter Sports", "Outdoors and Adventure",
  "Anime and Manga", "Cosplay", "Movies", "Literature and Writing", "Theatre and Performance", "Dance", "Music", "Photography and Videography", "Japanese Culture", "Visual Arts and Design",
  "Video Games", "eSports", "Rhythm Games", "Vtubers", "Board Games", "Trading Card Games",
  "Volunteering", "Activism", "Community Events", "Sustainability", "LGBTQ+", "Religion",
  "Science", "Engineering", "Social Sciences", "Medicine", "Law and Politics", "Education",
  "Cooking", "Fashion", "Travel", "Beauty", "Cars", "Food and Drink", "Karaoke", "Café",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // ── API key ─────────────────────────────────────────────────────────────────
  // Currently using OpenAI. To switch to Claude, swap the key + call below.
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) return json({ error: "OPENAI_API_KEY not configured" }, 500);

  // const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  // if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

  const body = await req.json();
  const { url, type = "circle", outputLanguage = "en" } = body;

  // Hard deadline — race the entire handler against a 25s timeout.
  // AbortController doesn't reliably kill Deno fetch calls, so this guarantees
  // the client always gets a response instead of hanging until the client times out.
  const deadline = new Promise<Response>((resolve) =>
    setTimeout(() => resolve(json({ error: "Request took too long — try again or try a different URL." }, 504)), 25_000)
  );

  return Promise.race([handleRequest(req, openaiKey, body, url, type, outputLanguage), deadline]);
});

function languageInstruction(outputLanguage: unknown): string {
  if (outputLanguage === "ja") {
    return (
      "OUTPUT LANGUAGE MODE: Japanese. Write every user-facing free-text field in natural Japanese only. Do not include English translations in those fields. " +
      "Keep app enum fields exactly as requested in English: category, primaryLanguage, tags, mode. " +
      "Keep URLs, ISO dates, numeric prices, and Instagram handles unchanged. "
    );
  }
  if (outputLanguage === "both") {
    return (
      "OUTPUT LANGUAGE MODE: Bilingual English + Japanese. CRITICAL: every user-facing free-text field MUST contain BOTH English and Japanese text. Returning only English is wrong. " +
      "For short fields, use 'English / 日本語'. For longer fields, write one English paragraph then one Japanese paragraph on the next line. " +
      "Keep app enum fields exactly as requested in English: category, primaryLanguage, tags, mode. " +
      "Keep URLs, ISO dates, numeric prices, and Instagram handles unchanged. "
    );
  }
  return (
    "OUTPUT LANGUAGE MODE: English. Write user-facing free-text fields in natural English, translating from Japanese or other languages as needed. " +
    "Keep app enum fields exactly as requested in English: category, primaryLanguage, tags, mode. " +
    "Keep URLs, ISO dates, numeric prices, and Instagram handles unchanged. "
  );
}

function languageFieldRules(outputLanguage: unknown): string {
  const textFields =
    "name/title/brand, description, location, cost, recruitingPeriod, membershipFee, howToJoin, university";
  if (outputLanguage === "ja") {
    return (
      `REQUESTED OUTPUT LANGUAGE MODE: Japanese only.\n` +
      `Language output rules:\n` +
      `- For every non-null user-facing text field, write Japanese text only: ${textFields}.\n` +
      `- Translate or localize names/titles/locations when possible. Example: "Tokyo Tech Society" -> "東京工業大学テックソサエティ"; "Free" -> "無料".\n` +
      `- Do not append English in parentheses or after a slash.\n` +
      `- Before returning, verify each non-null user-facing text field contains Japanese text and is not English-only.\n` +
      `- Keep fixed app values in English exactly as listed: category, primaryLanguage, tags, mode.\n` +
      `- Keep URLs, handles, ISO dates, and numeric prices unchanged.\n\n`
    );
  }
  if (outputLanguage === "both") {
    return (
      `REQUESTED OUTPUT LANGUAGE MODE: Bilingual English + Japanese.\n` +
      `Language output rules:\n` +
      `- For every non-null user-facing text field, include BOTH English and Japanese: ${textFields}.\n` +
      `- For short fields, format as "English / 日本語".\n` +
      `- Examples: "Tokyo Tech Society / 東京工業大学テックソサエティ", "Free / 無料", "Online / オンライン".\n` +
      `- For description and howToJoin, write English first, then Japanese on the next line.\n` +
      `- Do not return only English or only Japanese for user-facing text fields.\n` +
      `- Before returning, verify each non-null user-facing text field contains both English text and Japanese text.\n` +
      `- Keep fixed app values in English exactly as listed: category, primaryLanguage, tags, mode.\n` +
      `- Keep URLs, handles, ISO dates, and numeric prices unchanged.\n\n`
    );
  }
  return (
    `REQUESTED OUTPUT LANGUAGE MODE: English only.\n` +
    `Language output rules:\n` +
    `- For every non-null user-facing text field, write English only: ${textFields}.\n` +
    `- Keep fixed app values in English exactly as listed: category, primaryLanguage, tags, mode.\n` +
    `- Keep URLs, handles, ISO dates, and numeric prices unchanged.\n\n`
  );
}

function isLumaUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return host === "lu.ma" || host.endsWith(".lu.ma") || host === "luma.com" || host.endsWith(".luma.com");
  } catch {
    return false;
  }
}

async function handleRequest(req: Request, openaiKey: string, body: unknown, url: string, type: string, outputLanguage: unknown): Promise<Response> {
  try {
    if (!url || typeof url !== "string") return json({ error: "url is required" }, 400);

    const normalised = url.startsWith("http") ? url : `https://${url}`;
    console.log("[smart-fill] fetching URL:", normalised);

    // Instagram/X require login even via Jina — block upfront
    if (/instagram\.com|twitter\.com|x\.com/i.test(normalised)) {
      return json({ error: "Instagram and X/Twitter require login — try pasting the details manually." }, 422);
    }

    // ── Step 1: fetch page content via Jina Reader ──────────────────────────
    // Jina (r.jina.ai) converts any URL to clean text/markdown in 1-3s using their
    // own scraping infrastructure. Much faster than direct fetch, handles JS-rendered
    // pages, and works with most sites that block raw bot requests.
    // Optional: set JINA_API_KEY in edge function secrets for higher rate limits.
    const jinaKey = Deno.env.get("JINA_API_KEY");
    const jinaUrl = `https://r.jina.ai/${normalised}`;
    let pageContent = "";
    const fetchStart = Date.now();
    try {
      const jinaHeaders: Record<string, string> = {
        "Accept": "text/plain",
        "X-Return-Format": "text",
      };
      if (jinaKey) jinaHeaders["Authorization"] = `Bearer ${jinaKey}`;

      const jinaRes = await fetch(jinaUrl, {
        headers: jinaHeaders,
        signal: AbortSignal.timeout(20_000), // 20s — Jina is fast but allow some buffer
      });
      console.log(`[smart-fill] Jina fetch ${jinaRes.status} in ${Date.now() - fetchStart}ms`);

      if (jinaRes.status === 404) {
        return json({ error: "Page not found — double-check the URL." }, 422);
      }
      if (!jinaRes.ok) {
        // Fall through to the empty-content error below
        console.warn(`[smart-fill] Jina returned ${jinaRes.status}`);
      } else {
        const text = await jinaRes.text();
        pageContent = text.slice(0, 8000);
        console.log(`[smart-fill] page content length: ${pageContent.length}`);
      }
    } catch (e) {
      console.error(`[smart-fill] Jina fetch failed after ${Date.now() - fetchStart}ms:`, e);
    }

    if (!pageContent) {
      return json({ error: "Could not fetch page content. The site may be private or unavailable." }, 422);
    }

    // ── Step 2: build prompt based on form type ──────────────────────────────
    const systemPrompt =
      "You are extracting structured information from a web page to pre-fill a form. " +
      languageInstruction(outputLanguage) +
      "Only include fields you are confident about — return null for anything uncertain or not mentioned. " +
      "Return ONLY valid JSON, no explanation.";

    let userPrompt: string;
    const langRules = languageFieldRules(outputLanguage);

    if (type === "event") {
      userPrompt =
        `Web page content:\n---\n${pageContent}\n---\n\n` +
        langRules +
        `Extract event details and return ONLY a JSON object:\n` +
        `{\n` +
        `  "title": string | null,\n` +
        `  "description": string | null,\n` +
        `  "category": string | null,\n` +
        `  "location": string | null,\n` +
        `  "cost": string | null,\n` +
        `  "primaryLanguage": string | null,\n` +
        `  "online": boolean | null,\n` +
        `  "howToJoin": string | null,\n` +
        `  "luma": string | null,\n` +
        `  "website": string | null,\n` +
        `  "tags": string[] | null,\n` +
        `  "startDate": string | null,\n` +
        `  "endDate": string | null\n` +
        `}\n\n` +
        `Rules:\n` +
        `- title: event name (MUST follow language output rules)\n` +
        `- description: what the event is about, 2-4 sentences (follow language output rules)\n` +
        `- category: must be exactly one of: ${EVENT_CATEGORIES.join(", ")}\n` +
        `- location: venue name and/or address, or platform if online (MUST follow language output rules for words like Online, TBA, campus names)\n` +
        `- cost: e.g. "Free", "¥1,000", "¥500 at door" (MUST follow language output rules for words like Free or at door)\n` +
        `- primaryLanguage: must be exactly one of: ${LANGUAGES.join(", ")}\n` +
        `- online: true if the event is online/virtual\n` +
        `- howToJoin: how to register or attend, 1-2 sentences (MUST follow language output rules)\n` +
        `- luma: full lu.ma or luma.com URL if present; if the source URL is a Luma page, put that URL here\n` +
        `- website: other event website URL\n` +
        `- tags: pick 0-4 that apply from this exact list only (use exact strings): ${TAGS.map((tag) => `"${tag}"`).join(", ")}\n` +
        `- startDate: ISO 8601 datetime string for event start (e.g. "2026-05-25T18:00:00+09:00"), extract from JSON-LD startDate or visible date text\n` +
        `- endDate: ISO 8601 datetime string for event end`;
    } else if (type === "deal") {
      userPrompt =
        `Web page content:\n---\n${pageContent}\n---\n\n` +
        langRules +
        `Extract student deal/discount details and return ONLY a JSON object:\n` +
        `{\n` +
        `  "brand": string | null,\n` +
        `  "title": string | null,\n` +
        `  "description": string | null,\n` +
        `  "originalPrice": string | null,\n` +
        `  "newPrice": string | null,\n` +
        `  "studentOnly": boolean | null,\n` +
        `  "mode": string | null,\n` +
        `  "url": string | null\n` +
        `}\n\n` +
        `Rules:\n` +
        `- brand: brand or store name (MUST follow language output rules; for Both include an English/Japanese pair when possible)\n` +
        `- title: the deal title, e.g. "20% off with student ID" (MUST follow language output rules)\n` +
        `- description: how to redeem, conditions, details, 2-4 sentences (MUST follow language output rules)\n` +
        `- originalPrice: e.g. "¥1,200"\n` +
        `- newPrice: discounted price e.g. "¥960"\n` +
        `- studentOnly: true if this is exclusively for students\n` +
        `- mode: must be exactly one of: In-Person, Online, Both\n` +
        `- url: the deal or brand page URL`;
    } else {
      // Default: circle
      userPrompt =
        `Web page content:\n---\n${pageContent}\n---\n\n` +
        langRules +
        `Extract student circle/club details and return ONLY a JSON object:\n` +
        `{\n` +
        `  "name": string | null,\n` +
        `  "description": string | null,\n` +
        `  "category": string | null,\n` +
        `  "university": string | null,\n` +
        `  "primaryLanguage": string | null,\n` +
        `  "englishFriendly": boolean | null,\n` +
        `  "recruiting": boolean | null,\n` +
        `  "recruitingPeriod": string | null,\n` +
        `  "membershipFee": string | null,\n` +
        `  "howToJoin": string | null,\n` +
        `  "instagram": string | null,\n` +
        `  "website": string | null,\n` +
        `  "tags": string[] | null\n` +
        `}\n\n` +
        `Rules:\n` +
        `- name: the circle/club name (MUST follow language output rules; for Both include an English/Japanese pair when possible)\n` +
        `- description: what the circle does, 2-4 sentences (MUST follow language output rules)\n` +
        `- category: must be exactly one of: ${CIRCLE_CATEGORIES.join(", ")}\n` +
        `- university: full university name (MUST follow language output rules when possible)\n` +
        `- primaryLanguage: must be exactly one of: ${LANGUAGES.join(", ")}\n` +
        `- englishFriendly: true only if explicitly English-friendly or bilingual\n` +
        `- recruiting: true only if actively recruiting new members\n` +
        `- recruitingPeriod: e.g. "April – May each year" (MUST follow language output rules)\n` +
        `- membershipFee: e.g. "¥5,000/year" or "Free" (MUST follow language output rules for words like Free/year)\n` +
        `- howToJoin: 1-2 sentences on how to apply/join (MUST follow language output rules)\n` +
        `- instagram: handle only, no @ or URL (e.g. "tokyotechsociety")\n` +
        `- website: full URL of their own website\n` +
        `- tags: pick 2-5 that apply from this exact list only (use exact strings): ${TAGS.map((tag) => `"${tag}"`).join(", ")}`;
    }

    const aiStart = Date.now();
    console.log("[smart-fill] calling OpenAI...");

    // ── OpenAI call ──────────────────────────────────────────────────────────
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: outputLanguage === "both" ? 2048 : 1024,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(20_000), // 20s limit on OpenAI call
    });

    // ── Claude (swap in when ready) ──────────────────────────────────────────
    // const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "x-api-key": anthropicKey,
    //     "anthropic-version": "2023-06-01",
    //   },
    //   body: JSON.stringify({
    //     model: "claude-haiku-4-5-20251001",
    //     max_tokens: 1024,
    //     messages: [{ role: "user", content: `${systemPrompt}\n\n${userPrompt}` }],
    //   }),
    //   signal: AbortSignal.timeout(20_000),
    // });

    console.log(`[smart-fill] OpenAI responded ${aiRes.status} in ${Date.now() - aiStart}ms`);

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      return json({ error: err?.error?.message ?? `OpenAI error ${aiRes.status}` }, 500);
    }

    const aiData = await aiRes.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "";
    console.log("[smart-fill] raw AI response:", rawText.slice(0, 200));

    // Parse JSON — strip markdown fences just in case the model wraps it
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.error("[smart-fill] failed to parse AI response:", rawText);
      return json({ error: "Could not parse AI response" }, 500);
    }

    if (type === "event") {
      const website = extracted.website;
      const luma = extracted.luma;
      if (!luma && isLumaUrl(website)) {
        extracted.luma = website;
        extracted.website = null;
      } else if (!luma && isLumaUrl(normalised)) {
        extracted.luma = normalised;
      }
      if (extracted.website === extracted.luma) extracted.website = null;
    }

    return json({ data: extracted });

  } catch (err: any) {
    console.error("[smart-fill] unhandled error:", err);
    if (err?.name === "AbortError") {
      return json({ error: "Request took too long — try a simpler URL or try again." }, 504);
    }
    return json({ error: err?.message ?? "Internal error" }, 500);
  }
}
