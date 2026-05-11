import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

export default function SuppliersTrodo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      <SEOHead
        title="Trodo — Coming Soon | GOPARTARA"
        description="Trodo is joining GOPARTARA as an Elite Supplier. Check back soon to browse 4M+ parts directly in our search results."
        path="/suppliers/trodo"
      />
      <Navbar />

      <main className="pt-20 flex-1 flex items-center justify-center">
        <section className="container py-20 text-center max-w-2xl">
          <div className="text-5xl md:text-7xl font-black tracking-tight mb-6">TRODO</div>
          <div
            className="inline-block px-4 py-1.5 rounded-full mb-6"
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "#fbbf24",
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
            }}
          >
            ⭐ Elite Supplier — Coming Soon
          </div>
          <p className="text-zinc-300 text-lg leading-relaxed mb-8">
            Trodo is joining GOPARTARA as an Elite Supplier. Check back soon to browse 4M+ parts directly in our
            search results.
          </p>
          <Button
            onClick={() => navigate("/search")}
            className="bg-[#cc1111] hover:bg-[#a50e0e] text-white h-11 px-6"
          >
            Search Parts Now →
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
