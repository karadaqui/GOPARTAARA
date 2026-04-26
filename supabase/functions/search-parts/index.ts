import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse, validateJWT, logSecurityEvent, checkRequestSize } from "../_shared/security.ts";

const EBAY_BROWSE_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_AFFILIATE_CAMPID = "5339148333";

const FREE_LIMIT = 10;
const UNLIMITED_PLANS = ["pro", "elite", "admin"];

const VALID_MARKETPLACES = ["EBAY_GB", "EBAY_DE", "EBAY_FR", "EBAY_IT", "EBAY_ES", "EBAY_AU", "EBAY_US", "EBAY_ENCA"];

const CONDITION_MAP: Record<string, string> = {
  "New": "1000",
  "Used": "3000",
  "Refurbished": "2500",
  "For parts": "7000",
};

const SORT_MAP: Record<string, string> = {
  "price_asc": "price",
  "price_desc": "-price",
  "newly_listed": "newlyListed",
  "top_rated": "price",  // eBay Browse API doesn't have a "top rated" sort; fallback
  "best_match": "",
};

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  offset: z.number().int().min(0).optional().default(0).transform((v) => Math.min(v, 9999)),
  marketplace: z.string().max(20).optional(),
  conditionFilter: z.string().max(50).optional(),
  shippingFilter: z.string().max(50).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  sortBy: z.string().max(50).optional(),
  categoryFilter: z.string().max(100).optional(),
  brandFilter: z.string().max(100).optional(),
  skipCredit: z.boolean().optional(),
});

let oauthToken: { token: string; expiresAt: number } | null = null;

