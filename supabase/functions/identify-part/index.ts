import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are a car parts identification expert. The user will show you a photo of a car part. 
Identify the part and respond with ONLY a JSON object with these fields:
- "partName": a concise, searchable name for the part (e.g. "BMW E46 front brake disc", "Ford Focus headlight assembly")
- "confidence": "high", "medium", or "low"  
- "details": a brief description of what you see (brand markings, condition, fitment info)

If you cannot identify the part, set partName to "Unknown car part" and confidence to "low".
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

  try {
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
