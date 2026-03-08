import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory per-IP rate limiter: max 5 requests per 60 seconds
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const ipHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}

function isAuthorized(req: Request): boolean {
  const anonKeyFallback = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6cGZ1amdzbW55bGxkeW5iZW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NDE1NjgsImV4cCI6MjA4NzMxNzU2OH0._EQY1Uix5-29F3njLbaLT9q3fTrQxPkok_9ILeb9Eh0";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")?.trim();
  const apikey = req.headers.get("apikey")?.trim();
  const bearerToken = extractBearerToken(req);

  const allowed = new Set([anonKey, publishableKey, anonKeyFallback].filter((v): v is string => Boolean(v)));

  return Boolean(
    (apikey && allowed.has(apikey)) ||
    (bearerToken && allowed.has(bearerToken))
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please wait a minute." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { answers, questions } = body;

    // Input validation
    if (!answers || typeof answers !== "object" || Array.isArray(answers) || !Array.isArray(questions)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (questions.length > 20) {
      return new Response(JSON.stringify({ error: "Too many questions" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allQuestionsValid = questions.every(
      (q: any) => q && typeof q.id === "string" && typeof q.text === "string" && q.id.length <= 100 && q.text.length <= 500
    );

    if (!allQuestionsValid) {
      return new Response(JSON.stringify({ error: "Invalid question payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const questionMap: Record<string, string> = {};
    for (const q of questions) {
      questionMap[q.id] = q.text;
    }

    const preferenceSummary = Object.entries(answers)
      .map(([id, val]) => `- ${questionMap[id] || id}: ${val ? "Igen" : "Nem"}`)
      .join("\n");

    const prompt = `Te egy képregény-szakértő vagy. A felhasználó az alábbi preferenciákat adta meg egy kvízben:

${preferenceSummary}

Ezek alapján ajánlj pontosan 5 db DC és/vagy Marvel képregényt (könyvet/kötetet), amelyek valóban léteznek és kaphatók. Az ajánlásokat a felhasználó preferenciáihoz igazítsd:
- Ha DC-t szereti, adj DC képregényeket (Batman, Superman, Wonder Woman, Justice League stb.)
- Ha Marvelt szereti, adj Marvel képregényeket (Spider-Man, X-Men, Avengers, Iron Man stb.)
- Ha mindkettőt szereti, vegyítsd
- Ha rövidet kér, max ~200 oldalas köteteket
- Ha fontos az ár-érték arány, olcsóbb/értékesebb köteteket
- Ha modernt kér, 2000 utáni kiadásokat
- Ha top ratedet kér, csak a legjobban értékelteket

Válaszolj KIZÁRÓLAG az alábbi JSON formátumban, semmi más szöveget ne adj hozzá:
{
  "title": "Személyre szabott ajánlásaid",
  "recommendations": [
    {
      "title": "Képregény pontos címe",
      "description": "Rövid, 1 mondatos leírás magyarul",
      "why": "Miért illik a felhasználó preferenciáihoz (1 mondat, magyarul)",
      "summary": ""
    }
  ],
  "reasoning": "2-3 mondatos összefoglaló magyarul, miért ezeket az ajánlásokat adtad a felhasználó válaszai alapján."
}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Te egy képregény-szakértő vagy, aki személyre szabott ajánlásokat ad. Mindig valid JSON-nel válaszolsz, semmi más szöveggel. Csak valóban létező, kiadott képregényeket ajánlj.",
            },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI service error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "";
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Invalid AI JSON response");
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Recommendation service timeout, please try again." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.error("generate-recommendations error:", e);
    return new Response(
      JSON.stringify({ error: "Recommendation service error, please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