async function getOAuthToken(appId: string, certId: string): Promise<string> {
  // Use cached token if still valid (with 60s safety margin)
  if (oauthToken && Date.now() < oauthToken.expiresAt - 60_000) {
    console.log(`[search-parts] Using cached eBay OAuth token (expires in ${Math.round((oauthToken.expiresAt - Date.now()) / 1000)}s)`);
    return oauthToken.token;
  }

  console.log(`[search-parts] Requesting new eBay OAuth token (appId prefix: ${appId.substring(0, 12)}..., certId length: ${certId.length})`);
  const credentials = btoa(`${appId}:${certId}`);

  let response: Response;
  try {
    response = await fetch(EBAY_OAUTH_URL, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    });
  } catch (networkErr) {
    // Don't cache on network failure — let next call retry
    oauthToken = null;
    console.error(`[search-parts] OAuth network error:`, networkErr);
    throw new Error(`OAuth network error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`);
  }

  const text = await response.text();
  if (!response.ok) {
    oauthToken = null;
    console.error(`[search-parts] eBay OAuth failed: status=${response.status}, body=${text}`);
    throw new Error(`OAuth failed: ${response.status} - ${text}`);
  }

  const data = JSON.parse(text);
  if (!data.access_token) {
    oauthToken = null;
    console.error(`[search-parts] eBay OAuth response missing access_token: ${text}`);
    throw new Error(`OAuth response missing access_token`);
  }

  oauthToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) };
  console.log(`[search-parts] Got new eBay OAuth token (length: ${data.access_token.length}, expires in ${data.expires_in}s)`);
  return oauthToken.token;
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) return entry.data;
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
  const corsHeaders = {
    ...getCorsHeaders(req),
    "X-RateLimit-Limit": "30",
    "X-RateLimit-Window": "60s",
  };

  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  const sizeCheck = checkRequestSize(req, 524_288);
  if (sizeCheck) return sizeCheck;

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(clientIp, "search-parts");
  if (!allowed) {
    await logSecurityEvent("rate_limit_exceeded", req, undefined, "search-parts", { ip: clientIp });
    return rateLimitResponse(corsHeaders);
  }

  const auth = await validateJWT(req, corsHeaders);
  if (auth.error) {
    await logSecurityEvent("unauthenticated_access", req, undefined, "search-parts");
    return auth.error;
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("subscription_plan, bonus_searches")
    .eq("user_id", auth.userId)
    .single();

  const plan = profile?.subscription_plan || "free";
  const bonusSearches = profile?.bonus_searches || 0;
  const isUnlimited = UNLIMITED_PLANS.includes(plan);

  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten().fieldErrors, results: [] }, 400, corsHeaders);
    }

    const { query, category, offset, marketplace, conditionFilter, shippingFilter, priceMin, priceMax, sortBy, categoryFilter, brandFilter, skipCredit } = parsed.data;
    const ebayMarketplace = (marketplace && VALID_MARKETPLACES.includes(marketplace)) ? marketplace : "EBAY_GB";

    // ── Server-side enforced search limit (using search_usage table) ──
    // Only counts NEW searches (offset === 0, not pagination, not skipCredit)
    const shouldCountSearch = offset === 0 && !skipCredit;

    if (!isUnlimited && shouldCountSearch) {
      const now = new Date();
      const monthYear = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
      const totalAllowed = FREE_LIMIT + bonusSearches;

      const { data: usageRow } = await supabaseAdmin
        .from("search_usage")
        .select("search_count")
        .eq("user_id", auth.userId)
        .eq("month_year", monthYear)
        .maybeSingle();

      const currentCount = usageRow?.search_count || 0;

      if (currentCount >= totalAllowed) {
        await logSecurityEvent("search_limit_exceeded", req, auth.userId, "search-parts", { currentCount, totalAllowed });

        // Compute first day of next month for reset display
        const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

        return jsonResponse({
          error: "SEARCH_LIMIT_REACHED",
          message: `You've used all ${totalAllowed} free searches this month. Upgrade to Pro for unlimited searches.`,
          upgradeUrl: "/pricing",
          remaining: 0,
          searchCount: currentCount,
          totalAllowed,
          resetsAt: nextMonth.toISOString(),
        }, 429, corsHeaders);
      }

      // Increment count atomically (upsert with new total)
      const newCount = currentCount + 1;
      await supabaseAdmin
        .from("search_usage")
        .upsert(
          { user_id: auth.userId, month_year: monthYear, search_count: newCount, updated_at: new Date().toISOString() },
          { onConflict: "user_id,month_year" }
        );
    }

    // Build search query with category/brand appended
    let searchQuery = query;
    if (category) searchQuery += ` ${category}`;
    if (categoryFilter && categoryFilter !== "All Parts") searchQuery += ` ${categoryFilter}`;
    if (brandFilter && brandFilter !== "All") searchQuery += ` ${brandFilter}`;

    // Build eBay filter string
    const filterParts: string[] = [];

    if (conditionFilter && conditionFilter !== "All" && CONDITION_MAP[conditionFilter]) {
      filterParts.push(`conditionIds:{${CONDITION_MAP[conditionFilter]}}`);
    }

    if (shippingFilter === "Free Shipping") {
      filterParts.push("maxDeliveryCost:0");
    }
    if (shippingFilter === "Fast") {
      filterParts.push("guaranteedDeliveryInDays:[1..5]");
    }

    if (priceMin !== undefined && priceMax !== undefined && priceMax > 0) {
      const currency = ebayMarketplace === "EBAY_US" ? "USD" : ebayMarketplace === "EBAY_DE" || ebayMarketplace === "EBAY_FR" || ebayMarketplace === "EBAY_ES" || ebayMarketplace === "EBAY_IT" ? "EUR" : ebayMarketplace === "EBAY_AU" ? "AUD" : ebayMarketplace === "EBAY_ENCA" ? "CAD" : "GBP";
      filterParts.push(`price:[${priceMin}..${priceMax}],priceCurrency:${currency}`);
    } else if (priceMin !== undefined && priceMin > 0) {
      const currency = ebayMarketplace === "EBAY_US" ? "USD" : ebayMarketplace === "EBAY_DE" || ebayMarketplace === "EBAY_FR" || ebayMarketplace === "EBAY_ES" || ebayMarketplace === "EBAY_IT" ? "EUR" : ebayMarketplace === "EBAY_AU" ? "AUD" : ebayMarketplace === "EBAY_ENCA" ? "CAD" : "GBP";
      filterParts.push(`price:[${priceMin}..],priceCurrency:${currency}`);
    }

    // Build cache key including filters
    const cacheKey = `${ebayMarketplace}:${searchQuery.toLowerCase().trim()}:${offset || 0}:${conditionFilter || ""}:${shippingFilter || ""}:${priceMin || 0}:${priceMax || 0}:${sortBy || ""}`;

    const cached = getCached(cacheKey);
    if (cached) return jsonResponse(cached, 200, corsHeaders);

    // Record search atomically (only first page, only when no filters applied, and not skipped)
    if (offset === 0 && !conditionFilter && !shippingFilter && !priceMin && !sortBy && !categoryFilter && !brandFilter && !skipCredit) {
      try {
        await supabaseAdmin.from("search_history").insert({
          user_id: auth.userId,
          query: query,
        });
      } catch (e) {
        console.warn("[search-parts] search_history insert failed, continuing:", e);
      }
    }

    const EBAY_APP_ID = Deno.env.get("EBAY_APP_ID");
    const EBAY_CERT_ID = Deno.env.get("EBAY_CERT_ID");
    if (!EBAY_APP_ID || !EBAY_CERT_ID) {
      return jsonResponse({ error: "eBay credentials not configured", results: [], fallback: true }, 200, corsHeaders);
    }

    let token: string;
    try {
      token = await getOAuthToken(EBAY_APP_ID, EBAY_CERT_ID);
    } catch (e) {
      console.error("[search-parts] OAuth error:", e);
      return jsonResponse({ error: "SERVICE_AUTH_FAILED", results: [], fallback: true }, 200, corsHeaders);
    }

    const params = new URLSearchParams({
      q: searchQuery, category_ids: "6030", limit: "12",
      offset: String(offset || 0), fieldgroups: "MATCHING_ITEMS",
    });

    // Add filter param
    if (filterParts.length > 0) {
      params.set("filter", filterParts.join(","));
    }

    // Add sort param
    const ebaySort = sortBy ? SORT_MAP[sortBy] : "";
    if (ebaySort) {
      params.set("sort", ebaySort);
    }

    const requestHeaders: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": ebayMarketplace,
      "X-EBAY-C-ENDUSERCTX": `affiliateCampaignId=${EBAY_AFFILIATE_CAMPID},affiliateReferenceId=partara`,
    };

    const apiResponse = await fetch(`${EBAY_BROWSE_API_URL}?${params.toString()}`, { headers: requestHeaders });
    const responseText = await apiResponse.text();

    if (!apiResponse.ok) {
      if (apiResponse.status === 400 || apiResponse.status === 404) {
        const fallbackParams = new URLSearchParams({
          q: searchQuery, limit: "12", fieldgroups: "MATCHING_ITEMS",
          filter: "categoryIds:{6030|6028|33612|174016}",
        });
        const fallbackResponse = await fetch(`${EBAY_BROWSE_API_URL}?${fallbackParams.toString()}`, { headers: requestHeaders });
        const fallbackText = await fallbackResponse.text();
        if (!fallbackResponse.ok) {
          return jsonResponse({ results: [], totalResults: 0, fallback: true, error: "SERVICE_UNAVAILABLE" }, 200, corsHeaders);
        }
        return processAndReturn(JSON.parse(fallbackText), cacheKey, corsHeaders);
      }
      if (apiResponse.status === 429) {
        return jsonResponse({ results: [], totalResults: 0, fallback: true, error: "SERVICE_RATE_LIMITED" }, 200, corsHeaders);
      }
      return jsonResponse({ results: [], totalResults: 0, fallback: true, error: "SERVICE_UNAVAILABLE" }, 200, corsHeaders);
    }

    return processAndReturn(JSON.parse(responseText), cacheKey, corsHeaders);
  } catch (error) {
    console.error("[search-parts] Unhandled error:", error);
    return jsonResponse({ error: "SERVICE_FAILED", fallback: true, results: [], totalResults: 0 }, 200, corsHeaders);
  }
});

