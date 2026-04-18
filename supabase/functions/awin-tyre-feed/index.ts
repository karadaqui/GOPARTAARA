import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEED_LIST_URL = 'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'

// Direct feed URLs per advertiser (compression=none for streaming CSV)
const FEED_URLS: Record<string, string> = {
  '4118': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
  '12715': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12715/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
  '10499': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/10499/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
  '12716': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12716/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
  '10747': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/10747/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
}

const META_BY_ID: Record<string, { flag: string; country: string; name: string; isGlobal: boolean }> = {
  '4118':  { flag: '🇬🇧', country: 'United Kingdom', name: 'mytyres.co.uk',         isGlobal: true  },
  '12715': { flag: '🌍', country: 'Global',          name: 'Tyres UK',              isGlobal: true  },
  '10499': { flag: '🇪🇸', country: 'Spain',          name: 'neumaticos-online.es',  isGlobal: false },
  '12716': { flag: '🇮🇹', country: 'Italy',          name: 'Pneumatici IT',         isGlobal: false },
  '10747': { flag: '🇪🇪', country: 'Estonia',        name: 'ReifenDirekt EE',       isGlobal: false },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { width, profile, rim, offset = 0, advertiserId = '4118', tyreType = 'all' } = await req.json()
    const cleanRim = String(rim || '').replace(/^R/i, '').trim()

    const feedUrl = FEED_URLS[String(advertiserId)]
    const meta = META_BY_ID[String(advertiserId)] || { flag: '🌍', country: 'Unknown', name: `Advertiser ${advertiserId}`, isGlobal: false }
    const supplierName = meta.name

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ products: [], error: `No feed URL for advertiser ${advertiserId}` }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch(feedUrl)
    if (!res.body) throw new Error('no body')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    let buffer = ''
    let headers: string[] = []
    const products: any[] = []
    let lineCount = 0
    let skipped = 0

    while (products.length < 50) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        lineCount++

        const cols = parseCsvLine(line)

        if (lineCount === 1) {
          headers = cols
          continue
        }

        const get = (n: string) => {
          const i = headers.findIndex(h => h.toLowerCase().includes(n.toLowerCase()))
          return i >= 0 ? (cols[i] || '') : ''
        }

        const name = get('product_name')
        const nameL = name.toLowerCase()

        const sizePatterns = [
          `${width}/${profile}`,
          `${width} ${profile}`,
          `${width}-${profile}`,
        ]
        const rimPatterns = [
          `r${cleanRim}`,
          `r ${cleanRim}`,
          ` ${cleanRim} `,
          `r${cleanRim} `,
          `/${cleanRim}`,
        ]
        const hasSize = sizePatterns.some(p => nameL.includes(p.toLowerCase()))
        const hasRim = rimPatterns.some(p => nameL.includes(p.toLowerCase()))
        if (!hasSize || !hasRim) continue

        const lowerName = nameL

        // Tyre type filter
        const isWheel = lowerName.includes('wheel') || lowerName.includes('rim') || lowerName.includes('jant') || lowerName.includes('felge') || lowerName.includes('cerchio') || lowerName.includes('llanta')
        if (tyreType === 'tyre' && isWheel) continue
        if (tyreType === 'wheel' && !isWheel) continue

        if (skipped < offset) { skipped++; continue }

        products.push({
          id: get('aw_product_id') || String(lineCount),
          title: name,
          price: `£${parseFloat(get('search_price') || '0').toFixed(2)}`,
          image: get('merchant_image_url'),
          url: get('aw_deep_link'),
          brand: get('brand_name'),
          shipping: get('delivery_cost') === '0' || !get('delivery_cost') ? 'Free delivery' : `£${get('delivery_cost')} delivery`,
          supplierName,
          supplierMeta: {
            name: supplierName,
            flag: meta.flag,
            country: meta.country,
            isGlobal: meta.isGlobal,
            advertiserId: String(advertiserId),
          },
        })

        if (products.length >= 50) break
      }

      if (lineCount > 100000) break
    }

    reader.cancel()

    return new Response(
      JSON.stringify({ products }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    return new Response(
      JSON.stringify({ products: [], error: e.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})

function parseCsvLine(line: string): string[] {
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
