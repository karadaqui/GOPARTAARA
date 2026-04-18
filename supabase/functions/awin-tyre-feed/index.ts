import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEEDS: Record<string, string> = {
  '4118':  'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
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
    const { width, advertiserId } = await req.json()
    const feedUrl = FEEDS[String(advertiserId)]

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ products: [], error: 'Unknown: ' + advertiserId }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const res = await fetch(feedUrl)
    if (!res.body) throw new Error('No body')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let headers: string[] = []
    const products: any[] = []
    let lineCount = 0
    let ni = -1, pi = -1, ii = -1, ui = -1, bi = -1, di = -1, idi = -1

    while (products.length < 24 && lineCount < 200000) {
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
          headers = cols.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
          ni  = headers.findIndex(h => h.includes('productname') || h.includes('name'))
          pi  = headers.findIndex(h => h.includes('searchprice') || h.includes('price'))
          ii  = headers.findIndex(h => h.includes('merchantimageurl') || h.includes('imageurl') || h.includes('image'))
          ui  = headers.findIndex(h => h.includes('awdeeplink') || h.includes('deeplink') || h.includes('url'))
          bi  = headers.findIndex(h => h.includes('brandname') || h.includes('brand'))
          di  = headers.findIndex(h => h.includes('deliverycost') || h.includes('delivery'))
          idi = headers.findIndex(h => h.includes('awproductid') || h.includes('productid') || h.includes('id'))
          console.log('HEADERS for', advertiserId, ':', headers.slice(0,10))
          console.log('INDICES: ni=', ni, 'pi=', pi, 'ii=', ii, 'ui=', ui)
          continue
        }

        // NO FILTER — return first 24 products regardless of name
        // Users will see all tyres from each supplier

        products.push({
          id: cols[idi] || String(lineCount),
          title: cols[ni] || '',
          price: `£${parseFloat(cols[pi] || '0').toFixed(2)}`,
          image: cols[ii] || '',
          url: cols[ui] || '',
          brand: cols[bi] || '',
          shipping: !cols[di] || cols[di] === '0' ? 'Free delivery' : `£${cols[di]} delivery`,
          advertiserId: String(advertiserId),
        })

        if (products.length >= 24) break
      }
    }

    reader.cancel().catch(() => {})
    console.log('RESULT for', advertiserId, ': products=', products.length, 'lines=', lineCount)

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