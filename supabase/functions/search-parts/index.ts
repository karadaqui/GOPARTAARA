const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const EBAY_API_URL = "https://svcs.ebay.com/services/search/FindingService/v1";
const EBAY_AFFILIATE_CAMPID = "5339148333";

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
});

// Simple in-memory cache to avoid hitting eBay rate limits
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  // Limit cache size
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithRetry(url: string, retries = 2, delayMs = 2000): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response;

    const text = await response.text();

    // If rate limited, wait and retry
    if (response.status === 500 && text.includes("RateLimiter") && attempt < retries) {
      console.warn(`eBay rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delayMs));
      delayMs *= 2; // exponential backoff
      continue;
    }

    // Non-retryable error
    console.error("eBay API error:", response.status, text);
    return new Response(text, { status: response.status, statusText: response.statusText });
  }
  // Should not reach here, but just in case
  return new Response("Max retries exceeded", { status: 503 });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const EBAY_APP_ID = Deno.env.get("EBAY_APP_ID");
    if (!EBAY_APP_ID) {
      return new Response(
        JSON.stringify({ error: "EBAY_APP_ID is not configured" }),
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

    const { query, category } = parsed.data;
    const searchQuery = category ? `${query} ${category}` : query;

    // Check cache first
    const cacheKey = searchQuery.toLowerCase().trim();
    const cached = getCached(cacheKey);
    if (cached) {
      console.log("Cache hit for:", cacheKey);
      return new Response(
        JSON.stringify(cached),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = new URLSearchParams({
      "OPERATION-NAME": "findItemsAdvanced",
      "SERVICE-VERSION": "1.0.0",
      "SECURITY-APPNAME": EBAY_APP_ID,
      "RESPONSE-DATA-FORMAT": "JSON",
      "REST-PAYLOAD": "",
      "keywords": searchQuery,
      "categoryId": "6030",
      "paginationInput.entriesPerPage": "12",
      "sortOrder": "BestMatch",
      "affiliate.trackingId": EBAY_AFFILIATE_CAMPID,
      "affiliate.networkId": "9",
      "outputSelector(0)": "SellerInfo",
      "outputSelector(1)": "PictureURLLarge",
      "outputSelector(2)": "PictureURLSuperSize",
    });

    const response = await fetchWithRetry(`${EBAY_API_URL}?${params.toString()}`);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `eBay search failed [${response.status}]`, results: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const searchResult = data?.findItemsAdvancedResponse?.[0]?.searchResult?.[0];
    const items = searchResult?.item || [];
    const totalResults = parseInt(searchResult?.["@count"] || "0", 10);

    const results = items.map((item: any, i: number) => {
      const price = parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || "0");
      const condition = item.condition?.[0]?.conditionDisplayName?.[0] || "Not specified";
      const shippingInfo = item.shippingInfo?.[0] || {};
      const shippingCost = parseFloat(shippingInfo.shippingServiceCost?.[0]?.__value__ || "0");
      const shippingType = shippingInfo.shippingType?.[0] || "";
      const freeShipping = shippingCost === 0 || shippingType === "Free";
      const shipToLocations = shippingInfo.shipToLocations || [];
      const shipsToUK = shipToLocations.includes("GB") || shipToLocations.includes("Worldwide") || shipToLocations.length === 0;
      const handlingTime = parseInt(shippingInfo.handlingTime?.[0] || "3", 10);
      const expedited = shippingInfo.expeditedShipping?.[0] === "true";

      const pictureURLLarge = item.pictureURLLarge?.[0];
      const pictureURLSuperSize = item.pictureURLSuperSize?.[0];
      const galleryURL = item.galleryURL?.[0] || "";
      const upgradedGallery = galleryURL.replace("s-l140", "s-l500");
      const imageUrl = pictureURLSuperSize || pictureURLLarge || upgradedGallery || "/placeholder.svg";

      const viewItemUrl = item.viewItemURL?.[0] || "";
      const affiliateUrl = viewItemUrl
        ? `https://rover.ebay.com/rover/1/710-53481-19255-0/1?campid=${EBAY_AFFILIATE_CAMPID}&toolid=10001&customid=partara&mpre=${encodeURIComponent(viewItemUrl)}`
        : viewItemUrl;

      const sellerInfo = item.sellerInfo?.[0] || {};
      const sellerUsername = sellerInfo.sellerUserName?.[0] || "Unknown Seller";
      const sellerFeedbackScore = parseInt(sellerInfo.feedbackScore?.[0] || "0", 10);
      const sellerPositivePercent = parseFloat(sellerInfo.positiveFeedbackPercent?.[0] || "0");
      const topRatedSeller = sellerInfo.topRatedSeller?.[0] === "true";

      const itemLocation = item.location?.[0] || "Unknown";
      const itemCountry = item.country?.[0] || "GB";

      const listingType = item.listingInfo?.[0]?.listingType?.[0] || "FixedPrice";
      const endTime = item.listingInfo?.[0]?.endTime?.[0] || null;
      const watchCount = parseInt(item.listingInfo?.[0]?.watchCount?.[0] || "0", 10);

      return {
        id: item.itemId?.[0] || `ebay-${i}-${Date.now()}`,
        partName: item.title?.[0] || "Unknown Part",
        partNumber: item.itemId?.[0] || `EBAY-${i}`,
        price,
        condition,
        imageUrl,
        url: affiliateUrl || viewItemUrl,
        freeShipping,
        shippingCost: freeShipping ? 0 : shippingCost,
        shipsToUK,
        handlingTime,
        expedited,
        sellerUsername,
        sellerFeedbackScore,
        sellerPositivePercent,
        topRatedSeller,
        itemLocation,
        itemCountry,
        listingType,
        endTime,
        watchCount,
      };
    });

    const responseData = { results, totalResults };

    // Cache successful results
    setCache(cacheKey, responseData);

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg, results: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
