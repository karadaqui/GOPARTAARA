import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEEDS: Record<string, { url: string; currency: string }> = {
  '4118':  { currency: '£', url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost' },
  '10499': { currency: '€', url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/23179/format/csv/language/es/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost' },
  '10747': { currency: '€', url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/66605/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost' },
  '12716': { currency: '€', url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93986/format/csv/language/it/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost' },
  '12715': { currency: '£', url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93988/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost' },
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
    const feed = FEEDS[String(advertiserId)]
    if (!feed) return new Response(JSON.stringify({ products: [], error: 'Unknown advertiser' }), { headers: { ...cors, 'Content-Type': 'application/json' } })

    const res = await fetch(feed.url)
    if (!res.body) throw new Error('No body')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let headers: string[] = []
    const products: any[] = []
    let lineCount = 0
    let ni = -1, pi = -1, ii = -1, ui = -1, bi = -1, di = -1, idi = -1

    outer: while (lineCount < 300000) {
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
          // Parse headers - normalize to lowercase no spaces
          headers = cols.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
          
          // Find columns by multiple possible names
          ni  = headers.findIndex(h => ['productname','name','nombre','nome','titel','title'].some(x => h === x || h.includes(x)))
          pi  = headers.findIndex(h => ['searchprice','price','precio','prezzo','preis','cost'].some(x => h === x || h.includes(x)))
          ii  = headers.findIndex(h => ['merchantimageurl','imageurl','image','imagen','immagine','bild','foto','photo'].some(x => h === x || h.includes(x)))
          ui  = headers.findIndex(h => ['awdeeplink','deeplink','affiliateurl','url','link','enlace'].some(x => h === x || h.includes(x)))
          bi  = headers.findIndex(h => ['brandname','brand','marca','marke','marchio'].some(x => h === x || h.includes(x)))
          di  = headers.findIndex(h => ['deliverycost','delivery','envio','consegna','versand','shipping'].some(x => h === x || h.includes(x)))
          idi = headers.findIndex(h => ['awproductid','productid','id','sku'].some(x => h === x || h.includes(x)))
          
          console.log('Advertiser', advertiserId, 'headers:', headers.slice(0, 10).join(', '))
          console.log('Column indices: ni=', ni, 'pi=', pi, 'ii=', ii, 'ui=', ui, 'bi=', bi)
          continue
        }

        // Skip if name column not found
        if (ni < 0) continue
        
        const name = (cols[ni] || '').toLowerCase()
        
        // Filter by width
        if (!name.includes(String(width).toLowerCase())) continue

        // Skip if URL is actually an image URL (bug fix)
        const rawUrl = cols[ui] || ''
        const rawImage = cols[ii] || ''
        
        // Detect if url and image are swapped
        const actualUrl = rawUrl.includes('delti.com/tyre-p') || rawUrl.includes('tyres.net/s/') 
          ? rawImage  // image was in url column, swap
          : rawUrl
        const actualImage = rawUrl.includes('delti.com/tyre-p') || rawUrl.includes('tyres.net/s/')
          ? rawUrl
          : rawImage

        const rawPrice = parseFloat(cols[pi] || '0')
        const delivery = cols[di] || ''
        const currency = feed.currency

        products.push({
          id: cols[idi] || String(lineCount),
          title: cols[ni] || '',
          price: `${currency}${rawPrice.toFixed(2)}`,
          image: actualImage,
          url: actualUrl,
          brand: cols[bi] || '',
          shipping: !delivery || delivery === '0' ? 'Free delivery' : `${currency}${parseFloat(delivery).toFixed(2)} delivery`,
          advertiserId: String(advertiserId),
          currency,
        })

        if (products.length >= 24) break outer
      }
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
