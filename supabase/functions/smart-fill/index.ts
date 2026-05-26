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

const LANGUAGES = [
  "Japanese", "English", "Chinese", "Korean", "French", "Spanish",
  "German", "Portuguese", "Arabic", "Hindi", "Vietnamese", "Thai",
  "Indonesian", "Malay", "Italian", "Russian",
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
  const { url, type = "circle" } = body;

  // Hard deadline — race the entire handler against a 25s timeout.
  // AbortController doesn't reliably kill Deno fetch calls, so this guarantees
  // the client always gets a response instead of hanging until the client times out.
  const deadline = new Promise<Response>((resolve) =>
    setTimeout(() => resolve(json({ error: "Request took too long — try again or try a different URL." }, 504)), 25_000)
  );

  return Promise.race([handleRequest(req, openaiKey, body, url, type), deadline]);
});

async function handleRequest(req: Request, openaiKey: string, body: unknown, url: string, type: string): Promise<Response> {
  let masterTimer: ReturnType<typeof setTimeout> | undefined;

  try {
    if (!url || typeof url !== "string") return json({ error: "url is required" }, 400);

    const normalised = url.startsWith("http") ? url : `https://${url}`;
    console.log("[smart-fill] fetching URL:", normalised);

    // Known sites that always block scraping
    if (/instagram\.com|facebook\.com|twitter\.com|x\.com/i.test(normalised)) {
      return json({ error: "Instagram, Facebook, and X/Twitter block automated access. Try pasting the details manually." }, 422);
    }

    // Single AbortController for all outgoing fetches.
    // Fires at 22s so the function can return an error before Supabase kills it.
    const master = new AbortController();
    masterTimer = setTimeout(() => {
      console.error("[smart-fill] master 22s timeout — aborting");
      master.abort();
    }, 22_000);

    // ── Step 1: fetch page content directly ─────────────────────────────────
    // Direct fetch from the edge function (no CORS issues server-side).
    // Works well for plain HTML sites and Luma. Won't work for JS-only SPAs or Instagram.
    let pageContent = "";
    const fetchStart = Date.now();
    try {
      const pageRes = await fetch(normalised, {
        headers: {
          // Pretend to be a browser so sites don't block the request
          "User-Agent": "Mozilla/5.0 (compatible; Konekto/1.0)",
          "Accept": "text/html,application/xhtml+xml,*/*",
        },
        signal: master.signal,
      });
      console.log(`[smart-fill] page fetch ${pageRes.status} in ${Date.now() - fetchStart}ms`);
      if (pageRes.status === 401 || pageRes.status === 403) {
        clearTimeout(masterTimer);
        return json({ error: "This site blocks automated access — try pasting the details manually." }, 422);
      }
      if (pageRes.status === 404) {
        clearTimeout(masterTimer);
        return json({ error: "Page not found — double-check the URL." }, 422);
      }
      if (!pageRes.ok) {
        clearTimeout(masterTimer);
        return json({ error: `Site returned an error (${pageRes.status}) — it may be down or blocking access.` }, 422);
      }
      if (pageRes.ok) {
        const html = await pageRes.text();

        // Extract JSON-LD structured data first (before stripping scripts).
        // Luma and many event sites embed startDate/endDate here.
        const jsonLdMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
        const jsonLdBlock = jsonLdMatches.map((m) => m[1].trim()).join("\n");

        // Strip all scripts/styles, then tags → plain text
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        // Prepend JSON-LD so the AI sees structured dates even if not in visible text
        const combined = jsonLdBlock
          ? `STRUCTURED DATA (JSON-LD):\n${jsonLdBlock.slice(0, 2000)}\n\nPAGE TEXT:\n${text}`
          : text;

        pageContent = combined.slice(0, 8000);
        console.log(`[smart-fill] page content length: ${pageContent.length}, jsonLd: ${jsonLdBlock.length}`);
      }
    } catch (e) {
      console.error(`[smart-fill] page fetch failed after ${Date.now() - fetchStart}ms:`, e);
    }

    if (!pageContent) {
      clearTimeout(masterTimer);
      return json({ error: "Could not fetch page content. The site may be private or unavailable." }, 422);
    }

    // ── Step 2: build prompt based on form type ──────────────────────────────
    const systemPrompt =
      "You are extracting structured information from a web page to pre-fill a form. " +
      "Always write all field values in English, even if the source page is in Japanese or another language — translate as needed. " +
      "Only include fields you are confident about — return null for anything uncertain or not mentioned. " +
      "Return ONLY valid JSON, no explanation.";

    let userPrompt: string;

    if (type === "event") {
      userPrompt =
        `Web page content:\n---\n${pageContent}\n---\n\n` +
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
        `- title: event name\n` +
        `- description: what the event is about (2-4 sentences)\n` +
        `- category: must be exactly one of: Social, Career, Hackathon, Workshop, Casual\n` +
        `- location: venue name and/or address, or platform if online\n` +
        `- cost: e.g. "Free", "¥1,000", "¥500 at door"\n` +
        `- primaryLanguage: must be exactly one of: ${LANGUAGES.join(", ")}\n` +
        `- online: true if the event is online/virtual\n` +
        `- howToJoin: how to register or attend (1-2 sentences)\n` +
        `- luma: full lu.ma URL if present\n` +
        `- website: other event website URL\n` +
        `- tags: 2-5 short lowercase keywords\n` +
        `- startDate: ISO 8601 datetime string for event start (e.g. "2026-05-25T18:00:00+09:00"), extract from JSON-LD startDate or visible date text\n` +
        `- endDate: ISO 8601 datetime string for event end`;
    } else if (type === "deal") {
      userPrompt =
        `Web page content:\n---\n${pageContent}\n---\n\n` +
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
        `- brand: brand or store name\n` +
        `- title: the deal title (e.g. "20% off with student ID")\n` +
        `- description: how to redeem, conditions, details (2-4 sentences)\n` +
        `- originalPrice: e.g. "¥1,200"\n` +
        `- newPrice: discounted price e.g. "¥960"\n` +
        `- studentOnly: true if this is exclusively for students\n` +
        `- mode: must be exactly one of: In-Person, Online, Both\n` +
        `- url: the deal or brand page URL`;
    } else {
      // Default: circle
      userPrompt =
        `Web page content:\n---\n${pageContent}\n---\n\n` +
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
        `- name: the circle/club name\n` +
        `- description: what the circle does (2-4 sentences, natural English)\n` +
        `- category: must be exactly one of: ${CIRCLE_CATEGORIES.join(", ")}\n` +
        `- university: full university name (e.g. "Tokyo University")\n` +
        `- primaryLanguage: must be exactly one of: ${LANGUAGES.join(", ")}\n` +
        `- englishFriendly: true only if explicitly English-friendly or bilingual\n` +
        `- recruiting: true only if actively recruiting new members\n` +
        `- recruitingPeriod: e.g. "April – May each year"\n` +
        `- membershipFee: e.g. "¥5,000/year" or "Free"\n` +
        `- howToJoin: 1-2 sentences on how to apply/join\n` +
        `- instagram: handle only, no @ or URL (e.g. "tokyotechsociety")\n` +
        `- website: full URL of their own website\n` +
        `- tags: 2-5 short lowercase keywords`;
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
        max_tokens: 1024,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: master.signal, // aborted by masterTimer if still running at 22s
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
    //   signal: master.signal,
    // });

    clearTimeout(masterTimer);
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

    return json({ data: extracted });

  } catch (err: any) {
    clearTimeout(masterTimer);
    console.error("[smart-fill] unhandled error:", err);
    if (err?.name === "AbortError") {
      return json({ error: "Request took too long — try a simpler URL or try again." }, 504);
    }
    return json({ error: err?.message ?? "Internal error" }, 500);
  }
}
