// AWIN product feed proxy for Green Spark Plug Co. (advertiser 16976)
// Fetches the publisher feed list, finds the GSP feed download URL, then filters by query.
// Cached in-memory for 1 hour.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADVERTISER_ID = 16976;
const PUBLISHER_ID = "2845282";
const FEED_TOKEN = "f0b723c9643205a96aeb31377b805e02";
const FEED_LIST_URL = `https://ui.awin.com/productdata-darwin-download/publisher/${PUBLISHER_ID}/${FEED_TOKEN}/1/feedList`;
const DIRECT_FEED_URL = `https://ui.awin.com/productdata-darwin-download/publisher/${PUBLISHER_ID}/${FEED_TOKEN}/1/${ADVERTISER_ID}`;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let feedCache: { fetchedAt: number; products: any[] } | null = null;

async function loadFeed(): Promise<any[]> {
  const now = Date.now();
  if (feedCache && now - feedCache.fetchedAt < CACHE_TTL_MS) {
    return feedCache.products;
  }

  let products: any[] = [];

  // Try feed list first to find the canonical download URL
  try {
    const feedListRes = await fetch(FEED_LIST_URL);
    if (feedListRes.ok) {
      const feedList = await feedListRes.json();
      if (Array.isArray(feedList)) {
        const gspFeed = feedList.find((f: any) =>
          f.advertiserId === ADVERTISER_ID ||
          f.advertiser_id === String(ADVERTISER_ID) ||
          f.advertiserId === String(ADVERTISER_ID)
        );
        const feedUrl = gspFeed?.downloadUrl || gspFeed?.url || gspFeed?.feedUrl;
        if (feedUrl) {
          const feedRes = await fetch(feedUrl);
          if (feedRes.ok) {
            const data = await feedRes.json();
            products = Array.isArray(data) ? data : (data?.products ?? []);
          }
        }
      }
    }
  } catch (err) {
    console.error("feedList fetch failed", err);
  }

  // Fallback: direct feed URL
  if (products.length === 0) {
    const directRes = await fetch(DIRECT_FEED_URL);
    if (!directRes.ok) {
      throw new Error(`AWIN direct feed error: ${directRes.status}`);
    }
    const data = await directRes.json();
    products = Array.isArray(data) ? data : (data?.products ?? []);
  }

  feedCache = { fetchedAt: now, products };
  return products;
}

function processProducts(products: any[], query: string) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];

  return products
    .filter((p: any) => {
      const name = (p.product_name || p.name || p.title || "").toLowerCase();
      const desc = (p.description || p.product_description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    })
    .slice(0, 6)
    .map((p: any) => {
      const priceNum = parseFloat(p.search_price || p.price || "0");
      const deliveryRaw = p.delivery_cost;
      const deliveryNum = parseFloat(deliveryRaw || "0");
      let shipping = "See site for delivery";
      if (deliveryRaw === "0" || deliveryRaw === 0 || deliveryNum === 0) {
        shipping = "Free delivery";
      } else if (!isNaN(deliveryNum) && deliveryNum > 0) {
        shipping = `£${deliveryNum.toFixed(2)} delivery`;
      }
      return {
        id: p.aw_product_id || p.product_id || p.id,
        title: p.product_name || p.name || p.title,
        price: isNaN(priceNum) ? (p.search_price || p.price) : `£${priceNum.toFixed(2)}`,
        image: p.merchant_image_url || p.image_url || p.image,
        url: p.aw_deep_link || p.affiliate_url || p.url,
        brand: p.brand_name || p.brand || "Green Spark Plug Co.",
        shipping,
        inStock:
          p.in_stock === "yes" ||
          p.in_stock === true ||
          p.in_stock === 1 ||
          p.in_stock === "1",
        supplier: "greensparkplug",
        supplierName: "Green Spark Plug Co.",
      };
    });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json().catch(() => ({ query: "" }));

    if (!query) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = await loadFeed();
    const filtered = processProducts(products, query);

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
