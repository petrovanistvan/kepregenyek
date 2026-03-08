import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")?.trim();
  const apikey = req.headers.get("apikey")?.trim();
  const bearerToken = extractBearerToken(req);

  const allowed = new Set([anonKey, publishableKey].filter((v): v is string => Boolean(v)));
  if (allowed.size === 0) return false;

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
    const { title, description } = await req.json();

    // Input validation
    if (!title || typeof title !== "string" || title.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid or missing title" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (description && (typeof description !== "string" || description.length > 2000)) {
      return new Response(JSON.stringify({ error: "Description too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Te egy képregény-szakértő vagy. A felhasználónak nagyon tetszett ez a képregény:

Cím: ${title}
Leírás: ${description}

Ajánlj pontosan 3 hasonló képregényt, amelyek:
- Hasonló stílusúak, hangulatúak vagy tematikájúak
- Valóban léteznek és kiadott kötetek
- NE ismételd az eredeti címet

Válaszolj KIZÁRÓLAG az alábbi JSON formátumban:
{
  "recommendations": [
    {
      "title": "Képregény pontos címe",
      "description": "Rövid, 1 mondatos leírás magyarul",
      "why": "Miért hasonló az eredetihez (1 mondat, magyarul)",
      "summary": ""
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Te egy képregény-szakértő vagy. Mindig valid JSON-nel válaszolsz. Csak valóban létező képregényeket ajánlj." },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

    console.error("generate-more-like-this error:", e);
    return new Response(
      JSON.stringify({ error: "Recommendation service error, please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
