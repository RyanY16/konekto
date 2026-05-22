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
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);

    const { url } = await req.json();
    if (!url || typeof url !== "string") return json({ error: "url is required" }, 400);

    // Normalise URL
    const normalised = url.startsWith("http") ? url : `https://${url}`;

    // Fetch page content via Jina AI reader (returns clean markdown)
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

    // Call Claude to extract structured data
    const prompt = `You are extracting information about a student circle/club from a web page to pre-fill a form.

Web page content:
---
${pageContent}
---

Extract the following fields. Only include fields you are confident about — return null for anything uncertain or not mentioned.

Return ONLY valid JSON with these exact keys:
{
  "name": string | null,           // Circle/club name
  "description": string | null,    // What the circle does (2-4 sentences max, natural English)
  "category": string | null,       // Must be exactly one of: ${CIRCLE_CATEGORIES.join(", ")}
  "university": string | null,     // University name (full name, e.g. "Tokyo University")
  "primaryLanguage": string | null, // Must be exactly one of: ${LANGUAGES.join(", ")}
  "englishFriendly": boolean | null, // true if the circle is explicitly English-friendly/bilingual
  "recruiting": boolean | null,    // true if the circle is actively recruiting new members
  "recruitingPeriod": string | null, // e.g. "April – May each year"
  "membershipFee": string | null,  // e.g. "¥5,000/year" or "Free"
  "howToJoin": string | null,      // How to apply or join (1-2 sentences)
  "instagram": string | null,      // Instagram handle only, no @ or URL (e.g. "tokyotechsociety")
  "website": string | null,        // Full URL of their website (not the URL we just fetched if it is an instagram/social page)
  "tags": string[] | null          // 2-5 relevant tags from their content (short lowercase keywords e.g. "programming", "volleyball", "anime")
}

Do not make up information. If unsure, use null. Return only the JSON object, no explanation.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.json().catch(() => ({}));
      return json({ error: err?.error?.message ?? `Claude API error ${claudeRes.status}` }, 500);
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text ?? "";

    // Parse JSON from response (strip any markdown fences)
    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Claude response:", rawText);
      return json({ error: "Could not parse AI response" }, 500);
    }

    return json({ data: extracted });
  } catch (err: any) {
    console.error("smart-fill error:", err);
    return json({ error: err?.message ?? "Internal error" }, 500);
  }
});
