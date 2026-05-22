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

  try {
    // ── API key ───────────────────────────────────────────────────────────────
    // Currently using OpenAI. To switch to Claude, comment out the OpenAI block
    // below and uncomment the Claude block.
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return json({ error: "OPENAI_API_KEY not configured" }, 500);

    // const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    // if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

    const { url } = await req.json();
    if (!url || typeof url !== "string") return json({ error: "url is required" }, 400);

    // Normalise URL
    const normalised = url.startsWith("http") ? url : `https://${url}`;

    // Fetch page content via Jina AI reader (returns clean markdown, no CORS issues)
    const jinaUrl = `https://r.jina.ai/${normalised}`;
    let pageContent = "";
    try {
      const jinaRes = await fetch(jinaUrl, {
        headers: {
          "Accept": "text/plain",
          "X-Timeout": "15",
          "X-Return-Format": "markdown",
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (jinaRes.ok) {
        const text = await jinaRes.text();
        // Truncate to ~8k chars to stay within context budget
        pageContent = text.slice(0, 8000);
      }
    } catch (e) {
      console.error("Jina fetch failed:", e);
    }

    if (!pageContent) {
      return json({ error: "Could not fetch page content. The site may be private or unavailable." }, 422);
    }

    // ── Prompt (shared between providers) ────────────────────────────────────
    const systemPrompt = `You are extracting information about a student circle/club from a web page to pre-fill a form. Only include fields you are confident about — return null for anything uncertain or not mentioned. Return ONLY valid JSON, no explanation.`;

    const userPrompt = `Web page content:
---
${pageContent}
---

Extract these fields and return ONLY a JSON object with these exact keys:
{
  "name": string | null,
  "description": string | null,
  "category": string | null,
  "university": string | null,
  "primaryLanguage": string | null,
  "englishFriendly": boolean | null,
  "recruiting": boolean | null,
  "recruitingPeriod": string | null,
  "membershipFee": string | null,
  "howToJoin": string | null,
  "instagram": string | null,
  "website": string | null,
  "tags": string[] | null
}

Rules:
- name: the circle/club name
- description: what the circle does (2-4 sentences, natural English)
- category: must be exactly one of: ${CIRCLE_CATEGORIES.join(", ")}
- university: full university name (e.g. "Tokyo University")
- primaryLanguage: must be exactly one of: ${LANGUAGES.join(", ")}
- englishFriendly: true only if explicitly English-friendly or bilingual
- recruiting: true only if actively recruiting new members now
- recruitingPeriod: e.g. "April – May each year"
- membershipFee: e.g. "¥5,000/year" or "Free"
- howToJoin: 1-2 sentences on how to apply/join
- instagram: handle only, no @ or URL (e.g. "tokyotechsociety")
- website: full URL of their own website (not instagram or the URL fetched if it's a social page)
- tags: 2-5 short lowercase keywords (e.g. "programming", "volleyball", "anime")`;

    // ── OpenAI ────────────────────────────────────────────────────────────────
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
      signal: AbortSignal.timeout(30_000),
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      return json({ error: err?.error?.message ?? `OpenAI error ${aiRes.status}` }, 500);
    }

    const aiData = await aiRes.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "";

    // ── Claude (swap in when ready) ───────────────────────────────────────────
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
    //   signal: AbortSignal.timeout(30_000),
    // });
    // if (!aiRes.ok) {
    //   const err = await aiRes.json().catch(() => ({}));
    //   return json({ error: err?.error?.message ?? `Claude error ${aiRes.status}` }, 500);
    // }
    // const aiData = await aiRes.json();
    // const rawText = aiData.content?.[0]?.text ?? "";

    // Parse JSON (strip markdown fences just in case)
    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawText);
      return json({ error: "Could not parse AI response" }, 500);
    }

    return json({ data: extracted });
  } catch (err: any) {
    console.error("smart-fill error:", err);
    return json({ error: err?.message ?? "Internal error" }, 500);
  }
});
