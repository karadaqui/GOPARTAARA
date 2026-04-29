// Fetch EV King (merchant 22473) products from Awin via the productdata API.
// Steps: 1) list feeds with API key, 2) find feed id for merchant 22473,
// 3) download gzipped CSV, 4) parse and return JSON.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MERCHANT_ID = "22473";
const PUBLISHER_ID = "2845282";
const COLUMNS = [
  "aw_deep_link",
  "product_name",
  "aw_product_id",
  "merchant_product_id",
  "merchant_image_url",
  "description",
  "merchant_category",
  "search_price",
  "merchant_name",
  "merchant_id",
  "brand_name",
  "in_stock",
  "merchant_deep_link",
];

interface CacheEntry {
  ts: number;
  products: any[];
}
let cache: CacheEntry | null = null;
const TTL_MS = 60 * 60 * 1000; // 1 hour

function buildAffiliateUrl(deepLink: string): string {
  return `https://www.awin1.com/cread.php?awinmid=${MERCHANT_ID}&awinaffid=${PUBLISHER_ID}&ued=${encodeURIComponent(deepLink)}`;
}

// Minimal CSV parser handling quoted fields and commas inside quotes.
function parseCsv(text: string): string[][] {
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

async function findFeedId(apiKey: string): Promise<string | null> {
  const url = `https://productdata.awin.com/datafeed/list/apikey/${apiKey}/`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Awin feed list failed", res.status, await res.text());
    return null;
  }
  const csv = await res.text();
  const rows = parseCsv(csv);
  if (!rows.length) return null;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const midIdx = header.findIndex((h) => h.includes("advertiser_id") || h === "advertiser id" || h === "advertiserid");
  const fidIdx = header.findIndex((h) => h.includes("feed_id") || h === "feed id" || h === "feedid");
  if (midIdx < 0 || fidIdx < 0) {
    console.error("Awin feed list header unexpected", header);
    return null;
  }
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][midIdx] || "").trim() === MERCHANT_ID) {
      return (rows[i][fidIdx] || "").trim();
    }
  }
  return null;
}

async function downloadFeed(apiKey: string, feedId: string): Promise<any[]> {
  const cols = COLUMNS.join(",");
  const url = `https://productdata.awin.com/datafeed/download/apikey/${apiKey}/fid/${feedId}/format/csv/language/en/delimiter/%2C/compression/gzip/adultcontent/1/columns/${cols}/`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Awin feed download failed", res.status);
    return [];
  }
  // Decompress gzip stream
  const ds = new DecompressionStream("gzip");
  const decompressed = res.body!.pipeThrough(ds);
  const text = await new Response(decompressed).text();
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const iName = idx("product_name");
  const iId = idx("aw_product_id");
  const iImg = idx("merchant_image_url");
  const iDesc = idx("description");
  const iCat = idx("merchant_category");
  const iPrice = idx("search_price");
  const iBrand = idx("brand_name");
  const iStock = idx("in_stock");
  const iDeep = idx("merchant_deep_link");
  const iAwDeep = idx("aw_deep_link");

  const products: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < header.length) continue;
    const inStock = (r[iStock] || "").trim();
    if (inStock === "0") continue;
    const deep = r[iDeep] || r[iAwDeep] || "";
    if (!deep) continue;
    products.push({
      id: r[iId] || `${i}`,
      name: r[iName] || "",
      description: r[iDesc] || "",
      price: r[iPrice] || "",
      image_url: r[iImg] || "",
      brand: r[iBrand] || "",
      category: r[iCat] || "",
      affiliate_url: buildAffiliateUrl(deep),
    });
  }
  return products;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("AWIN_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AWIN_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (cache && Date.now() - cache.ts < TTL_MS) {
      return new Response(JSON.stringify({ products: cache.products, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const feedId = await findFeedId(apiKey);
    if (!feedId) {
      return new Response(JSON.stringify({ error: "EV King feed not found", products: [] }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = await downloadFeed(apiKey, feedId);
    cache = { ts: Date.now(), products };

    return new Response(JSON.stringify({ products, feed_id: feedId, count: products.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-ev-king-feed error", e);
    return new Response(JSON.stringify({ error: String(e), products: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
