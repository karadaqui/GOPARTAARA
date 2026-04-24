import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  clearRecentViews,
  type RecentViewItem,
} from "@/lib/recentViews";
import RecentViewCard from "@/components/RecentViewCard";
import { useRecentViewActions } from "@/hooks/useRecentViewActions";

const RecentParts = () => {
  const [items, setItems] = useState<RecentViewItem[]>([]);
  const navigate = useNavigate();
  const { savedIds, alertIds, onSaved, onAlertSet } = useRecentViewActions();

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem('partara_recent_views');
        setItems(stored ? JSON.parse(stored) : []);
      } catch { setItems([]); }
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const handleClear = () => {
    clearRecentViews();
    setItems([]);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Recently Viewed Parts — GOPARTARA" description="Parts you've browsed recently on GOPARTARA." path="/recent" noindex />
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-6xl mx-auto">
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
                <RecentViewCard
                  key={item.id}
                  item={item}
                  savedIds={savedIds}
                  alertIds={alertIds}
                  onSaved={onSaved}
                  onAlertSet={onAlertSet}
                />
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground/40 text-center mt-12">
            Items appear here after you view parts on eBay
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RecentParts;
