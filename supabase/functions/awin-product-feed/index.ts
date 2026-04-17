// AWIN product feed proxy for Green Spark Plug Co. (advertiser 16976)
// Fetches the AWIN datafeed, filters by query, returns up to 6 matching products.
// Cached in-memory for 1 hour (the feed is large; refetching every search is wasteful).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADVERTISER_ID = "16976";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface AwinProduct {
  aw_product_id?: string;
  product_name?: string;
  description?: string;
  search_price?: string;
  merchant_image_url?: string;
  aw_deep_link?: string;
  brand_name?: string;
  delivery_cost?: string;
  in_stock?: string;
}

let feedCache: { fetchedAt: number; products: AwinProduct[] } | null = null;

async function loadFeed(token: string): Promise<AwinProduct[]> {
  const now = Date.now();
  if (feedCache && now - feedCache.fetchedAt < CACHE_TTL_MS) {
    return feedCache.products;
  }

  const feedUrl =
    `https://productdata.awin.com/datafeed/download/apikey/${token}` +
    `/language/en/fid/${ADVERTISER_ID}` +
    `/columns/aw_product_id,product_name,description,search_price,merchant_image_url,aw_deep_link,brand_name,delivery_cost,in_stock` +
    `/format/json/delimiter/%2C/compression/none/`;

  const response = await fetch(feedUrl);
  if (!response.ok) {
    throw new Error(`AWIN API error: ${response.status}`);
  }

  const data = await response.json();
  const products: AwinProduct[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.products)
    ? data.products
    : [];

  feedCache = { fetchedAt: now, products };
  return products;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json().catch(() => ({ query: "" }));
    const q = (query || "").toString().trim().toLowerCase();

    if (!q) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = Deno.env.get("AWIN_API_TOKEN");
    if (!token) {
      console.error("AWIN_API_TOKEN not configured");
      return new Response(JSON.stringify({ products: [], error: "missing_token" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = await loadFeed(token);

    const filtered = products
      .filter((p) => {
        const name = (p.product_name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
      .slice(0, 6)
      .map((p) => {
        const priceNum = parseFloat(p.search_price || "0");
        const deliveryNum = parseFloat(p.delivery_cost || "0");
        return {
          id: p.aw_product_id,
          title: p.product_name,
          price: isNaN(priceNum) ? p.search_price : `£${priceNum.toFixed(2)}`,
          image: p.merchant_image_url,
          url: p.aw_deep_link,
          brand: p.brand_name,
          shipping:
            !p.delivery_cost || deliveryNum === 0
              ? "Free delivery"
              : `£${deliveryNum.toFixed(2)} delivery`,
          inStock: (p.in_stock || "").toLowerCase() === "yes" || p.in_stock === "1",
          supplier: "greensparkplug",
          supplierName: "Green Spark Plug Co.",
        };
      });

    return new Response(JSON.stringify({ products: filtered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("awin-product-feed error", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, products: [] }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
