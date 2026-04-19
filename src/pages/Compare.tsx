import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import SafeImage from "@/components/SafeImage";

export interface CompareItem {
  id: string;
  title: string;
  image?: string;
  price?: string;
  condition?: string;
  supplier?: string;
  shipping?: string;
  rating?: string;
  url?: string;
  [key: string]: string | undefined;
}

const STORAGE_KEY = "partara_compare";
export const MAX_COMPARE_ITEMS = 4;

export const getCompareItems = (): CompareItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompareItem[]) : [];
  } catch {
    return [];
  }
};

export const setCompareItems = (items: CompareItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_COMPARE_ITEMS)));
    window.dispatchEvent(new Event("partara_compare_changed"));
  } catch {
    /* ignore quota */
  }
};

export const toggleCompareItem = (item: CompareItem): CompareItem[] => {
  const current = getCompareItems();
  const exists = current.find((i) => i.id === item.id);
  let next: CompareItem[];
  if (exists) {
    next = current.filter((i) => i.id !== item.id);
  } else if (current.length >= MAX_COMPARE_ITEMS) {
    return current;
  } else {
    next = [...current, item];
  }
  setCompareItems(next);
  return next;
};

const ROWS: { label: string; key: keyof CompareItem }[] = [
  { label: "Condition", key: "condition" },
  { label: "Supplier", key: "supplier" },
  { label: "Shipping", key: "shipping" },
  { label: "Rating", key: "rating" },
];

const Compare = () => {
  const [compareItems, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    setItems(getCompareItems());
    const handler = () => setItems(getCompareItems());
    window.addEventListener("partara_compare_changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("partara_compare_changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const removeFromCompare = (id: string) => {
    const next = getCompareItems().filter((i) => i.id !== id);
    setCompareItems(next);
    setItems(next);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Compare Car Parts — GOPARTARA"
        description="Compare car part prices, condition, shipping and supplier ratings side by side. Make smarter decisions before you buy."
        path="/compare"
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="px-4 py-12 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl font-bold mb-2">Compare Parts</h1>
            <p className="text-muted-foreground text-sm">
              Compare prices, condition and specs side by side
            </p>
          </div>

          {compareItems.length === 0 && (
            <div className="text-center py-24">
              <span className="text-6xl mb-6 block" aria-hidden="true">
                ⚖️
              </span>
              <h2 className="font-display font-bold text-xl mb-3">Nothing to compare yet</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Search for parts and click the compare button (⚖️) on any product card to add it here.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-xl transition-all text-sm"
              >
                Search Parts →
              </Link>
            </div>
          )}

          {compareItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <td className="w-32 p-3 text-muted-foreground text-xs font-semibold uppercase">
                      Feature
                    </td>
                    {compareItems.map((item) => (
                      <th key={item.id} className="p-3 min-w-[200px] align-top">
                        <div className="bg-card border border-border rounded-2xl p-4 text-left">
                          <div className="w-full h-32 mb-3 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                            <SafeImage
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <p className="font-bold text-sm line-clamp-2 mb-1">{item.title}</p>
                          {item.price && (
                            <p className="text-primary font-black text-lg">{item.price}</p>
                          )}
                          <button
                            onClick={() => removeFromCompare(item.id)}
                            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Remove ×
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {ROWS.map((row) => (
                    <tr key={row.label} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground text-xs font-semibold">
                        {row.label}
                      </td>
                      {compareItems.map((item) => (
                        <td key={item.id} className="p-3 text-sm text-center">
                          {item[row.key] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-3 text-muted-foreground text-xs font-semibold">Action</td>
                    {compareItems.map((item) =>
                      item.url ? (
                        <td key={item.id} className="p-3 text-center">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl transition-all"
                          >
                            View Deal →
                          </a>
                        </td>
                      ) : (
                        <td key={item.id} className="p-3 text-center text-muted-foreground text-xs">
                          —
                        </td>
                      )
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Compare;
