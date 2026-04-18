import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEED_LIST_URL = 'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'

// Hardcoded known-working AWIN product feed URLs (compression/none).
// Map advertiser id -> direct CSV download URL (used as fallback).
const FEED_URLS: Record<string, string> = {
  '4118': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost%2Cdescription',
}

const ADVERTISER_NAMES: Record<string, string> = {
  '4118': 'mytyres.co.uk',
  '12715': 'Tyres UK',
  '10499': 'neumaticos-online.es',
  '12716': 'Pneumatici IT',
  '10747': 'ReifenDirekt',
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
    const { width, profile, rim, advertiserId } = await req.json()
    const targetId = parseInt(advertiserId) || 4118
    const targetIdStr = String(targetId)

    let feedUrl: string | undefined = undefined
    let advertiserName = ADVERTISER_NAMES[targetIdStr] || targetIdStr

    // Try feedList lookup first (works for suppliers other than 4118)
    try {
      const listRes = await fetch(FEED_LIST_URL)
      const listText = await listRes.text()
      const lines = listText.split('\n').filter((l) => l.trim())
      if (lines.length > 1) {
        const headers = splitCSV(lines[0])
        const idIdx = headers.findIndex((h) => h.toLowerCase().includes('advertiser id'))
        const urlIdx = headers.findIndex((h) => h.toLowerCase() === 'url')
        const nameIdx = headers.findIndex((h) => h.toLowerCase().includes('advertiser name'))

        if (idIdx >= 0 && urlIdx >= 0) {
          const feedRow = lines.slice(1)
            .map(splitCSV)
            .find((cols) => parseInt(cols[idIdx]) === targetId)

          if (feedRow && feedRow[urlIdx]) {
            feedUrl = feedRow[urlIdx]
              .replace('compression/gzip', 'compression/none')
              .replace('compression%2Fgzip', 'compression%2Fnone')
            if (nameIdx >= 0 && feedRow[nameIdx]) advertiserName = feedRow[nameIdx]
          }
        }
      }
    } catch (_e) {
      // ignore — fall through to hardcoded map
    }

    // Fallback to hardcoded URL
    if (!feedUrl && FEED_URLS[targetIdStr]) {
      feedUrl = FEED_URLS[targetIdStr]
    }

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ products: [], error: 'no feed configured for advertiser ' + targetIdStr }),
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

    const rows = csv.split('\n').filter((r) => r.trim())
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ products: [], error: 'empty feed', totalRows: rows.length }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const fHeaders = splitCSV(rows[0])
    const col = (s: string) =>
      fHeaders.findIndex((h) =>
        h.toLowerCase().replace(/[^a-z]/g, '').includes(s.toLowerCase().replace(/[^a-z]/g, ''))
      )

    const ni = col('productname')
    const pi = col('searchprice')
    const ii = col('merchantimageurl')
    const ui = col('awdeeplink')
    const bi = col('brandname')
    const di = col('deliverycost')
    const idi = col('awproductid')
    const descIdx = col('description')

    const widthLc = String(width || '').toLowerCase()
    const profileLc = String(profile || '').toLowerCase()
    const rimClean = String(rim || '').replace(/^r/i, '').toLowerCase()

    const products = rows.slice(1)
      .map(splitCSV)
      .filter((c) => (c[ni] || '').toLowerCase().includes(widthLc))
      .slice(0, 24)
      .map((c) => ({
        id: c[idi] || crypto.randomUUID(),
        title: c[ni] || '',
        price: `£${parseFloat(c[pi] || '0').toFixed(2)}`,
        image: c[ii] || '',
        url: c[ui] || '',
        brand: c[bi] || '',
        shipping: !c[di] || c[di] === '0' ? 'Free delivery' : `£${c[di]} delivery`,
        supplierName: advertiserName,
        advertiserId: targetIdStr,
      }))

    return new Response(
      JSON.stringify({
        products,
        debug: { feedUrl, totalRows: rows.length, filtered: products.length, headers: fHeaders.slice(0, 8) },
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
