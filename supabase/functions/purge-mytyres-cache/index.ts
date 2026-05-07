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
    { auth: { persistSession: false } }
  )

  const results: Record<string, number> = {}

  const work = async () => {
    for (const feedId of ['12641', '4118']) {
      let total = 0
      for (let i = 0; i < 200; i++) {
        const { data: rows, error: selErr } = await supabase
          .from('tyre_products_cache')
          .select('id')
          .eq('feed_id', feedId)
          .limit(5000)
        if (selErr) { console.error('select err', feedId, selErr); break }
        if (!rows || rows.length === 0) break
        const ids = rows.map((r: any) => r.id)
        const { error: delErr } = await supabase
          .from('tyre_products_cache')
          .delete()
          .in('id', ids)
        if (delErr) { console.error('del err', feedId, delErr); break }
        total += rows.length
        if (rows.length < 5000) break
      }
      results[feedId] = total
      console.log(`Feed ${feedId} purged: ${total} rows`)
    }
  }

  // @ts-ignore
  try { EdgeRuntime.waitUntil(work()) } catch { work() }

  return new Response(JSON.stringify({ started: true }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
