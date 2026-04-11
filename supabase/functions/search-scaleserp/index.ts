import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders, corsPreflightResponse, jsonResponse } from "../_shared/security.ts";

// In-memory cache (15-min TTL)
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "UNAUTHORIZED" }, 401, corsHeaders);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "UNAUTHORIZED" }, 401, corsHeaders);
    }

    // Parse & validate input
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.replace(/<[^>]*>/g, "").trim().slice(0, 200) : "";
    if (!query) {
      return jsonResponse({ results: [] }, 200, corsHeaders);
    }

    // Check cache
    const cacheKey = query.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return jsonResponse({ results: cached.data }, 200, corsHeaders);
    }

    // Call ScaleSERP
    const apiKey = Deno.env.get("SCALESERP_API_KEY");
    if (!apiKey) {
      console.error("[search-scaleserp] SCALESERP_API_KEY not set");
      return jsonResponse({ results: [] }, 200, corsHeaders);
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      search_type: "shopping",
      q: query,
      num: "8",
      gl: "uk",
      hl: "en",
    });

    const resp = await fetch(`https://api.scaleserp.com/search?${params.toString()}`);
    if (!resp.ok) {
      console.error("[search-scaleserp] API error:", resp.status);
      return jsonResponse({ results: [] }, 200, corsHeaders);
    }

    const data = await resp.json();
    const shoppingResults = data?.shopping_results || [];

    const simplified = shoppingResults.slice(0, 8).map((item: any) => ({
      title: item.title || "",
      price: item.price || null,
      source: item.source || item.merchant?.name || "",
      link: item.link || "",
      image: item.thumbnail || item.image || "",
      rating: item.rating || null,
    }));

    // Update cache
    cache.set(cacheKey, { data: simplified, ts: Date.now() });

    // Prune old cache entries
    if (cache.size > 200) {
      const now = Date.now();
      for (const [k, v] of cache) {
        if (now - v.ts > CACHE_TTL) cache.delete(k);
      }
    }

    return jsonResponse({ results: simplified }, 200, corsHeaders);
  } catch (err) {
    console.error("[search-scaleserp] Error:", err);
    return jsonResponse({ results: [] }, 200, corsHeaders);
  }
});
