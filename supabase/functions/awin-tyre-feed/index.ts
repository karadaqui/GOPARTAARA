import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Supplier = {
  name: string
  searchUrl: string
  awinmid: string
}

const SUPPLIERS: Record<string, Supplier> = {
  '4118': {
    name: 'mytyres.co.uk',
    searchUrl: 'https://www.mytyres.co.uk/tyres/car/?width={width}&height={profile}&diameter={rim}',
    awinmid: '4118',
  },
  '12715': {
    name: 'Tyres UK',
    searchUrl: 'https://www.tyres.net/tyres/?width={width}&height={profile}&diameter={rim}',
    awinmid: '12715',
  },
  '10499': {
    name: 'neumaticos-online.es',
    searchUrl: 'https://www.neumaticos-online.es/tyres/?width={width}&height={profile}&diameter={rim}',
    awinmid: '10499',
  },
  '12716': {
    name: 'Pneumatici IT',
    searchUrl: 'https://www.pneumatici.it/ricerca-pneumatici/?width={width}&height={profile}&diameter={rim}',
    awinmid: '12716',
  },
  '10747': {
    name: 'ReifenDirekt',
    searchUrl: 'https://www.reifendirekt.de/reifen/?width={width}&height={profile}&diameter={rim}',
    awinmid: '10747',
  },
}

const PUBLISHER_ID = '2845282'
const AWIN_BASE = 'https://www.awin1.com/cread.php'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { width, profile, rim, advertiserId } = await req.json()
    const cleanRim = (rim || '').toString().replace(/^R/i, '')
    const supplier = SUPPLIERS[String(advertiserId)] || SUPPLIERS['4118']

    const destUrl = supplier.searchUrl
      .replace('{width}', width)
      .replace('{profile}', profile)
      .replace('{rim}', cleanRim)

    const affiliateUrl = `${AWIN_BASE}?awinmid=${supplier.awinmid}&awinaffid=${PUBLISHER_ID}&clickref=partara-tyres&p=${encodeURIComponent(destUrl)}`

    const product = {
      id: `${advertiserId}-${width}-${profile}-${cleanRim}`,
      title: `${width}/${profile} R${cleanRim} Tyres — ${supplier.name}`,
      subtitle: `Search all ${width}/${profile} R${cleanRim} tyres on ${supplier.name}`,
      price: 'View prices',
      image: '',
      url: affiliateUrl,
      brand: supplier.name,
      shipping: 'See site for delivery options',
      supplierName: supplier.name,
      advertiserId: String(advertiserId),
      isSearchLink: true,
    }

    return new Response(
      JSON.stringify({ products: [product] }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    return new Response(
      JSON.stringify({ products: [], error: e.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
