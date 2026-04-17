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

    const tyreSize = `${width}/${profile} R${rim}`.replace('RR', 'R')

    // AWIN feed list URL
    const feedListUrl =
      'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'

    const feedListRes = await fetch(feedListUrl)
    const feedList = await feedListRes.json()

    const targetId = parseInt(advertiserId) || 4118
    const feed = Array.isArray(feedList)
      ? feedList.find(
          (f: any) =>
            f.advertiserId === targetId || f.advertiserId === String(targetId),
        )
      : null

    if (!feed?.url) {
      return new Response(
        JSON.stringify({
          products: [],
          error: 'Feed not found for advertiser ' + targetId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const feedRes = await fetch(feed.url)
    const allProducts = await feedRes.json()

    console.log('Feed products total:', Array.isArray(allProducts) ? allProducts.length : 0)
    console.log('Sample product name:', allProducts?.[0]?.product_name)
    console.log('Searching for:', { width, profile, rim })

    const rimClean = String(rim).replace(/r/gi, '')
    const filtered = Array.isArray(allProducts)
      ? allProducts
          .filter((p: any) => {
            const name = (p.product_name || p.name || '').toLowerCase()
            const desc = (p.description || '').toLowerCase()
            const combined = name + ' ' + desc
            // Match width AND (profile OR rim) — more flexible
            return (
              combined.includes(String(width)) &&
              (combined.includes(String(profile)) || combined.includes(rimClean))
            )
          })
          .slice(0, 12)
          .map((p: any) => ({
            id: p.aw_product_id || p.product_id,
            title: p.product_name || p.name,
            price: `£${parseFloat(p.search_price || p.price || 0).toFixed(2)}`,
            image: p.merchant_image_url || p.image_url || p.image,
            url: p.aw_deep_link || p.affiliate_url || p.url,
            brand: p.brand_name || p.brand || '',
            shipping:
              p.delivery_cost === '0' || p.delivery_cost === 0
                ? 'Free delivery'
                : p.delivery_cost
                  ? `£${p.delivery_cost} delivery`
                  : 'See site',
            inStock: p.in_stock === 'yes' || p.in_stock === true,
            supplier: String(targetId),
            supplierName: feed.advertiserName || 'Tyre Supplier',
            rating: p.rating || '',
            tyreSize,
          }))
      : []

    return new Response(
      JSON.stringify({ products: filtered, tyreSize }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ products: [], error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
