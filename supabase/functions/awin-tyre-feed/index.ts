import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { width, profile, rim } = await req.json()
    const cleanRim = rim.toString().replace(/^R/i, '')
    const sizeSlug = `${width}-${profile}-R${cleanRim}`

    const url = `https://www.mytyres.co.uk/rshop/Tyres/${sizeSlug}`
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9',
      }
    })

    const html = await res.text()

    // Extract JSON-LD product data
    const products: any[] = []
    const scriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    let match
    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const json = JSON.parse(match[1])
        const items = Array.isArray(json) ? json : [json]
        for (const item of items) {
          if (item['@type'] !== 'Product') continue
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers
          const price = offer?.price || offer?.lowPrice
          const productUrl = offer?.url || item.url || url
          products.push({
            id: item.sku || item.mpn || String(products.length),
            title: item.name || '',
            price: price ? `£${parseFloat(price).toFixed(2)}` : 'See site',
            image: Array.isArray(item.image) ? item.image[0] : (item.image || ''),
            url: `https://www.awin1.com/cread.php?awinmid=4118&awinaffid=2845282&clickref=partara&p=${encodeURIComponent(productUrl)}`,
            brand: item.brand?.name || item.brand || '',
            shipping: 'Free UK delivery',
            supplierName: 'mytyres.co.uk',
          })
          if (products.length >= 24) break
        }
      } catch { /* skip */ }
      if (products.length >= 24) break
    }

    return new Response(
      JSON.stringify({ products, total: products.length }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    return new Response(
      JSON.stringify({ products: [], error: e.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
