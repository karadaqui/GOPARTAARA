import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { width, profile, rim, advertiserId } = await req.json()
    const cleanRim = (rim || '').toString().replace(/^R/i, '')

    const feedListUrl =
      'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'
    const feedListRes = await fetch(feedListUrl)
    const feedList = await feedListRes.json()

    const targetId = parseInt(advertiserId) || 4118
    const feed = Array.isArray(feedList)
      ? feedList.find((f: any) => parseInt(f.advertiserId) === targetId)
      : null

    if (!feed?.url) {
      return new Response(
        JSON.stringify({
          products: [],
          error: 'Feed not found',
          availableIds: Array.isArray(feedList)
            ? feedList.map((f: any) => f.advertiserId)
            : [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const feedRes = await fetch(feed.url)
    const feedText = await feedRes.text()

    const lines = feedText.split('\n').filter((l) => l.trim())
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ products: [], error: 'Empty feed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

const parseCSV = (line: string) => {
  const r: string[] = []; let c = '', q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { r.push(c.trim()); c = '' }
    else c += ch
  }
  r.push(c.trim()); return r
}

const headers = parseCSV(lines[0])
const get = (n: string) => headers.findIndex(h => h.toLowerCase().includes(n))
const ni = get('product_name'), pi = get('search_price'), 
      ii = get('merchant_image_url'), ui = get('aw_deep_link'),
      bi = get('brand_name'), di = get('delivery_cost'), idi = get('aw_product_id')

const filtered = lines.slice(1)
  .map(parseCSV)
  .filter(c => (c[ni]||'').toLowerCase().includes(width.toLowerCase()))
  .slice(0, 12)
  .map(c => ({
    id: c[idi] || String(Math.random()),
    title: c[ni] || '',
    price: `£${parseFloat(c[pi]||'0').toFixed(2)}`,
    image: c[ii] || '',
    url: c[ui] || '',
    brand: c[bi] || '',
    shipping: (!c[di] || c[di]==='0') ? 'Free delivery' : `£${c[di]} delivery`,
    inStock: true,
    supplierName: feed.advertiserName || '',
    advertiserId: String(targetId),
  }))

    return new Response(JSON.stringify({ products: filtered }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ products: [], error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
