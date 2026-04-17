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

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const nameIdx = headers.findIndex((h) => h.toLowerCase().includes('product_name'))
    const priceIdx = headers.findIndex((h) => h.toLowerCase().includes('search_price'))
    const imageIdx = headers.findIndex((h) => h.toLowerCase().includes('merchant_image_url'))
    const urlIdx = headers.findIndex((h) => h.toLowerCase().includes('aw_deep_link'))
    const brandIdx = headers.findIndex((h) => h.toLowerCase().includes('brand_name'))
    const deliveryIdx = headers.findIndex((h) => h.toLowerCase().includes('delivery_cost'))
    const idIdx = headers.findIndex((h) => h.toLowerCase().includes('aw_product_id'))

    const filtered = lines
      .slice(1)
      .map((line) => parseCSVLine(line))
      .filter((cols) => {
        const name = (cols[nameIdx] || '').toLowerCase()
        return name.includes(String(width).toLowerCase())
      })
      .slice(0, 12)
      .map((cols) => ({
        id: cols[idIdx] || String(Math.random()),
        title: cols[nameIdx] || '',
        price: `£${parseFloat(cols[priceIdx] || '0').toFixed(2)}`,
        image: cols[imageIdx] || '',
        url: cols[urlIdx] || '',
        brand: cols[brandIdx] || '',
        shipping:
          !cols[deliveryIdx] || cols[deliveryIdx] === '0'
            ? 'Free delivery'
            : `£${cols[deliveryIdx]} delivery`,
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
