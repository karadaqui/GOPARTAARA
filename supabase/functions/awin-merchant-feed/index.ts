// Parametric Awin product feed proxy.
// Replicates the pattern used by `awin-product-feed` (Green Spark Plug),
// but takes a `merchantId` (Awin advertiser id) at call time so the same
// function serves every Awin merchant we onboard.
//
// 1. Fetch the publisher's feedList (CSV) from ui.awin.com.
// 2. Locate the row for the requested advertiser id, get its CSV download URL.
// 3. Download + gunzip + parse the product CSV.
// 4. Filter by query (name/description/brand/category).
// 5. Return up to 12 products with affiliate links forced to awinaffid=2845282.
// In-memory cached per-merchant for 1 hour.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PUBLISHER_ID = "2845282";
const CACHE_TTL_MS = 60 * 60 * 1000;

// Friendly supplier label per merchantId — kept in sync with src/data/suppliers.ts.
const MERCHANT_LABELS: Record<string, string> = {
  "67974": "Dunford Inc",
  "8626": "Autobandenmarkt",
  "16673": "Maxpeedingrods",
  "16809": "Kohl Automobile",
  "8794": "Tirendo",
  "118045": "Amazon UK",
};

interface RawRow { [k: string]: string }
interface FeedCacheEntry { fetchedAt: number; rows: RawRow[] }
const feedCache = new Map<string, FeedCacheEntry>();

// RFC4180-ish CSV parser supporting quoted fields with embedded commas/newlines.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function findFeedUrl(apiKey: string, advertiserId: string): Promise<string | null> {
  const feedListUrl = `https://ui.awin.com/productdata-darwin-download/publisher/${PUBLISHER_ID}/${apiKey}/1/feedList`;
  const res = await fetch(feedListUrl);
  if (!res.ok) {
    console.error("feedList fetch failed", res.status);
    return null;
  }
  const csv = await res.text();
  const rows = parseCSV(csv);
  if (rows.length < 2) return null;
  const header = rows[0].map((h) => h.trim());
  const idIdx = header.findIndex((h) => h.toLowerCase().includes("advertiser id"));
  const urlIdx = header.findIndex((h) => h.toLowerCase() === "url");
  if (idIdx < 0 || urlIdx < 0) return null;
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][idIdx] || "").trim() === advertiserId) {
      return (rows[i][urlIdx] || "").trim();
    }
  }
  return null;
}

async function fetchFeedText(feedUrl: string): Promise<string | null> {
  const res = await fetch(feedUrl, { redirect: "follow" });
  if (!res.ok || !res.body) {
    console.error("Feed fetch failed", res.status);
    return null;
  }
  if (feedUrl.includes("compression/gzip")) {
    const decompressed = res.body.pipeThrough(new DecompressionStream("gzip"));
    return await new Response(decompressed).text();
  }
  return await res.text();
}

async function loadMerchantRows(apiKey: string, merchantId: string): Promise<RawRow[]> {
  const cached = feedCache.get(merchantId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.rows;

  const feedUrl = await findFeedUrl(apiKey, merchantId);
  if (!feedUrl) { console.warn(`No feed for merchant ${merchantId}`); return []; }
  const text = await fetchFeedText(feedUrl);
  if (!text) return [];

  const rows = parseCSV(text);
  if (rows.length < 2) { feedCache.set(merchantId, { fetchedAt: Date.now(), rows: [] }); return []; }
  const header = rows[0].map((h) => h.trim());
  const out: RawRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 2) continue;
    const obj: RawRow = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = r[j] ?? "";
    out.push(obj);
  }
  feedCache.set(merchantId, { fetchedAt: Date.now(), rows: out });
  return out;
}

function buildAffiliateUrl(merchantId: string, awDeep: string, merchantDeep: string): string {
  // Prefer the pre-built aw_deep_link, but force awinaffid to our publisher id.
  if (awDeep) {
    const fixed = awDeep.replace(/awinaffid=\d+/i, `awinaffid=${PUBLISHER_ID}`);
    return fixed.includes("awinaffid=") ? fixed : `${fixed}${fixed.includes("?") ? "&" : "?"}awinaffid=${PUBLISHER_ID}`;
  }
  if (merchantDeep) {
    return `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${PUBLISHER_ID}&ued=${encodeURIComponent(merchantDeep)}`;
  }
  return "";
}

function processProducts(rows: RawRow[], query: string, merchantId: string, supplierName: string) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  return rows
    .filter((p) => {
      const hay = [
        p.product_name, p.description, p.brand_name,
        p.merchant_category, p.category_name,
      ].join(" ").toLowerCase();
      return tokens.every((t) => hay.includes(t));
    })
    .slice(0, 12)
    .map((p, idx) => {
      const priceNum = parseFloat(p.search_price || "0");
      const currency = (p.currency || "").toUpperCase();
      const symbol =
        currency === "GBP" ? "£" :
        currency === "EUR" ? "€" :
        currency === "USD" ? "$" :
        currency === "NOK" ? "kr " : "";
      const deliveryNum = parseFloat(p.delivery_cost || "0");
      let shipping = "See site for delivery";
      if (!p.delivery_cost || deliveryNum === 0) shipping = "Free delivery";
      else if (!isNaN(deliveryNum) && deliveryNum > 0) shipping = `${symbol}${deliveryNum.toFixed(2)} delivery`;

      return {
        id: p.aw_product_id || p.merchant_product_id || `${merchantId}-${idx}`,
        title: p.product_name || "",
        price: !isNaN(priceNum) && priceNum > 0
          ? `${symbol}${priceNum.toFixed(2)}`
          : (p.search_price || ""),
        image: p.merchant_image_url || p.aw_image_url || "",
        url: buildAffiliateUrl(merchantId, p.aw_deep_link || "", p.merchant_deep_link || ""),
        brand: p.brand_name || "",
        shipping,
        description: p.description || "",
        inStock: !p.in_stock || ["1", "yes", "true", "in stock"].includes((p.in_stock || "").toLowerCase()),
        supplier: merchantId,
        supplierName,
        condition: "New",
        category: p.merchant_category || p.category_name || "",
      };
    })
    .filter((p) => !!p.url);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("AWIN_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AWIN_API_KEY missing", products: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const merchantId = String(body.merchantId || "").trim();
    const query = String(body.query || "").trim();

    if (!merchantId) {
      return new Response(JSON.stringify({ error: "merchantId required", products: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!query) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = await loadMerchantRows(apiKey, merchantId);
    const supplierName = MERCHANT_LABELS[merchantId] || `Merchant ${merchantId}`;
    const products = processProducts(rows, query, merchantId, supplierName);

    return new Response(JSON.stringify({ products, merchantId, supplierName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("awin-merchant-feed error", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message, products: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
