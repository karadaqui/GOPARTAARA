import { getCorsHeaders, corsPreflightResponse, jsonResponse } from "../_shared/security.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return corsPreflightResponse(corsHeaders);

  try {
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
      return jsonResponse({ error: "API key not configured", results: [] }, 200, corsHeaders);
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

    const results = (data?.shopping_results || []).map((item: any) => ({
      id: String(item.position || Math.random()),
      title: item.title || "",
      price: item.price || "",
      source: item.source || "Google Shopping",
      source_icon: item.source_icon || "",
      thumbnail: item.thumbnail || "",
      link: item.link || item.url || item.product_link || "",
      rating: item.rating || null,
      reviews: item.reviews || null,
      delivery: item.delivery || "",
      type: "google_shopping",
    }));

    console.log("[google-shopping-search] Returned", results.length, "results");

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[google-shopping-search] Error:", err);
    return jsonResponse({ results: [] }, 200, corsHeaders);
  }
});
