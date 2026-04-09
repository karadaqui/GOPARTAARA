const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const EBAY_BROWSE_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_AFFILIATE_CAMPID = "5339148333";

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  offset: z.number().int().min(0).max(10000).optional(),
});

// --- OAuth 2.0 token cache ---
let oauthToken: { token: string; expiresAt: number } | null = null;

async function getOAuthToken(appId: string, certId: string): Promise<string> {
  if (oauthToken && Date.now() < oauthToken.expiresAt - 60_000) {
    console.log("[OAuth] Using cached token");
    return oauthToken.token;
  }

  console.log("[OAuth] Requesting new token...");
  const credentials = btoa(`${appId}:${certId}`);
  const response = await fetch(EBAY_OAUTH_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });

  const text = await response.text();
  console.log("[OAuth] Response status:", response.status);

  if (!response.ok) {
    console.error("[OAuth] Token error body:", text);
    throw new Error(`Failed to get OAuth token: ${response.status} - ${text}`);
  }

  const data = JSON.parse(text);
  console.log("[OAuth] Token obtained, expires_in:", data.expires_in);
  oauthToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
  return oauthToken.token;
}

// --- In-memory cache — 10 minute TTL ---
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  if (cache.size > 300) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const EBAY_APP_ID = Deno.env.get("EBAY_APP_ID");
    const EBAY_CERT_ID = Deno.env.get("EBAY_CERT_ID");
    if (!EBAY_APP_ID || !EBAY_CERT_ID) {
      console.error("[search-parts] Missing credentials - APP_ID:", !!EBAY_APP_ID, "CERT_ID:", !!EBAY_CERT_ID);
      return json({ error: "eBay credentials not configured", results: [], fallback: true });
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors, results: [] }, 400);
    }

    const { query, category } = parsed.data;
    const searchQuery = category ? `${query} ${category}` : query;
    const cacheKey = searchQuery.toLowerCase().trim();
    console.log("[search-parts] Query:", searchQuery);

    const cached = getCached(cacheKey);
    if (cached) {
      console.log("[search-parts] Cache hit for:", cacheKey);
      return json(cached);
    }

    // Get OAuth token
    let token: string;
    try {
      token = await getOAuthToken(EBAY_APP_ID, EBAY_CERT_ID);
    } catch (e) {
      console.error("[search-parts] OAuth error:", e);
      return json({ error: "SERVICE_AUTH_FAILED", results: [], fallback: true });
    }

    // Build Browse API URL - use category 6030 (Car Parts & Accessories)
    // and also try without category restriction for broader results
    const params = new URLSearchParams({
      q: searchQuery,
      category_ids: "6030",
      limit: "12",
      fieldgroups: "MATCHING_ITEMS",
    });

    const apiUrl = `${EBAY_BROWSE_API_URL}?${params.toString()}`;
    console.log("[search-parts] Request URL:", apiUrl);

    const requestHeaders: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
      "X-EBAY-C-ENDUSERCTX": `affiliateCampaignId=${EBAY_AFFILIATE_CAMPID},affiliateReferenceId=partara`,
    };

    // Direct fetch with full logging instead of fetchWithRetry
    const apiResponse = await fetch(apiUrl, { headers: requestHeaders });
    const responseText = await apiResponse.text();
    console.log("[search-parts] API status:", apiResponse.status);
    console.log("[search-parts] API response (first 500 chars):", responseText.substring(0, 500));

    if (!apiResponse.ok) {
      console.error("[search-parts] API error full response:", responseText);
      
      // If category 6030 fails, try without category
      if (apiResponse.status === 400 || apiResponse.status === 404) {
        console.log("[search-parts] Retrying without category restriction...");
        const fallbackParams = new URLSearchParams({
          q: searchQuery,
          limit: "12",
          fieldgroups: "MATCHING_ITEMS",
          filter: "categoryIds:{6030|6028|33612|174016}",
        });
        const fallbackUrl = `${EBAY_BROWSE_API_URL}?${fallbackParams.toString()}`;
        console.log("[search-parts] Fallback URL:", fallbackUrl);
        
        const fallbackResponse = await fetch(fallbackUrl, { headers: requestHeaders });
        const fallbackText = await fallbackResponse.text();
        console.log("[search-parts] Fallback status:", fallbackResponse.status);
        console.log("[search-parts] Fallback response (first 500 chars):", fallbackText.substring(0, 500));
        
        if (!fallbackResponse.ok) {
          return json({
            results: [],
            totalResults: 0,
            fallback: true,
            error: "SERVICE_UNAVAILABLE",
            debug: { status: fallbackResponse.status, message: fallbackText.substring(0, 200) },
          });
        }
        
        const fallbackData = JSON.parse(fallbackText);
        return processAndReturn(fallbackData, cacheKey, json);
      }

      if (apiResponse.status === 429) {
        return json({ results: [], totalResults: 0, fallback: true, error: "SERVICE_RATE_LIMITED" });
      }

      return json({
        results: [],
        totalResults: 0,
        fallback: true,
        error: "SERVICE_UNAVAILABLE",
        debug: { status: apiResponse.status, message: responseText.substring(0, 200) },
      });
    }

    const data = JSON.parse(responseText);
    return processAndReturn(data, cacheKey, json);
  } catch (error) {
    console.error("[search-parts] Unhandled error:", error);
    return json({
      error: "SERVICE_FAILED",
      fallback: true,
      results: [],
      totalResults: 0,
    });
  }
});

