import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse, validateJWT, logSecurityEvent, checkRequestSize } from "../_shared/security.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are a professional automotive parts expert with 20+ years experience.

Analyze the car part in the image and identify it PRECISELY.

RULES:
- Be SPECIFIC. Do not use vague terms like "engine component" or "air box"
- If you see an intake manifold, say "intake manifold" NOT "air intake"
- If you see brake pads, say "brake pad set" NOT "brake component"
- If you see a water pump, say "water pump" NOT "cooling component"
- Look for: part numbers, brand logos, casting marks, OEM stamps
- Consider the shape, material, ports, connectors to identify correctly
- Include left/right/front/rear orientation when visible
- If you cannot identify the part at all, set partName to "Unknown car part" and confidence to "low"`;

const USER_PROMPT = `Look at this car part image carefully.
Identify the EXACT part name - be very specific.
Do NOT generalise. If it's a manifold, say manifold. If it's a brake disc, say brake disc.

Return ONLY this JSON, nothing else:
{
  "partName": "exact specific part name here",
  "partCategory": "one of: Engine, Brakes, Suspension, Exhaust, Electrical, Cooling, Steering, Transmission, Body, Filters",
  "condition": "New or Used or Unknown",
  "compatibleVehicles": ["list of cars this typically fits, max 5"],
  "topBrands": ["top 3 aftermarket brands for this part"],
  "searchTerms": [
    "most specific eBay search term with make and part name",
    "medium specific search term",
    "broad search term for this part type"
  ],
  "confidence": "high or medium or low",
  "detectedMake": "car make if visible or null",
  "detectedPartNumber": "part number if visible or null"
}`;

const BodySchema = z.object({
  image: z.string().min(1).max(10_000_000),
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
          { type: "text", text: USER_PROMPT },
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
          { type: "text", text: USER_PROMPT },
          { type: "image_url", image_url: { url: imageDataUri } },
        ]},
      ],
      temperature: 0.2,
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

  const sizeCheck = checkRequestSize(req, 8_388_608);
  if (sizeCheck) return sizeCheck;

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(clientIp, "identify-part");
  if (!allowed) {
    await logSecurityEvent("rate_limit_exceeded", req, undefined, "identify-part");
    return rateLimitResponse(corsHeaders);
  }

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
      category: "",
      condition: "",
      compatibleVehicles: [],
      brands: [],
      searchTerms: [],
      detectedMake: null,
      detectedPartNumber: null,
    };

    return jsonResponse({
      partName: result.partName || "Unknown car part",
      category: result.partCategory || result.category || "",
      condition: result.condition || "",
      compatibleVehicles: Array.isArray(result.compatibleVehicles) ? result.compatibleVehicles : [],
      brands: Array.isArray(result.topBrands) ? result.topBrands : (Array.isArray(result.brands) ? result.brands : []),
      searchTerms: Array.isArray(result.searchTerms) ? result.searchTerms : [],
      confidence: result.confidence || "low",
      details: result.details || "",
      detectedMake: result.detectedMake || null,
      detectedPartNumber: result.detectedPartNumber || null,
    }, 200, corsHeaders);
  } catch (error) {
    console.error("Identify error:", error);
    return jsonResponse({ error: "Failed to identify part. Please try again." }, 500, corsHeaders);
  }
});
