// Reads pre-cached Awin merchant products from `parts_cache` (filled by
// `refresh-merchant-cache`). Stays well within memory limits and matches
// the response shape consumed by `useAwinMerchantProducts`.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MERCHANT_LABELS: Record<string, string> = {
  '67974': 'Dunford Inc',
  '8626': 'Autobandenmarkt',
  '16673': 'Maxpeedingrods',
  '16809': 'Kohl Automobile',
  '8794': 'Tirendo',
  '104933': 'Direnza',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  try {
    const body = await req.json().catch(() => ({}))
    const merchantId = String(body.merchantId || '').trim()
    const query = String(body.query || '').trim()
    if (!merchantId || !query) {
      return new Response(JSON.stringify({ products: [] }),
        { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)
    let q = supabase.from('parts_cache').select('*').eq('advertiser_id', merchantId).limit(200)
    for (const t of tokens) {
      const safe = t.replace(/[\\%_]/g, (m) => '\\' + m)
      const p = `%${safe}%`
      q = q.or(`name.ilike.${p},brand.ilike.${p},category.ilike.${p}`)
    }

    const { data, error } = await q
    if (error) {
      console.error('parts_cache query', error.message)
      return new Response(JSON.stringify({ products: [], error: error.message }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const supplierName = MERCHANT_LABELS[merchantId] || `Merchant ${merchantId}`
    const products = (data || []).slice(0, 12).map((r: any) => ({
      id: r.id,
      title: r.name,
      price: r.price,
      image: r.image_url,
      url: r.url,
      brand: r.brand,
      shipping: 'See site for delivery',
      description: '',
      inStock: r.in_stock !== false,
      supplier: merchantId,
      supplierName,
      condition: 'New',
      category: r.category,
    }))

    return new Response(JSON.stringify({ products, merchantId, supplierName }),
      { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('awin-merchant-feed error', e?.message)
    return new Response(JSON.stringify({ products: [], error: e?.message }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