function processAndReturn(
  data: any,
  cacheKey: string,
  json: (data: any, status?: number) => Response
): Response {
  const items = data?.itemSummaries || [];
  const totalResults = data?.total || 0;
  console.log("[search-parts] Items found:", items.length, "Total:", totalResults);

  const results = items.map((item: any, i: number) => {
    const price = parseFloat(item.price?.value || "0");
    const condition = item.condition || "Not specified";
    const imageUrl = item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || "/placeholder.svg";

    const shippingCost = parseFloat(item.shippingOptions?.[0]?.shippingCost?.value || "0");
    const shippingType = item.shippingOptions?.[0]?.shippingCostType || "";
    const freeShipping = shippingCost === 0 || (shippingType === "FIXED" && shippingCost === 0);

    const itemUrl = item.itemAffiliateWebUrl || item.itemWebUrl || "";

    const sellerUsername = item.seller?.username || "Unknown Seller";
    const sellerFeedbackScore = item.seller?.feedbackScore || 0;
    const sellerPositivePercent = parseFloat(item.seller?.feedbackPercentage || "0");
    const topRatedSeller = item.topRatedBuyingExperience === true;

    const itemLocation = item.itemLocation?.city || item.itemLocation?.country || "Unknown";
    const itemCountry = item.itemLocation?.country || "GB";

    const listingType = item.buyingOptions?.includes("AUCTION") ? "Auction" : "FixedPrice";

    // Stock / availability
    const quantityAvailable = item.estimatedAvailabilities?.[0]?.estimatedAvailableQuantity || null;
    const availabilityStatus = item.estimatedAvailabilities?.[0]?.availabilityThresholdType || null;

    return {
      id: item.itemId || `ebay-${i}-${Date.now()}`,
      partName: item.title || "Unknown Part",
      partNumber: item.itemId || `EBAY-${i}`,
      price,
      condition,
      imageUrl,
      url: itemUrl,
      freeShipping,
      shippingCost: freeShipping ? 0 : shippingCost,
      shipsToUK: true,
      handlingTime: 3,
      expedited: false,
      sellerUsername,
      sellerFeedbackScore,
      sellerPositivePercent,
      topRatedSeller,
      itemLocation,
      itemCountry,
      listingType,
      endTime: null,
      watchCount: item.watchCount || 0,
      quantityAvailable,
      availabilityStatus,
    };
  });

  const responseData = { results, totalResults };
  setCache(cacheKey, responseData);
  return json(responseData);
}
