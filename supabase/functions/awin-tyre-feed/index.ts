import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEEDS: Record<string, { url: string; name: string; flag: string; country: string; isGlobal: boolean }> = {
  '4118': {
    url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
    name: 'mytyres.co.uk',
    flag: '🇬🇧',
    country: 'United Kingdom',
    isGlobal: true,
  },
  '10499': {
    url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/10499/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
    name: 'neumaticos-online.es',
    flag: '🇪🇸',
    country: 'Spain',
    isGlobal: false,
  },
  '12716': {
    url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12716/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
    name: 'Pneumatici IT',
    flag: '🇮🇹',
    country: 'Italy',
    isGlobal: false,
  },
  '10747': {
    url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/10747/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
    name: 'ReifenDirekt',
    flag: '🇩🇪',
    country: 'Germany',
    isGlobal: false,
  },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { width, offset = 0, advertiserId = '4118' } = await req.json()

    const feed = FEEDS[advertiserId]
    if (!feed) {
      return new Response(
        JSON.stringify({ products: [], error: 'Unknown advertiserId' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch(feed.url)
    if (!res.body) throw new Error('no body')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    let buffer = ''
    let headers: string[] = []
    const products: any[] = []
    let lineCount = 0
    let skipped = 0

    while (products.length < 100) {
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
        if (!name.toLowerCase().includes(width.toLowerCase())) continue

        if (skipped < offset) { skipped++; continue; }

        products.push({
          id: get('aw_product_id') || String(lineCount),
          title: name,
          price: `£${parseFloat(get('search_price') || '0').toFixed(2)}`,
          image: get('merchant_image_url'),
          url: get('aw_deep_link'),
          brand: get('brand_name'),
          shipping: get('delivery_cost') === '0' || !get('delivery_cost') ? 'Free delivery' : `£${get('delivery_cost')} delivery`,
          supplierName: feed.name,
          supplierMeta: {
            name: feed.name,
            flag: feed.flag,
            country: feed.country,
            isGlobal: feed.isGlobal,
            advertiserId,
          },
        })

        if (products.length >= 100) break
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
