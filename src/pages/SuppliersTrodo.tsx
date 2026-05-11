import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

export default function SuppliersTrodo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      <SEOHead title="Coming Soon | GOPARTARA" description="Coming soon." path="/suppliers/trodo" />
      <Navbar />

      <main className="pt-20 flex-1 flex items-center justify-center">
        <section className="container py-20 text-center max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Coming Soon</h1>
          <Button
            onClick={() => navigate("/search")}
            className="bg-[#cc1111] hover:bg-[#a50e0e] text-white h-11 px-6"
          >
            Back to Search →
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
