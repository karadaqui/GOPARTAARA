import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  try {
    const { query } = await req.json().catch(() => ({ query: '' }))
    const q = (query || '').toString().trim()

    if (!q) {
      return new Response(JSON.stringify({ products: [], total: 0 }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Escape ILIKE wildcards
    const safe = q.replace(/[\\%_]/g, (m) => '\\' + m)
    const pattern = `%${safe}%`

    const { data, error, count } = await supabase
      .from('parts_cache')
      .select('*', { count: 'exact' })
      .or(`name.ilike.${pattern},brand.ilike.${pattern},category.ilike.${pattern}`)
      .limit(200)

    if (error) {
      return new Response(
        JSON.stringify({ products: [], total: 0, error: error.message }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ products: data || [], total: count ?? (data?.length || 0) }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (e: any) {
    return new Response(
      JSON.stringify({ products: [], total: 0, error: e.message }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }
})