// Normalize non-English condition labels to English
function normalizeCondition(condition: string): string {
  const c = condition.trim();
  const lower = c.toLowerCase();
  // German
  if (lower === "neu") return "New";
  if (lower === "gebraucht") return "Used";
  // French
  if (lower === "neuf") return "New";
  if (lower === "occasion") return "Used";
  if (lower === "nouveau") return "New";
  // Spanish
  if (lower === "nuevo") return "New";
  // Italian
  if (lower === "nuovo") return "New";
  if (lower === "usato") return "Used";
  // Polish
  if (lower === "nowy") return "New";
  if (lower === "używany") return "Used";
  return c;
}

function processAndReturn(data: any, cacheKey: string, corsHeaders: Record<string, string>): Response {
  const items = data?.itemSummaries || [];
  const totalResults = data?.total || 0;

  const results = items.map((item: any, i: number) => ({
    id: item.itemId || `ebay-${i}-${Date.now()}`,
    partName: item.title || "Unknown Part",
    partNumber: item.itemId || `EBAY-${i}`,
    price: parseFloat(item.price?.value || "0"),
    condition: normalizeCondition(item.condition || "Not specified"),
    imageUrl: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || "/placeholder.svg",
    url: item.itemAffiliateWebUrl || item.itemWebUrl || "",
    freeShipping: parseFloat(item.shippingOptions?.[0]?.shippingCost?.value || "0") === 0,
    shippingCost: parseFloat(item.shippingOptions?.[0]?.shippingCost?.value || "0"),
    shipsToUK: true, handlingTime: 3, expedited: false,
    sellerUsername: item.seller?.username || "Unknown Seller",
    sellerFeedbackScore: item.seller?.feedbackScore || 0,
    sellerPositivePercent: parseFloat(item.seller?.feedbackPercentage || "0"),
    topRatedSeller: item.topRatedBuyingExperience === true,
    itemLocation: item.itemLocation?.city || item.itemLocation?.country || "Unknown",
    itemCountry: item.itemLocation?.country || "GB",
    listingType: item.buyingOptions?.includes("AUCTION") ? "Auction" : "FixedPrice",
    endTime: null,
    watchCount: item.watchCount || 0,
    quantityAvailable: item.estimatedAvailabilities?.[0]?.estimatedAvailableQuantity || null,
    availabilityStatus: item.estimatedAvailabilities?.[0]?.availabilityThresholdType || null,
  }));

  const responseData = { results, totalResults };
  setCache(cacheKey, responseData);
  return jsonResponse(responseData, 200, corsHeaders);
}
