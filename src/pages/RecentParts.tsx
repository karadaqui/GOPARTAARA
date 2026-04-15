import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  getRecentViews,
  clearRecentViews,
  type RecentViewItem,
} from "@/lib/recentViews";

const RecentParts = () => {
  const [items, setItems] = useState<RecentViewItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setItems(getRecentViews());
  }, []);

  const handleClear = () => {
    clearRecentViews();
    setItems([]);
    navigate("/");
  };

  const currencySymbol = (c: string) => (c === "GBP" ? "£" : c === "EUR" ? "€" : "$");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Recently Viewed Parts — PARTARA" description="Parts you've browsed recently on PARTARA." path="/recent" />
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">Recently Viewed Parts</h1>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={14} className="mr-1.5" /> Clear History
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            Parts you've browsed recently — click to view on eBay
          </p>

          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-20">No recently viewed parts yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-secondary mb-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="px-1">
                    <p className="text-xs text-muted-foreground font-medium leading-snug line-clamp-2 mb-1.5 group-hover:text-foreground transition-colors">
                      {item.title}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {currencySymbol(item.currency)}
                      {parseFloat(item.price).toFixed(2)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RecentParts;
