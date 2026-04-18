// AWIN tyre feed proxy for mytyres.co.uk (advertiser 4118, feed 12641)
// 1. Download the CSV feed directly via the productdata API URL.
// 2. Parse the product CSV.
// 3. Filter by width, return up to 24 products.
// Cached in-memory for 1 hour.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADVERTISER_ID = "4118";
const PUBLISHER_ID = "2845282";
const FEED_URL = "https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost%2Cdescription";
const CACHE_TTL_MS = 60 * 60 * 1000;

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  brand: string;
  shipping: string;
  description: string;
  supplierName: string;
  advertiserId: string;
}

interface RawProduct {
  aw_product_id?: string;
  product_name?: string;
  description?: string;
  search_price?: string;
  merchant_image_url?: string;
  aw_image_url?: string;
  aw_deep_link?: string;
  brand_name?: string;
  delivery_cost?: string;
  in_stock?: string;
  currency?: string;
}

let feedCache: { fetchedAt: number; products: RawProduct[] } | null = null;

// Minimal CSV parser supporting quoted fields with embedded commas/quotes/newlines.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // skip
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function decompressGzip(buf: ArrayBuffer): Promise<string> {
  const ds = new DecompressionStream("gzip");
  const stream = new Response(buf).body!.pipeThrough(ds);
  const text = await new Response(stream).text();
  return text;
}

async function loadFeed(): Promise<RawProduct[]> {
  const now = Date.now();
  if (feedCache && now - feedCache.fetchedAt < CACHE_TTL_MS) {
    return feedCache.products;
  }

  const feedRes = await fetch(FEED_URL);
  if (!feedRes.ok) {
    throw new Error(`product feed fetch failed: ${feedRes.status}`);
  }

  const buf = await feedRes.arrayBuffer();
  const csvText = FEED_URL.includes("compression/gzip")
    ? await decompressGzip(buf)
    : new TextDecoder().decode(buf);

  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    feedCache = { fetchedAt: now, products: [] };
    return [];
  }
  const header = rows[0].map((h) => h.trim());
  const products: RawProduct[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 2) continue;
    const obj: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = r[j] ?? "";
    }
    products.push(obj as RawProduct);
  }

  feedCache = { fetchedAt: now, products };
  return products;
}

function buildAffiliateUrl(deepLink: string): string {
  if (!deepLink) return "";
  // If already an awin link, return as-is
  if (deepLink.includes("awin1.com")) return deepLink;
  return `https://www.awin1.com/cread.php?awinmid=${ADVERTISER_ID}&awinaffid=${PUBLISHER_ID}&clickref=partara-tyres&p=${encodeURIComponent(deepLink)}`;
}

function processProducts(
  products: RawProduct[],
  width: string,
  profile: string,
  rim: string,
): Product[] {
  const w = width.toLowerCase().trim();
  if (!w) return [];

  return products
    .filter((p) => {
      const name = (p.product_name || "").toLowerCase();
      return name.includes(w);
    })
    .slice(0, 24)
    .map((p) => {
      const priceNum = parseFloat(p.search_price || "0");
      const deliveryNum = parseFloat(p.delivery_cost || "0");
      const currency = (p.currency || "GBP").toUpperCase();
      const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency === "USD" ? "$" : "";
      let shipping = "See site for delivery";
      if (!p.delivery_cost || deliveryNum === 0) {
        shipping = "Free delivery";
      } else if (!isNaN(deliveryNum) && deliveryNum > 0) {
        shipping = `${symbol}${deliveryNum.toFixed(2)} delivery`;
      }
      return {
        id: p.aw_product_id || "",
        title: p.product_name || "",
        price: isNaN(priceNum) || priceNum === 0
          ? (p.search_price || "")
          : `${symbol}${priceNum.toFixed(2)}`,
        image: p.merchant_image_url || p.aw_image_url || "",
        url: buildAffiliateUrl(p.aw_deep_link || ""),
        brand: p.brand_name || "",
        shipping,
        description: p.description || "",
        supplierName: "mytyres.co.uk",
        advertiserId: ADVERTISER_ID,
      };
    });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const width = (body.width || "").toString();
    const profile = (body.profile || "").toString();
    const rim = (body.rim || "").toString().replace(/^R/i, "");

    if (!width.trim()) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = await loadFeed();
    const filtered = processProducts(products, width, profile, rim);

    return new Response(JSON.stringify({ products: filtered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("awin-tyre-feed error", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, products: [] }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
