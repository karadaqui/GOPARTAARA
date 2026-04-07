import { corsHeaders } from "@supabase/supabase-js/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const AI_GATEWAY_URL = "https://ai-gateway.lovable.dev/v1/chat/completions";

const BodySchema = z.object({
  query: z.string().min(1).max(500),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { query } = parsed.data;

    const systemPrompt = `You are a UK car parts search engine. Given a search query for a car part, return a JSON array of realistic search results from real UK car parts suppliers.

Each result must have these fields:
- partName: descriptive name of the part including brand/fitment info
- partNumber: realistic part number (e.g., "ECP-48291", "GSF-BRK-1205")
- supplier: one of these real suppliers: "Euro Car Parts", "GSF Car Parts", "AutoDoc", "eBay Motors", "Car Parts 4 Less", "Halfords"
- price: price in GBP as a number (realistic UK pricing)
- originalPrice: original price before discount (null if no discount, number otherwise)  
- availability: one of "in_stock", "low_stock", "out_of_stock"
- deliveryDays: 1-5 (integer)
- url: a realistic URL for that supplier's website (e.g., "https://www.eurocarparts.com/...")
- rating: number between 3.0 and 5.0 with one decimal

Return exactly 9 results spread across different suppliers with varied pricing. Make part names, numbers, and prices realistic for the UK market. Include a mix of OEM, aftermarket, and budget options.

IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Search for: ${query}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `AI search failed [${response.status}]` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse the JSON from the AI response (strip markdown fences if present)
    let parts;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parts = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      parts = [];
    }

    // Add IDs to each part
    const results = (Array.isArray(parts) ? parts : []).map((p: any, i: number) => ({
      id: `part-${i}-${Date.now()}`,
      partName: p.partName || "Unknown Part",
      partNumber: p.partNumber || `UNK-${i}`,
      supplier: p.supplier || "Unknown",
      price: typeof p.price === "number" ? p.price : 0,
      originalPrice: typeof p.originalPrice === "number" ? p.originalPrice : null,
      availability: ["in_stock", "low_stock", "out_of_stock"].includes(p.availability)
        ? p.availability
        : "in_stock",
      deliveryDays: typeof p.deliveryDays === "number" ? p.deliveryDays : 3,
      imageUrl: "/placeholder.svg",
      url: p.url || "#",
      rating: typeof p.rating === "number" ? p.rating : 4.0,
    }));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
