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

  let masterTimer: ReturnType<typeof setTimeout> | undefined;

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") return json({ error: "url is required" }, 400);

    const normalised = url.startsWith("http") ? url : `https://${url}`;
    console.log("[smart-fill] fetching URL:", normalised);

    // Single AbortController for all outgoing fetches.
    // Fires at 22s so the function can return an error before Supabase kills it.
    const master = new AbortController();
    masterTimer = setTimeout(() => {
      console.error("[smart-fill] master 22s timeout — aborting");
      master.abort();
    }, 22_000);

    // ── Step 1: fetch page content via Jina AI ───────────────────────────────
    // Jina converts any URL into clean markdown, handling JS-rendered pages and CORS.
    let pageContent = "";
    const jinaStart = Date.now();
    try {
      const jinaRes = await fetch(`https://r.jina.ai/${normalised}`, {
        headers: {
          "Accept": "text/plain",
          "X-Timeout": "8",        // tell Jina's server to give up after 8s
          "X-Return-Format": "markdown",
        },
        signal: master.signal,   // aborted by masterTimer if still running at 22s
      });
      console.log(`[smart-fill] Jina ${jinaRes.status} in ${Date.now() - jinaStart}ms`);
      if (jinaRes.ok) {
        const text = await jinaRes.text();
        pageContent = text.slice(0, 8000); // truncate to keep prompt small
        console.log(`[smart-fill] page content length: ${pageContent.length}`);
      }
    } catch (e) {
      console.error(`[smart-fill] Jina failed after ${Date.now() - jinaStart}ms:`, e);
    }

    if (!pageContent) {
      clearTimeout(masterTimer);
      return json({ error: "Could not fetch page content. The site may be private or unavailable." }, 422);
    }

    // ── Step 2: extract fields with OpenAI ──────────────────────────────────
    const systemPrompt =
      "You are extracting information about a student circle/club from a web page to pre-fill a form. " +
      "Only include fields you are confident about — return null for anything uncertain or not mentioned. " +
      "Return ONLY valid JSON, no explanation.";

    const userPrompt =
      `Web page content:\n---\n${pageContent}\n---\n\n` +
      `Extract these fields and return ONLY a JSON object:\n` +
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
      `- tags: 2-5 short lowercase keywords (e.g. "programming", "volleyball")`;

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
    // If the master AbortController fired, give a clear message
    if (err?.name === "AbortError") {
      return json({ error: "Request took too long — try a simpler URL or try again." }, 504);
    }
    return json({ error: err?.message ?? "Internal error" }, 500);
  }
});
