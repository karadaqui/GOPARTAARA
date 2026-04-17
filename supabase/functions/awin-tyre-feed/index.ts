import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEED_LIST_URL = 'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'

const splitCSV = (line: string): string[] => {
  const cols: string[] = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') inQ = !inQ
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
    else cur += ch
  }
  cols.push(cur.trim())
  return cols
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { width, advertiserId } = await req.json()
    const targetId = parseInt(advertiserId) || 4118

    const listRes = await fetch(FEED_LIST_URL)
    const listText = await listRes.text()

    let feedUrl = ''
    let advertiserName = ''

    try {
      const feedList = JSON.parse(listText)
      const feed = feedList.find((f: any) => parseInt(f.advertiserId) === targetId)
      feedUrl = feed?.url || ''
      advertiserName = feed?.advertiserName || ''
    } catch {
      const lines = listText.split('\n').filter(l => l.trim())
      const headers = splitCSV(lines[0])
      const idIdx = headers.findIndex(h => h.toLowerCase().includes('advertiserid'))
      const urlIdx = headers.findIndex(h => h.toLowerCase().includes('url'))
      const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name'))

      const feedRow = lines.slice(1)
        .map(splitCSV)
        .find(cols => parseInt(cols[idIdx]) === targetId)

      feedUrl = feedRow?.[urlIdx] || ''
      advertiserName = feedRow?.[nameIdx] || ''
    }

    if (!feedUrl) {
      return new Response(
        JSON.stringify({ products: [], error: 'no feed found for id: ' + targetId, listSample: listText.substring(0, 200) }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const feedRes = await fetch(feedUrl)
    const csv = await feedRes.text()
    const rows = csv.split('\n').filter(r => r.trim())

    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ products: [], error: 'empty feed', feedUrl }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const headers = splitCSV(rows[0])
    const col = (s: string) => headers.findIndex(h => 
      h.toLowerCase().replace(/[^a-z]/g,'').includes(s.replace(/[^a-z]/g,''))
    )

    const ni = col('productname'), pi = col('searchprice'),
          ii = col('merchantimageurl'), ui = col('awdeeplink'),
          bi = col('brandname'), di = col('deliverycost'), idi = col('awproductid')

    const products = rows.slice(1)
      .map(splitCSV)
      .filter(c => (c[ni] || '').toLowerCase().includes(width.toLowerCase()))
      .slice(0, 12)
      .map(c => ({
        id: c[idi] || crypto.randomUUID(),
        title: c[ni] || '',
        price: `£${parseFloat(c[pi] || '0').toFixed(2)}`,
        image: c[ii] || '',
        url: c[ui] || '',
        brand: c[bi] || '',
        shipping: !c[di] || c[di] === '0' ? 'Free delivery' : `£${c[di]} delivery`,
        supplierName: advertiserName,
        advertiserId: String(targetId),
      }))

    return new Response(
      JSON.stringify({ products, total: rows.length }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    return new Response(
      JSON.stringify({ products: [], error: e.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})