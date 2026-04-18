import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
const FEEDS: Record<string,{url:string,cur:string}> = {
'4118':{cur:'£',url:'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost'},
'10499':{cur:'€',url:'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/23179/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/'},
'10747':{cur:'€',url:'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/66605/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/'},
'12716':{cur:'€',url:'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93986/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/'},
'12715':{cur:'£',url:'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93988/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost'},
}
function csv(line:string){const r:string[]=[];let c='',q=false;for(const ch of line){if(ch==='"')q=!q;else if(ch===','&&!q){r.push(c.trim());c=''}else c+=ch}r.push(c.trim());return r}
serve(async(req)=>{
if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
try{
const{width,advertiserId}=await req.json()
const isDebug = String(advertiserId).startsWith('debug_')
const actualId = isDebug ? String(advertiserId).replace('debug_', '') : String(advertiserId)
const skipWidthFilter = String(actualId) === '12715'
const feed=FEEDS[actualId]
if(!feed)return new Response(JSON.stringify({products:[],error:'unknown'}),{headers:{...cors,'Content-Type':'application/json'}})
const res=await fetch(feed.url)
if(!res.body)throw new Error('nobody')
const reader=res.body.getReader()
const dec=new TextDecoder()
let buf='',hdrs:string[]=[],lc=0
const prods:any[]=[]
let ni=-1,pi=-1,ii=-1,ui=-1,bi=-1,di=-1,idi=-1

// DEBUG MODE: collect first 3 raw lines
if(isDebug){
const rawLines:string[]=[]
while(rawLines.length<3){
const{done,value}=await reader.read()
if(done)break
buf+=dec.decode(value,{stream:true})
const lines=buf.split('\n')
buf=lines.pop()||''
for(const line of lines){
if(!line.trim())continue
rawLines.push(line)
if(rawLines.length>=3)break
}
}
reader.cancel().catch(()=>{})
return new Response(JSON.stringify({rawLines,products:[]}),{headers:{...cors,'Content-Type':'application/json'}})
}

// NORMAL MODE: process products
loop:while(lc<500000){
const{done,value}=await reader.read()
if(done)break
buf+=dec.decode(value,{stream:true})
const lines=buf.split('\n');buf=lines.pop()||''
for(const line of lines){
if(!line.trim())continue;lc++
const cols=csv(line)
if(lc===1){
hdrs=cols.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,''))
ni=hdrs.indexOf('productname');if(ni<0)ni=hdrs.findIndex(h=>h.includes('productname'))
pi=hdrs.indexOf('searchprice');if(pi<0)pi=hdrs.findIndex(h=>h.includes('searchprice')||h.includes('price'))
ii=hdrs.indexOf('merchantimageurl');if(ii<0)ii=hdrs.findIndex(h=>h.includes('imageurl')||h.includes('image'))
ui=hdrs.indexOf('awdeeplink');if(ui<0)ui=hdrs.findIndex(h=>h.includes('deeplink')||h.includes('awdeep'))
bi=hdrs.indexOf('brandname');if(bi<0)bi=hdrs.findIndex(h=>h.includes('brand'))
di=hdrs.indexOf('deliverycost');if(di<0)di=hdrs.findIndex(h=>h.includes('delivery'))
idi=hdrs.indexOf('awproductid');if(idi<0)idi=hdrs.findIndex(h=>h.includes('productid')||h.includes('awproduct'))
console.log('ADV:',actualId,'ni:',ni,'pi:',pi,'ii:',ii,'ui:',ui,'hdrs:',hdrs.slice(0,8))
continue
}
if(ni<0||pi<0)continue
const name=(cols[ni]||'').toLowerCase()
if(!skipWidthFilter && !name.includes(String(width).toLowerCase()))continue
const rawPrice=parseFloat(cols[pi]||'0')
if(rawPrice<=0)continue
const imgVal=cols[ii]||''
const urlVal=cols[ui]||''
const isImgUrl=(v:string)=>v.includes('.jpg')||v.includes('.png')||v.includes('.webp')||v.includes('image.')||v.includes('/tyre-p')
const actualImg=isImgUrl(imgVal)?imgVal:(isImgUrl(urlVal)?urlVal:'')
const actualUrl=(!isImgUrl(urlVal)&&urlVal.startsWith('http'))?urlVal:((!isImgUrl(imgVal)&&imgVal.startsWith('http'))?imgVal:'')
if(!actualUrl)continue
const del=cols[di]||''
prods.push({
id:cols[idi]||String(lc),
title:cols[ni]||'',
price:`${feed.cur}${rawPrice.toFixed(2)}`,
image:actualImg,
url:actualUrl,
brand:cols[bi]||'',
shipping:!del||del==='0'?'Free delivery':`${feed.cur}${parseFloat(del).toFixed(2)} delivery`,
advertiserId:actualId,
currency:feed.cur,
})
if(prods.length>=24)break loop
}}
reader.cancel().catch(()=>{})
return new Response(JSON.stringify({products:prods}),{headers:{...cors,'Content-Type':'application/json'}})
}catch(e:any){return new Response(JSON.stringify({products:[],error:e.message}),{status:500,headers:{...cors,'Content-Type':'application/json'}})}
})