import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { getCorsHeaders, corsPreflightResponse, jsonResponse, validateJWT, logSecurityEvent, checkRequestSize } from "../_shared/security.ts";

const EBAY_BROWSE_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_AFFILIATE_CAMPID = "5339148333";

const FREE_LIMIT = 5;
const UNLIMITED_PLANS = ["pro", "elite", "admin"];

const VALID_MARKETPLACES = ["EBAY_GB", "EBAY_DE", "EBAY_FR", "EBAY_IT", "EBAY_ES", "EBAY_AU", "EBAY_US", "EBAY_ENCA"];

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  offset: z.number().int().min(0).optional().default(0).transform((v) => Math.min(v, 9999)),
  marketplace: z.string().max(20).optional(),
});

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
  const text = await response.text();
  if (!response.ok) throw new Error(`OAuth failed: ${response.status} - ${text}`);
  const data = JSON.parse(text);
  oauthToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) };
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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  // Request size limit (512KB for search)
  const sizeCheck = checkRequestSize(req, 524_288);
  if (sizeCheck) return sizeCheck;

  // Rate limit by IP (30/min)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = await checkRateLimit(clientIp, "search-parts");
  if (!allowed) {
    await logSecurityEvent("rate_limit_exceeded", req, undefined, "search-parts", { ip: clientIp });
    return rateLimitResponse(corsHeaders);
  }

  // JWT validation (mandatory)
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

  // Check search limits from DB (never trust frontend)
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

    const { query, category, offset, marketplace } = parsed.data;
    const ebayMarketplace = (marketplace && VALID_MARKETPLACES.includes(marketplace)) ? marketplace : "EBAY_GB";

    // Check monthly limit for non-unlimited plans (only on first page)
    if (!isUnlimited && offset === 0) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabaseAdmin
        .from("search_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", auth.userId)
        .gte("created_at", startOfMonth.toISOString());

      const totalAllowed = FREE_LIMIT + bonusSearches;
      if ((count || 0) >= totalAllowed) {
        await logSecurityEvent("search_limit_exceeded", req, auth.userId, "search-parts", { count, totalAllowed });
        return jsonResponse({
          error: "SEARCH_LIMIT_REACHED",
          message: `You've used all ${totalAllowed} searches this month. Upgrade to Pro for unlimited searches.`,
          remaining: 0,
        }, 403, corsHeaders);
      }
    }

    const searchQuery = category ? `${query} ${category}` : query;
    const cacheKey = `${ebayMarketplace}:${searchQuery.toLowerCase().trim()}:${offset || 0}`;

    const cached = getCached(cacheKey);
    if (cached) return jsonResponse(cached, 200, corsHeaders);

    // Record search atomically (only first page)
    if (offset === 0) {
      await supabaseAdmin.from("search_history").insert({
        user_id: auth.userId,
        query: query,
      });
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

function processAndReturn(data: any, cacheKey: string, corsHeaders: Record<string, string>): Response {
  const items = data?.itemSummaries || [];
  const totalResults = data?.total || 0;

  const results = items.map((item: any, i: number) => ({
    id: item.itemId || `ebay-${i}-${Date.now()}`,
    partName: item.title || "Unknown Part",
    partNumber: item.itemId || `EBAY-${i}`,
    price: parseFloat(item.price?.value || "0"),
    condition: item.condition || "Not specified",
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
