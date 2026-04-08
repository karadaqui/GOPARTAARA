const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const EBAY_API_URL = "https://svcs.ebay.com/services/search/FindingService/v1";
const EBAY_AFFILIATE_CAMPID = "5339148333";

const BodySchema = z.object({
  query: z.string().min(1).max(500),
});

async function getEbayResults(query: string, appId: string): Promise<any[]> {
  const params = new URLSearchParams({
    "OPERATION-NAME": "findItemsAdvanced",
    "SERVICE-VERSION": "1.0.0",
    "SECURITY-APPNAME": appId,
    "RESPONSE-DATA-FORMAT": "JSON",
    "REST-PAYLOAD": "",
    "keywords": query,
    "categoryId": "6030",
    "paginationInput.entriesPerPage": "9",
    "sortOrder": "BestMatch",
    "affiliate.trackingId": EBAY_AFFILIATE_CAMPID,
    "affiliate.networkId": "9",
    "itemFilter(0).name": "ListingType",
    "itemFilter(0).value(0)": "FixedPrice",
    "itemFilter(0).value(1)": "AuctionWithBIN",
    "itemFilter(1).name": "Currency",
    "itemFilter(1).value": "GBP",
    "itemFilter(2).name": "LocatedIn",
    "itemFilter(2).value": "GB",
  });

  const response = await fetch(`${EBAY_API_URL}?${params.toString()}`);
  if (!response.ok) {
    console.error("eBay API error:", response.status, await response.text());
    return [];
  }

  const data = await response.json();
  const searchResult = data?.findItemsAdvancedResponse?.[0]?.searchResult?.[0];
  const items = searchResult?.item || [];

  return items.map((item: any, i: number) => {
    const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || "0");
    const condition = item.condition?.[0]?.conditionDisplayName?.[0] || "Not specified";
    const shippingCost = parseFloat(
      item.shippingInfo?.[0]?.shippingServiceCost?.[0]?.__value__ || "0"
    );
    const shippingType = item.shippingInfo?.[0]?.shippingType?.[0] || "";
    const freeShipping = shippingCost === 0 || shippingType === "Free";
    const imageUrl = item.galleryURL?.[0] || "/placeholder.svg";
    const viewItemUrl = item.viewItemURL?.[0] || "";

    // Build affiliate URL
    const affiliateUrl = viewItemUrl
      ? `https://rover.ebay.com/rover/1/710-53481-19255-0/1?campid=${EBAY_AFFILIATE_CAMPID}&toolid=10001&customid=partara&mpre=${encodeURIComponent(viewItemUrl)}`
      : viewItemUrl;

    return {
      id: item.itemId?.[0] || `ebay-${i}-${Date.now()}`,
      partName: item.title?.[0] || "Unknown Part",
      partNumber: item.itemId?.[0] || `EBAY-${i}`,
      supplier: "eBay Motors",
      price,
      originalPrice: null,
      availability: item.sellingStatus?.[0]?.sellingState?.[0] === "Active" ? "in_stock" : "out_of_stock",
      deliveryDays: freeShipping ? 3 : 5,
      imageUrl: imageUrl.replace("s-l140", "s-l400"),
      url: affiliateUrl || viewItemUrl,
      rating: 4.5,
      condition,
      shippingCost: freeShipping ? 0 : shippingCost,
      freeShipping,
      source: "ebay_live",
    };
  });
}

async function getAIResults(query: string, lovableApiKey: string): Promise<any[]> {
  const systemPrompt = `You are a UK car parts search engine. Given a search query for a car part, return a JSON array of realistic search results from real UK car parts suppliers.

IMPORTANT: The search results MUST be relevant to the exact query. If the query mentions a specific vehicle and part, ALL results must be for that exact vehicle and part type.

Each result must have these fields:
- partName: descriptive name including the vehicle make/model and part type
- partNumber: realistic part number
- supplier: one of "AutoDoc", "Amazon UK", "RockAuto"
- price: price in GBP as a number
- originalPrice: original price before discount (null if no discount)
- availability: one of "in_stock", "low_stock", "out_of_stock"
- deliveryDays: 1-5 (integer)
- rating: number between 3.0 and 5.0 with one decimal

Return exactly 6 results. IMPORTANT: Return ONLY the JSON array.`;

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
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
    console.error("AI Gateway error:", response.status);
    return [];
  }

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content || "[]";

  let parts;
  try {
    let cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    cleaned = cleaned.replace(/(\d)\s*1}/g, "$1}");
    parts = JSON.parse(cleaned);
  } catch {
    try {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        parts = JSON.parse(arrayMatch[0].replace(/(\d)\s*1}/g, "$1}"));
      } else {
        parts = [];
      }
    } catch {
      parts = [];
    }
  }

  const searchQuery = query.replace(/\s+/g, "+");
  const supplierSearchUrls: Record<string, string> = {
    "AutoDoc": `https://www.autodoc.co.uk/catalogsearch/result/?q=${searchQuery}`,
    "Amazon UK": `https://www.amazon.co.uk/s?k=${searchQuery}`,
    "RockAuto": `https://www.rockauto.com/en/partsearch/?romterm=${searchQuery}`,
  };

  return (Array.isArray(parts) ? parts : []).map((p: any, i: number) => {
    const supplier = p.supplier || "Unknown";
    return {
      id: `part-${i}-${Date.now()}`,
      partName: p.partName || "Unknown Part",
      partNumber: p.partNumber || `UNK-${i}`,
      supplier,
      price: typeof p.price === "number" ? p.price : 0,
      originalPrice: typeof p.originalPrice === "number" ? p.originalPrice : null,
      availability: ["in_stock", "low_stock", "out_of_stock"].includes(p.availability) ? p.availability : "in_stock",
      deliveryDays: typeof p.deliveryDays === "number" ? p.deliveryDays : 3,
      imageUrl: "/placeholder.svg",
      url: supplierSearchUrls[supplier] || `https://www.google.com/search?q=${searchQuery}+${supplier.replace(/\s+/g, "+")}`,
      rating: typeof p.rating === "number" ? p.rating : 4.0,
      source: "ai_generated",
    };
  });
}

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

    // Fetch eBay and AI results in parallel
    const EBAY_APP_ID = Deno.env.get("EBAY_APP_ID");
    const [ebayResults, aiResults] = await Promise.all([
      EBAY_APP_ID ? getEbayResults(query, EBAY_APP_ID).catch((err) => {
        console.error("eBay fetch failed:", err);
        return [] as any[];
      }) : Promise.resolve([] as any[]),
      getAIResults(query, LOVABLE_API_KEY),
    ]);

    // Combine: eBay first, then AI-generated
    const results = [...ebayResults, ...aiResults];

    return new Response(
      JSON.stringify({ results, ebayCount: ebayResults.length, aiCount: aiResults.length }),
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
