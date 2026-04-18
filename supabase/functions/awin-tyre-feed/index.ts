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

    const searchUrl = `https://www.mytyres.co.uk/api/v1/tyres/search?width=${width}&height=${profile}&rim=${cleanRim}&vehicle=car&sort=price_asc&limit=24`

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.mytyres.co.uk/',
      }
    })

    const text = await res.text()

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      const pageUrl = `https://www.mytyres.co.uk/tyres/car/?width=${width}&height=${profile}&diameter=${cleanRim}`
      const pageRes = await fetch(pageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
      const html = await pageRes.text()

      const products: any[] = []

      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
      if (jsonLdMatch) {
        for (const block of jsonLdMatch) {
          try {
            const json = JSON.parse(block.replace(/<script[^>]*>/, '').replace('</script>', ''))
            if (json['@type'] === 'Product' || (Array.isArray(json) && json[0]?.['@type'] === 'Product')) {
              const items = Array.isArray(json) ? json : [json]
              for (const item of items.slice(0, 24)) {
                const offer = item.offers || item.offer
                const price = offer?.price || offer?.lowPrice || '0'
                products.push({
                  id: item.sku || item.mpn || String(Math.random()),
                  title: item.name || '',
                  price: `£${parseFloat(price).toFixed(2)}`,
                  image: item.image || (Array.isArray(item.image) ? item.image[0] : ''),
                  url: `https://www.awin1.com/cread.php?awinmid=4118&awinaffid=2845282&clickref=partara-tyres&p=${encodeURIComponent(item.url || offer?.url || pageUrl)}`,
                  brand: item.brand?.name || item.brand || '',
                  shipping: 'Free delivery on orders over £59',
                  supplierName: 'mytyres.co.uk',
                  advertiserId: '4118',
                })
              }
            }
          } catch { /* skip */ }
        }
      }

      if (products.length > 0) {
        return new Response(
          JSON.stringify({ products }),
          { headers: { ...cors, 'Content-Type': 'application/json' } }
        )
      }

      const titleMatches = html.matchAll(/<span[^>]*class="[^"]*product[^"]*title[^"]*"[^>]*>(.*?)<\/span>/gi)
      const priceMatches = html.matchAll(/£([\d.]+)/g)
      const imgMatches = html.matchAll(/<img[^>]*src="(https:\/\/[^"]*(?:tyre|reifen|pneu)[^"]*\.(?:jpg|png|webp))"[^>]*>/gi)

      const titles = [...titleMatches].map(m => m[1].replace(/<[^>]*>/g, '').trim())
      const prices = [...priceMatches].map(m => m[1])
      const imgs = [...imgMatches].map(m => m[1])

      const fallbackProducts = titles.slice(0, 12).map((title, i) => ({
        id: String(i),
        title,
        price: prices[i] ? `£${prices[i]}` : 'See site',
        image: imgs[i] || '',
        url: `https://www.awin1.com/cread.php?awinmid=4118&awinaffid=2845282&clickref=partara-tyres&p=${encodeURIComponent(pageUrl)}`,
        brand: '',
        shipping: 'Free delivery on orders over £59',
        supplierName: 'mytyres.co.uk',
        advertiserId: '4118',
      }))

      return new Response(
        JSON.stringify({ products: fallbackProducts }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const items = data?.products || data?.items || data?.results || data?.tyres || []
    const products = items.slice(0, 24).map((item: any) => ({
      id: item.id || item.sku || String(Math.random()),
      title: item.name || item.title || item.fullName || '',
      price: item.price ? `£${parseFloat(item.price).toFixed(2)}` : 'See site',
      image: item.image || item.imageUrl || item.thumbnail || '',
      url: `https://www.awin1.com/cread.php?awinmid=4118&awinaffid=2845282&clickref=partara-tyres&p=${encodeURIComponent(item.url || item.link || '')}`,
      brand: item.brand || item.manufacturer || '',
      shipping: 'Free delivery on orders over £59',
      supplierName: 'mytyres.co.uk',
      advertiserId: '4118',
    }))

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
