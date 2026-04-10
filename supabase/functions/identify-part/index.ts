import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse, validateJWT, logSecurityEvent, checkRequestSize } from "../_shared/security.ts";

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
  image: z.string().min(1).max(10_000_000), // Max ~7.5MB base64
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
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
          { type: "text", text: "Identify this car part." },
        ],
      }],
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
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: [
          { type: "text", text: "Identify this car part:" },
          { type: "image_url", image_url: { url: imageDataUri } },
        ]},
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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  // Request size limit (8MB for images)
  const sizeCheck = checkRequestSize(req, 8_388_608);
  if (sizeCheck) return sizeCheck;

  // Rate limit (10/min)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(clientIp, "identify-part");
  if (!allowed) {
    await logSecurityEvent("rate_limit_exceeded", req, undefined, "identify-part");
    return rateLimitResponse(corsHeaders);
  }

  // JWT validation (mandatory)
  const auth = await validateJWT(req, corsHeaders);
  if (auth.error) {
    await logSecurityEvent("unauthenticated_access", req, undefined, "identify-part");
    return auth.error;
  }

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten().fieldErrors }, 400, corsHeaders);
    }

    const { image } = parsed.data;
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return jsonResponse({ error: "Invalid image format. Expected a base64 data URI." }, 400, corsHeaders);
    }
    const mediaType = match[1];
    const base64Data = match[2];

    let content: string | null = null;
    let usedFallback = false;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (ANTHROPIC_API_KEY) {
      try {
        content = await callClaude(ANTHROPIC_API_KEY, mediaType, base64Data);
      } catch (err) {
        console.error("Claude failed, falling back:", err);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    if (!content || usedFallback) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        return jsonResponse({ error: "No AI provider configured" }, 500, corsHeaders);
      }
      try {
        content = await callLovableAI(LOVABLE_API_KEY, image);
      } catch (fallbackErr) {
        console.error("Lovable AI fallback also failed:", fallbackErr);
        return jsonResponse({ error: "AI providers unavailable. Please try again later." }, 502, corsHeaders);
      }
    }

    const result = parseResult(content!) || {
      partName: "Unknown car part",
      confidence: "low",
      details: "Could not parse AI response",
    };

    return jsonResponse({
      partName: result.partName || "Unknown car part",
      confidence: result.confidence || "low",
      details: result.details || "",
    }, 200, corsHeaders);
  } catch (error) {
    console.error("Identify error:", error);
    return jsonResponse({ error: "Failed to identify part. Please try again." }, 500, corsHeaders);
  }
});
