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
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
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

    const idx = (name: string) =>
      headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()))

    const nameIdx = idx('product_name') !== -1 ? idx('product_name') : idx('name')
    const priceIdx = idx('search_price') !== -1 ? idx('search_price') : idx('price')
    const imageIdx =
      idx('merchant_image_url') !== -1 ? idx('merchant_image_url') : idx('image')
    const urlIdx = idx('aw_deep_link') !== -1 ? idx('aw_deep_link') : idx('url')
    const brandIdx = idx('brand_name') !== -1 ? idx('brand_name') : idx('brand')
    const deliveryIdx = idx('delivery_cost')
    const descIdx = idx('description')
    const idIdx =
      idx('aw_product_id') !== -1 ? idx('aw_product_id') : idx('product_id')

    const widthStr = String(width).toLowerCase()

    const products = lines
      .slice(1)
      .map((line) => parseCSVLine(line))
      .filter((cols) => {
        const name = (cols[nameIdx] || '').toLowerCase()
        const desc = (cols[descIdx] || '').toLowerCase()
        const combined = name + ' ' + desc
        return combined.includes(widthStr)
      })
      .slice(0, 12)
      .map((cols) => {
        const rawPrice = parseFloat(cols[priceIdx] || '0')
        const deliveryCost = cols[deliveryIdx] || ''
        return {
          id: cols[idIdx] || Math.random().toString(),
          title: cols[nameIdx] || '',
          price: `£${rawPrice.toFixed(2)}`,
          image: cols[imageIdx] || '',
          url: cols[urlIdx] || '',
          brand: cols[brandIdx] || '',
          shipping:
            !deliveryCost || deliveryCost === '0'
              ? 'Free delivery'
              : `£${deliveryCost} delivery`,
          inStock: true,
          supplierName: feed.advertiserName || '',
          advertiserId: String(targetId),
        }
      })

    return new Response(
      JSON.stringify({
        products,
        debug: {
          feedUrl: feed.url,
          totalLines: lines.length,
          headers: headers.slice(0, 10),
          filtered: products.length,
          searchedWidth: widthStr,
          rim: cleanRim,
          profile,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
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
