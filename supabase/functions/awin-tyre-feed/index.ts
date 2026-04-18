import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEEDS: Record<string, string> = {
  '4118': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
  '10499': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/23179/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
  '10747': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/66605/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
  '12716': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93986/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
  '12715': 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93988/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
}

function splitCSV(line: string): string[] {
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
    const cleanRim = String(rim).replace(/^R/i, '')
    const feedUrl = FEEDS[String(advertiserId)]

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ products: [], error: 'Unknown advertiser: ' + advertiserId }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch(feedUrl)
    if (!res.body) throw new Error('No response body')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let headers: string[] = []
    const products: any[] = []
    let lineCount = 0

    while (products.length < 24) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        lineCount++
        const cols = splitCSV(line)

        if (lineCount === 1) {
          headers = cols
          continue
        }

        const get = (n: string) => {
          const i = headers.findIndex(h => h.toLowerCase().includes(n.toLowerCase()))
          return i >= 0 ? (cols[i] || '') : ''
        }

        const name = get('product_name')
        if (!name.toLowerCase().includes(String(width).toLowerCase())) continue

        const price = parseFloat(get('search_price') || '0')
        const delivery = get('delivery_cost')

        products.push({
          id: get('aw_product_id') || String(lineCount),
          title: name,
          price: `£${price.toFixed(2)}`,
          image: get('merchant_image_url'),
          url: get('aw_deep_link'),
          brand: get('brand_name'),
          shipping: !delivery || delivery === '0' ? 'Free delivery' : `£${delivery} delivery`,
          advertiserId: String(advertiserId),
        })

        if (products.length >= 24) break
      }

      if (lineCount > 100000) break
    }

    reader.cancel().catch(() => {})

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