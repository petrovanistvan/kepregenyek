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
    const { title, summary } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use a generic artistic prompt to avoid copyright refusals
    const prompt = `Create a dramatic, cinematic digital painting inspired by the concept: "${title}".
Context: ${summary || title}

Style: Bold comic-book inspired art with dramatic lighting, vivid colors, dynamic composition.
Format: Horizontal 4:3, full-bleed artwork filling the entire frame.
Important: Do NOT include any text, speech bubbles, logos, watermarks, or borders. This is purely visual art.
Do NOT depict any trademarked or copyrighted characters. Instead, create original characters inspired by the theme and mood.`;

    const models = ["google/gemini-2.5-flash-image", "google/gemini-3-pro-image-preview"];
    let imageUrl: string | null = null;

    for (const model of models) {
      console.log(`Trying model: ${model}`);
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
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
        console.error(`AI gateway error (${model}):`, response.status, t);
        continue; // try next model
      }

      const data = await response.json();
      console.log(`Response from ${model}:`, JSON.stringify({
        hasChoices: !!data.choices,
        hasImages: !!data.choices?.[0]?.message?.images,
        imageCount: data.choices?.[0]?.message?.images?.length ?? 0,
        contentPreview: data.choices?.[0]?.message?.content?.substring(0, 200),
      }));

      imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
      if (imageUrl) break;
    }

    if (!imageUrl) {
      // Return a graceful fallback instead of 500
      return new Response(
        JSON.stringify({ imageUrl: null, error: "Image generation unavailable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-comic-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
