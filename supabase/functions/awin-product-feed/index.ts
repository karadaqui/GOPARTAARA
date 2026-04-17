// AWIN product feed proxy for Green Spark Plug Co. (advertiser 16976, feed 32377)
// 1. Fetch the CSV feed list, locate the GSP row, get its gzipped CSV download URL.
// 2. Download + gunzip + parse the product CSV.
// 3. Filter by query, return up to 6 products.
// Cached in-memory for 1 hour.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADVERTISER_ID = "16976";
const PUBLISHER_ID = "2845282";
const FEED_TOKEN = "f0b723c9643205a96aeb31377b805e02";
const FEED_LIST_URL = `https://ui.awin.com/productdata-darwin-download/publisher/${PUBLISHER_ID}/${FEED_TOKEN}/1/feedList`;
const CACHE_TTL_MS = 60 * 60 * 1000;

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  brand: string;
  shipping: string;
  inStock: boolean;
  supplier: string;
  supplierName: string;
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

async function findGspFeedUrl(): Promise<string | null> {
  const res = await fetch(FEED_LIST_URL);
  if (!res.ok) {
    throw new Error(`feedList fetch failed: ${res.status}`);
  }
  const csv = await res.text();
  const rows = parseCSV(csv);
  if (rows.length < 2) return null;
  const header = rows[0];
  const idIdx = header.findIndex((h) => h.trim() === "Advertiser ID");
  const urlIdx = header.findIndex((h) => h.trim() === "URL");
  if (idIdx === -1 || urlIdx === -1) return null;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][idIdx] === ADVERTISER_ID) {
      return rows[i][urlIdx];
    }
  }
  return null;
}

async function loadFeed(): Promise<RawProduct[]> {
  const now = Date.now();
  if (feedCache && now - feedCache.fetchedAt < CACHE_TTL_MS) {
    return feedCache.products;
  }

  const feedUrl = await findGspFeedUrl();
  if (!feedUrl) {
    throw new Error("Green Spark Plug feed not found in feed list");
  }

  const feedRes = await fetch(feedUrl);
  if (!feedRes.ok) {
    throw new Error(`product feed fetch failed: ${feedRes.status}`);
  }

  // The URL ends with compression/gzip — decompress.
  const buf = await feedRes.arrayBuffer();
  const csvText = feedUrl.includes("compression/gzip")
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

function processProducts(products: RawProduct[], query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return products
    .filter((p) => {
      const name = (p.product_name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    })
    .slice(0, 6)
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
        url: p.aw_deep_link || "",
        brand: p.brand_name || "Green Spark Plug Co.",
        shipping,
        inStock: (p.in_stock || "").toString().toLowerCase() === "yes" || p.in_stock === "1",
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
    const q = (query || "").toString();

    if (!q.trim()) {
      return new Response(JSON.stringify({ products: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const products = await loadFeed();
    const filtered = processProducts(products, q);

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
