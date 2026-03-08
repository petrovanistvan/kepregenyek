import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
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

function extractImageUrl(data: any): string | null {
  const message = data?.choices?.[0]?.message;

  // Check images array (standard Lovable AI response format)
  const fromImages = message?.images?.[0]?.image_url?.url;
  if (fromImages && typeof fromImages === "string") return fromImages;

  // Check content array for image_url parts
  const content = Array.isArray(message?.content) ? message.content : [];
  const imagePart = content.find((item: any) => item?.type === "image_url");
  const fromContent = imagePart?.image_url?.url;
  if (fromContent && typeof fromContent === "string") return fromContent;

  // Check if content itself is a base64 data URL string
  if (typeof message?.content === "string" && message.content.startsWith("data:image")) {
    return message.content;
  }

  // Check inline_data format (Gemini native)
  const inlinePart = content.find((item: any) => item?.inline_data?.mime_type?.startsWith("image/"));
  if (inlinePart?.inline_data?.data) {
    const mime = inlinePart.inline_data.mime_type || "image/png";
    return `data:${mime};base64,${inlinePart.inline_data.data}`;
  }

  return null;
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
    const { title, summary } = await req.json();

    // Input validation
    if (!title || typeof title !== "string" || title.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid or missing title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (summary && (typeof summary !== "string" || summary.length > 2000)) {
      return new Response(JSON.stringify({ error: "Summary too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
          signal: AbortSignal.timeout(15000),
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
        continue;
      }

      const data = await response.json();
      console.log(`Response structure (${model}):`, JSON.stringify(Object.keys(data?.choices?.[0]?.message || {})));
      if (data?.choices?.[0]?.message?.images) {
        console.log("Images array found, length:", data.choices[0].message.images.length);
      }
      if (Array.isArray(data?.choices?.[0]?.message?.content)) {
        console.log("Content types:", data.choices[0].message.content.map((c: any) => c?.type));
      }
      imageUrl = extractImageUrl(data);
      if (imageUrl) {
        console.log(`Image extracted successfully from ${model}, URL starts with:`, imageUrl.substring(0, 30));
        break;
      } else {
        console.warn(`No image URL extracted from ${model} response`);
      }
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ imageUrl: null, error: "Image generation unavailable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Image generation timeout, please try again." }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.error("generate-comic-image error:", e);
    return new Response(
      JSON.stringify({ error: "Image generation service error, please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
