import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/SafeImage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Zap } from "lucide-react";

interface EvProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  affiliate_url: string;
  brand: string;
  category: string;
}

const CONNECTOR_TYPES = ["Type 1", "Type 2", "CCS", "CHAdeMO", "3-pin"] as const;
const CABLE_LENGTHS = ["3m", "5m", "7m", "10m"] as const;

export default function EvCharging() {
  const [products, setProducts] = useState<EvProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [connector, setConnector] = useState<string>("");
  const [length, setLength] = useState<string>("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("fetch-ev-king-products");
        if (error) throw error;
        if (active) setProducts(Array.isArray(data) ? data : (data?.products || []));
      } catch (e) {
        console.error("EV products load failed", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const haystack = `${p.name} ${p.description}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (connector && !haystack.includes(connector.toLowerCase())) return false;
      if (length && !haystack.includes(length.toLowerCase())) return false;
      return true;
    });
  }, [products, search, connector, length]);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Helmet>
        <title>EV Charging Cables & Accessories | GOPARTARA</title>
        <meta
          name="description"
          content="Find the right EV charging cable for your electric car. Type 1, Type 2, CCS, CHAdeMO and 3-pin cables for all UK and EU EV models."
        />
        <link rel="canonical" href="https://gopartara.com/ev-charging" />
      </Helmet>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-10">
          <Badge className="mb-4 bg-[#cc1111]/15 text-[#ff6b6b] border border-[#cc1111]/30 hover:bg-[#cc1111]/20">
            <Zap className="w-3 h-3 mr-1.5" />
            Powered by EV King — UK's leading EV accessories retailer
          </Badge>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3">
            EV Charging Cables &amp; Accessories
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl">
            Find the right charging cable for your electric car. All UK and EU EV models covered.
          </p>
        </header>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
          />
          <select
            value={connector}
            onChange={(e) => setConnector(e.target.value)}
            className="h-10 rounded-md bg-zinc-900 border border-zinc-800 text-white px-3 text-sm"
          >
            <option value="">All connector types</option>
            {CONNECTOR_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="h-10 rounded-md bg-zinc-900 border border-zinc-800 text-white px-3 text-sm"
          >
            <option value="">Any cable length</option>
            {CABLE_LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[360px] bg-zinc-900" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            No products match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <article
                key={p.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden flex flex-col hover:border-[#cc1111]/50 transition-colors"
              >
                <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
                  <SafeImage
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  {p.brand && (
                    <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
                      {p.brand}
                    </div>
                  )}
                  <h3 className="text-sm font-medium line-clamp-2 mb-2 min-h-[40px]">
                    {p.name}
                  </h3>
                  <div className="text-lg font-semibold text-white mb-3">{p.price}</div>
                  <a
                    href={p.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="mt-auto"
                  >
                    <Button className="w-full bg-[#cc1111] hover:bg-[#a50d0d] text-white">
                      View on EV King
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="text-xs text-zinc-600 mt-10 text-center">
          GOPARTARA may earn a commission on purchases made through links on this page.
        </p>
      </main>

      <Footer />
    </div>
  );
}
