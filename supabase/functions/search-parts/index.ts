const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";

const EBAY_BROWSE_API_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_AFFILIATE_CAMPID = "5339148333";

const FREE_LIMIT = 5;
const UNLIMITED_PLANS = ["pro", "elite", "admin"];

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  offset: z.number().int().min(0).optional().default(0).transform((v) => Math.min(v, 9999)),
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

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to get OAuth token: ${response.status} - ${text}`);
  }

  const data = JSON.parse(text);
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

// --- Server-side auth & search limit enforcement ---
async function validateAndCheckLimit(req: Request): Promise<{ userId: string; error?: never } | { userId?: never; error: Response }> {
  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: json({ error: "UNAUTHORIZED", message: "Sign in to search for parts." }, 401) };
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // Validate JWT using getClaims
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    console.error("[search-parts] JWT validation failed:", claimsError?.message);
    return { error: json({ error: "UNAUTHORIZED", message: "Invalid or expired session. Please sign in again." }, 401) };
  }

  const userId = claimsData.claims.sub as string;

  // Check subscription plan & search count from DB (never trust frontend)
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("subscription_plan, bonus_searches")
    .eq("user_id", userId)
    .single();

  const plan = profile?.subscription_plan || "free";
  const bonusSearches = profile?.bonus_searches || 0;

  // Unlimited plans skip the limit
  if (UNLIMITED_PLANS.includes(plan)) {
    return { userId };
  }

  // Count searches this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from("search_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  const totalAllowed = FREE_LIMIT + bonusSearches;
  const used = count || 0;

  if (used >= totalAllowed) {
    return {
      error: json({
        error: "SEARCH_LIMIT_REACHED",
        message: `You've used all ${totalAllowed} searches this month. Upgrade to Pro for unlimited searches.`,
        remaining: 0,
      }, 403),
    };
  }

  return { userId };
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

  // IP-based rate limit (backup defense)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const clientId = req.headers.get("Authorization")?.slice(-20) || clientIp;
  const { allowed } = await checkRateLimit(clientId, "search-parts");
  if (!allowed) return rateLimitResponse(corsHeaders);

  // --- Server-side JWT + search limit enforcement ---
  const authResult = await validateAndCheckLimit(req);
  if (authResult.error) return authResult.error;
  const userId = authResult.userId;

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

    const { query, category, offset } = parsed.data;
    const searchQuery = category ? `${query} ${category}` : query;
    const cacheKey = `${searchQuery.toLowerCase().trim()}:${offset || 0}`;

    const cached = getCached(cacheKey);
    if (cached) {
      // Cached results still count — we already validated the user can search
      return json(cached);
    }

    // Record the search server-side (authoritative source of truth)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Only record for offset=0 (first page of results, not pagination)
    if (offset === 0) {
      await supabaseAdmin.from("search_history").insert({
        user_id: userId,
        query: query,
      });
    }

    // Get OAuth token
    let token: string;
    try {
      token = await getOAuthToken(EBAY_APP_ID, EBAY_CERT_ID);
    } catch (e) {
      console.error("[search-parts] OAuth error:", e);
      return json({ error: "SERVICE_AUTH_FAILED", results: [], fallback: true });
    }

    const params = new URLSearchParams({
      q: searchQuery,
      category_ids: "6030",
      limit: "12",
      offset: String(offset || 0),
      fieldgroups: "MATCHING_ITEMS",
    });

    const apiUrl = `${EBAY_BROWSE_API_URL}?${params.toString()}`;

    const requestHeaders: Record<string, string> = {
      "Authorization": `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
      "X-EBAY-C-ENDUSERCTX": `affiliateCampaignId=${EBAY_AFFILIATE_CAMPID},affiliateReferenceId=partara`,
    };

    const apiResponse = await fetch(apiUrl, { headers: requestHeaders });
    const responseText = await apiResponse.text();

    if (!apiResponse.ok) {
      if (apiResponse.status === 400 || apiResponse.status === 404) {
        const fallbackParams = new URLSearchParams({
          q: searchQuery,
          limit: "12",
          fieldgroups: "MATCHING_ITEMS",
          filter: "categoryIds:{6030|6028|33612|174016}",
        });
        const fallbackUrl = `${EBAY_BROWSE_API_URL}?${fallbackParams.toString()}`;
        const fallbackResponse = await fetch(fallbackUrl, { headers: requestHeaders });
        const fallbackText = await fallbackResponse.text();

        if (!fallbackResponse.ok) {
          return json({
            results: [],
            totalResults: 0,
            fallback: true,
            error: "SERVICE_UNAVAILABLE",
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
