import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { width, profile, rim, advertiserId } = await req.json()
    const targetId = parseInt(advertiserId) || 4118

    const listRes = await fetch(
      'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'
    )
    const feedList = await listRes.json()

    const feed = feedList.find((f: any) => parseInt(f.advertiserId) === targetId)
    if (!feed?.url) {
      return new Response(JSON.stringify({ products: [], error: 'no feed for ' + targetId }), 
        { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const feedRes = await fetch(feed.url)
    const csv = await feedRes.text()

    const rows = csv.split('\n').filter(r => r.trim())
    if (rows.length < 2) {
      return new Response(JSON.stringify({ products: [], error: 'empty feed' }), 
        { headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const splitRow = (row: string): string[] => {
      const cols: string[] = []
      let cur = '', inQ = false
      for (const ch of row) {
        if (ch === '"') inQ = !inQ
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
        else cur += ch
      }
      cols.push(cur.trim())
      return cols
    }

    const headers = splitRow(rows[0])
    const col = (name: string) => headers.findIndex(h => 
      h.toLowerCase().replace(/[^a-z]/g, '').includes(name.toLowerCase().replace(/[^a-z]/g, ''))
    )

    const ni = col('productname')
    const pi = col('searchprice')
    const ii = col('merchantimageurl')
    const ui = col('awdeeplink')
    const bi = col('brandname')
    const di = col('deliverycost')
    const idi = col('awproductid')

    const products = rows.slice(1)
      .map(splitRow)
      .filter(c => c[ni] && c[ni].toLowerCase().includes(width.toLowerCase()))
      .slice(0, 12)
      .map(c => ({
        id: c[idi] || crypto.randomUUID(),
        title: c[ni] || '',
        price: `£${parseFloat(c[pi] || '0').toFixed(2)}`,
        image: c[ii] || '',
        url: c[ui] || '',
        brand: c[bi] || '',
        shipping: !c[di] || c[di] === '0' ? 'Free delivery' : `£${c[di]} delivery`,
        supplierName: feed.advertiserName || '',
        advertiserId: String(targetId),
      }))

    return new Response(
      JSON.stringify({ products, total: rows.length - 1 }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    return new Response(
      JSON.stringify({ products: [], error: e.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})