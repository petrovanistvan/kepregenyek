import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers, questions } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build a human-readable preference summary from quiz answers
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "";

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recommendations error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
