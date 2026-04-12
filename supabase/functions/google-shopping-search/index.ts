import { getCorsHeaders, corsPreflightResponse, jsonResponse } from "../_shared/security.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

    const body = await req.json();
    const rawQuery = typeof body?.query === "string" ? body.query.replace(/<[^>]*>/g, "").trim().slice(0, 200) : "";
    const country = typeof body?.country === "string" ? body.country.slice(0, 10) : "uk";

    if (!rawQuery) {
      return jsonResponse({ results: [] }, 200, corsHeaders);
    }

    const lq = rawQuery.toLowerCase();
    const hasCarContext = ["part", "car", "auto", "vehicle", "motor", "brake", "engine", "filter", "exhaust", "clutch", "suspension", "radiator", "alternator", "turbo", "bumper", "headlight", "wiper"].some(k => lq.includes(k));
    const query = hasCarContext ? rawQuery : `${rawQuery} car part`;

    const apiKey = Deno.env.get("SCALESERP_API_KEY");
    if (!apiKey) {
      console.error("[google-shopping-search] SCALESERP_API_KEY not set");
      return jsonResponse({ results: [] }, 200, corsHeaders);
    }

    const params = new URLSearchParams({
      api_key: apiKey,
      search_type: "shopping",
      q: query,
      google_domain: "google.co.uk",
      gl: country,
      hl: "en",
      num: "10",
      tbs: "mr:1",
    });

    const url = `https://api.scaleserp.com/search?${params.toString()}`;
    console.log("[google-shopping-search] Fetching:", url.replace(apiKey, "***"));

    const resp = await fetch(url);
    if (!resp.ok) {
      const errBody = await resp.text();
      console.error("[google-shopping-search] API error:", resp.status, errBody);
      return jsonResponse({ results: [] }, 200, corsHeaders);
    }

    const data = await resp.json();
    const shoppingResults = data?.shopping_results || [];

    const results = shoppingResults.slice(0, 10).map((item: any, idx: number) => ({
      id: idx,
      title: item.title || "",
      price: item.price || null,
      source: item.source || item.merchant?.name || "",
      source_icon: item.source_icon || item.merchant?.favicon || null,
      link: item.link || "",
      product_page_url: item.product_page_url || item.url || null,
      url: item.url || null,
      thumbnail: item.thumbnail || item.image || "",
      image: item.thumbnail || item.image || "",
      rating: item.rating || null,
      reviews: item.reviews || null,
      delivery: item.delivery || item.shipping || null,
      extensions: Array.isArray(item.extensions) ? item.extensions : [],
      type: "google_shopping",
    }));

    console.log("[google-shopping-search] Returned", results.length, "results");

    return jsonResponse({ results }, 200, corsHeaders);
  } catch (err) {
    console.error("[google-shopping-search] Error:", err);
    return jsonResponse({ results: [] }, 200, corsHeaders);
  }
});
