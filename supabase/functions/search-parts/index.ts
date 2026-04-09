import { corsHeaders } from "@supabase/supabase-js/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const EBAY_BROWSE_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_AFFILIATE_CAMPID = "5339148333";

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
});

// --- OAuth 2.0 token cache ---
let oauthToken: { token: string; expiresAt: number } | null = null;

async function getOAuthToken(appId: string, certId: string): Promise<string> {
  if (oauthToken && Date.now() < oauthToken.expiresAt - 60_000) {
    return oauthToken.token;
  }

  const credentials = btoa(`${appId}:${certId}`);
  const response = await fetch(EBAY_OAUTH_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OAuth token error:", response.status, text);
    throw new Error(`Failed to get OAuth token: ${response.status}`);
  }

  const data = await response.json();
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

// --- Fetch with retry for rate limits ---
async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries = 2,
  delayMs = 2000
): Promise<{ response: Response | null; rateLimited: boolean }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, { headers });
    if (response.ok) return { response, rateLimited: false };

    if (response.status === 429 && attempt < retries) {
      console.warn(`eBay rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs *= 2;
      continue;
    }

    if (response.status === 429) {
      console.error("eBay rate limited after all retries");
      return { response: null, rateLimited: true };
    }

    const text = await response.text();
    console.error("eBay Browse API error:", response.status, text);
    return { response: null, rateLimited: false };
  }
  return { response: null, rateLimited: true };
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

    const cached = getCached(cacheKey);
    if (cached) {
      console.log("Cache hit for:", cacheKey);
      return json(cached);
    }

    // Get OAuth token
    let token: string;
    try {
      token = await getOAuthToken(EBAY_APP_ID, EBAY_CERT_ID);
    } catch (e) {
      console.error("OAuth error:", e);
      return json({ error: "SERVICE_AUTH_FAILED", results: [], fallback: true });
    }

    // Build Browse API URL
    const params = new URLSearchParams({
      q: searchQuery,
      category_ids: "9801",
      limit: "12",
      sort: "BEST_MATCH",
      fieldgroups: "MATCHING_ITEMS",
    });

    const apiUrl = `${EBAY_BROWSE_API_URL}?${params.toString()}`;
    const requestHeaders: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
      "X-EBAY-C-ENDUSERCTX": `affiliateCampaignId=${EBAY_AFFILIATE_CAMPID},affiliateReferenceId=partara`,
    };

    const { response, rateLimited } = await fetchWithRetry(apiUrl, requestHeaders);

    if (!response) {
      const fallbackData = {
        results: [],
        totalResults: 0,
        fallback: true,
        error: rateLimited ? "SERVICE_RATE_LIMITED" : "SERVICE_UNAVAILABLE",
      };
      cache.set(cacheKey, { data: fallbackData, timestamp: Date.now() - (CACHE_TTL_MS - 2 * 60 * 1000) });
      return json(fallbackData);
    }

    const data = await response.json();
    const items = data?.itemSummaries || [];
    const totalResults = data?.total || 0;

    const results = items.map((item: any, i: number) => {
      const price = parseFloat(item.price?.value || "0");
      const condition = item.condition || "Not specified";
      const imageUrl = item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || "/placeholder.svg";

      // Shipping info
      const shippingCost = parseFloat(item.shippingOptions?.[0]?.shippingCost?.value || "0");
      const shippingType = item.shippingOptions?.[0]?.shippingCostType || "";
      const freeShipping = shippingCost === 0 || shippingType === "FIXED" && shippingCost === 0;

      // The Browse API enriches URLs with affiliate info via X-EBAY-C-ENDUSERCTX header
      const itemUrl = item.itemAffiliateWebUrl || item.itemWebUrl || "";

      // Seller info
      const sellerUsername = item.seller?.username || "Unknown Seller";
      const sellerFeedbackScore = item.seller?.feedbackScore || 0;
      const sellerPositivePercent = parseFloat(item.seller?.feedbackPercentage || "0");
      const topRatedSeller = item.topRatedBuyingExperience === true;

      const itemLocation = item.itemLocation?.city || item.itemLocation?.country || "Unknown";
      const itemCountry = item.itemLocation?.country || "GB";

      const listingType = item.buyingOptions?.includes("AUCTION") ? "Auction" : "FixedPrice";
      const watchCount = 0; // Not available in Browse API summary

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
        shipsToUK: true, // Filtered by marketplace header
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
        watchCount,
      };
    });

    const responseData = { results, totalResults };
    setCache(cacheKey, responseData);
    return json(responseData);
  } catch (error) {
    console.error("Search error:", error);
    return json({
      error: "SERVICE_FAILED",
      fallback: true,
      results: [],
      totalResults: 0,
    });
  }
});
