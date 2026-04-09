import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert automotive parts identifier. Analyze the photo carefully and identify:

1. WHAT the part is (e.g., side mirror assembly, brake caliper, headlight, alternator)
2. WHICH vehicle it belongs to — look for:
   - Brand logos, emblems, or text stamped on the part
   - Part numbers printed/etched on the part
   - Shape, color, and design cues that match specific makes/models
   - OEM markings, stickers, or labels
3. The SIDE or POSITION if applicable (left/right, front/rear, upper/lower)

Respond with ONLY a JSON object:
- "partName": A specific, searchable name with vehicle make/model if identifiable. Format: "[Make] [Model] [position] [part type]". Examples: "Volvo XC60 right side mirror assembly", "BMW 3 Series E90 front left brake caliper", "Ford Focus MK3 rear tail light"
- "confidence": "high" (clearly identifiable part + vehicle), "medium" (part type clear but vehicle uncertain), or "low" (cannot determine)
- "details": Describe what you see — brand markings, part numbers, color, condition, mounting style, any text visible on the part

CRITICAL RULES:
- Focus on the ACTUAL part visible in the photo. Do NOT guess unrelated parts.
- If you see a mirror, it's a mirror — not a spark plug or alternator.
- Include left/right/front/rear orientation when visible.
- If you can't identify the vehicle make/model, still identify the part type accurately.
- If you cannot identify the part at all, set partName to "Unknown car part" and confidence to "low".

Return ONLY the JSON object, no markdown, no explanation.`;

const BodySchema = z.object({
  image: z.string().min(1),
});

function parseResult(content: string) {
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI response:", content);
    return null;
  }
}

async function callClaude(apiKey: string, mediaType: string, base64Data: string): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            { type: "text", text: "Identify this car part." },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error [${response.status}]: ${errText}`);
  }

  const aiData = await response.json();
  return aiData.content?.[0]?.text || "{}";
}

async function callLovableAI(apiKey: string, imageDataUri: string): Promise<string> {
  const response = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this car part:" },
            { type: "image_url", image_url: { url: imageDataUri } },
          ],
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Lovable AI error [${response.status}]: ${errText}`);
  }

  const aiData = await response.json();
  return aiData.choices?.[0]?.message?.content || "{}";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

    // Rate limit
    const clientId = req.headers.get("Authorization")?.slice(-20) || req.headers.get("x-forwarded-for") || "anonymous";
    const { allowed } = await checkRateLimit(clientId, "identify-part");
    if (!allowed) return rateLimitResponse(corsHeaders);


    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { image } = parsed.data;

    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: "Invalid image format. Expected a base64 data URI." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const mediaType = match[1];
    const base64Data = match[2];

    let content: string | null = null;
    let usedFallback = false;

    // Try Claude first
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (ANTHROPIC_API_KEY) {
      try {
        content = await callClaude(ANTHROPIC_API_KEY, mediaType, base64Data);
        console.log("Used Claude for identification");
      } catch (err) {
        console.error("Claude failed, falling back to Lovable AI:", err);
        usedFallback = true;
      }
    } else {
      console.log("No ANTHROPIC_API_KEY, using Lovable AI directly");
      usedFallback = true;
    }

    // Fallback to Lovable AI
    if (!content || usedFallback) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "No AI provider configured (both Anthropic and Lovable AI keys missing)" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        content = await callLovableAI(LOVABLE_API_KEY, image);
        console.log("Used Lovable AI fallback for identification");
      } catch (fallbackErr) {
        console.error("Lovable AI fallback also failed:", fallbackErr);
        return new Response(
          JSON.stringify({ error: "Both AI providers failed. Please try again later." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const result = parseResult(content!) || {
      partName: "Unknown car part",
      confidence: "low",
      details: "Could not parse AI response",
    };

    return new Response(
      JSON.stringify({
        partName: result.partName || "Unknown car part",
        confidence: result.confidence || "low",
        details: result.details || "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Identify error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
