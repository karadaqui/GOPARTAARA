import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hardcoded known-working AWIN product feed URLs (compression/none).
// Map advertiser id -> direct CSV download URL.
const FEED_URLS: Record<string, string> = {
  '4118': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost%2Cdescription',
}

const ADVERTISER_NAMES: Record<string, string> = {
  '4118': 'mytyres.co.uk',
}

const splitCSV = (line: string): string[] => {
  const cols: string[] = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
    else cur += ch
  }
  cols.push(cur.trim())
  return cols
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { width, advertiserId } = await req.json()
    const targetId = String(parseInt(advertiserId) || 4118)

    const feedUrl = FEED_URLS[targetId]
    const advertiserName = ADVERTISER_NAMES[targetId] || targetId

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ products: [], error: 'no feed configured for advertiser ' + targetId }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const feedRes = await fetch(feedUrl)
    const csv = await feedRes.text()

    if (!csv || csv.toLowerCase().includes('<!doctype') || csv.toLowerCase().includes('<html')) {
      return new Response(
        JSON.stringify({ products: [], error: 'Feed returned HTML not CSV', sample: csv.substring(0, 200) }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const rows = csv.split('\n').filter(r => r.trim())
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ products: [], error: 'empty feed', totalRows: rows.length }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const fHeaders = splitCSV(rows[0])
    const col = (s: string) => fHeaders.findIndex(h =>
      h.toLowerCase().replace(/[^a-z]/g,'').includes(s.toLowerCase().replace(/[^a-z]/g,''))
    )

    const ni = col('productname'), pi = col('searchprice'),
          ii = col('merchantimageurl'), ui = col('awdeeplink'),
          bi = col('brandname'), di = col('deliverycost'), idi = col('awproductid')

    const products = rows.slice(1)
      .map(splitCSV)
      .filter(c => (c[ni] || '').toLowerCase().includes(width.toLowerCase()))
      .slice(0, 12)
      .map(c => ({
        id: c[idi] || crypto.randomUUID(),
        title: c[ni] || '',
        price: `£${parseFloat(c[pi] || '0').toFixed(2)}`,
        image: c[ii] || '',
        url: c[ui] || '',
        brand: c[bi] || '',
        shipping: !c[di] || c[di] === '0' ? 'Free delivery' : `£${c[di]} delivery`,
        supplierName: advertiserName,
        advertiserId: targetId,
      }))

    return new Response(
      JSON.stringify({
        products,
        debug: { feedUrl, totalRows: rows.length, filtered: products.length, headers: fHeaders.slice(0, 8) }
      }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    return new Response(
      JSON.stringify({ products: [], error: e.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
