import { useState, useRef, useEffect } from "react";
import { Bookmark, BookmarkCheck, Bell, BellRing, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { RecentViewItem } from "@/lib/recentViews";

interface RecentViewCardProps {
  item: RecentViewItem;
  savedIds: Set<string>;
  alertIds: Set<string>;
  onSaved: (id: string) => void;
  onAlertSet: (id: string) => void;
}

const currencySymbol = (c: string) => (c === "GBP" ? "£" : c === "EUR" ? "€" : "$");

const RecentViewCard = ({ item, savedIds, alertIds, onSaved, onAlertSet }: RecentViewCardProps) => {
  const { user } = useAuth();
  const [showAlertInput, setShowAlertInput] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const alertPanelRef = useRef<HTMLDivElement>(null);

  const isSaved = savedIds.has(item.id);
  const hasAlert = alertIds.has(item.id);
  const sym = currencySymbol(item.currency);

  // Close alert panel on click outside
  useEffect(() => {
    if (!showAlertInput) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (alertPanelRef.current && !alertPanelRef.current.contains(e.target as Node)) {
        setShowAlertInput(false);
        setAlertPrice("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAlertInput]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Sign in to save parts"); return; }
    if (isSaved) { toast.info("Part already saved"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("saved_parts").insert({
        user_id: user.id,
        part_name: item.title,
        part_number: item.id,
        price: parseFloat(item.price) || null,
        image_url: item.image,
        url: item.url,
        supplier: "eBay",
      });
      if (error) throw error;
      onSaved(item.id);
      toast.success("✅ Part saved!");
    } catch { toast.error("Failed to save part"); }
    setSaving(false);
  };

  const handleAlertClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Sign in to set price alerts"); return; }
    if (hasAlert) { toast.info("Alert already set for this part"); return; }
    const price = parseFloat(item.price) || 0;
    setAlertPrice(price > 0 ? (price * 0.9).toFixed(2) : "0.00");
    setShowAlertInput(true);
  };

  const increment = () => {
    const current = parseFloat(alertPrice) || 0;
    setAlertPrice((Math.round((current + 1) * 100) / 100).toFixed(2));
  };

  const decrement = () => {
    const current = parseFloat(alertPrice) || 0;
    if (current <= 0) return;
    setAlertPrice((Math.round((current - 1) * 100) / 100).toFixed(2));
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setAlertPrice(val);
    }
  };

  const confirmAlert = async () => {
    if (!user) return;
    const tp = parseFloat(alertPrice);
    if (!tp || tp <= 0) { toast.error("Enter a valid target price"); return; }
    try {
      const { error } = await supabase.from("price_alerts").insert({
        user_id: user.id,
        part_name: item.title,
        ebay_item_id: item.id,
        target_price: tp,
        current_price: parseFloat(item.price) || null,
        url: item.url,
        supplier: "eBay",
        email: user.email || "",
        image_url: item.image || null,
      });
      if (error) throw error;
      onAlertSet(item.id);
      setShowAlertInput(false);
      setAlertPrice("");
      toast.success("🔔 Alert set! We'll notify you when price drops.");
    } catch { toast.error("Failed to set alert"); }
  };

  return (
    <div className="group">
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-secondary mb-3">
          <img
            src={item.image}
            alt={item.title}
            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="px-1">
          <p className="text-xs text-muted-foreground font-medium leading-snug line-clamp-2 mb-1.5 group-hover:text-foreground transition-colors">
            {item.title}
          </p>
          <p className="text-sm font-bold text-foreground">
            {parseFloat(item.price) > 0 ? `${sym}${parseFloat(item.price).toFixed(2)}` : "View Price"}
          </p>
        </div>
      </a>

      {/* Action buttons */}
      <div className="flex gap-1 mt-2 px-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40 rounded-md transition-all"
        >
          {isSaved ? <BookmarkCheck size={11} className="text-yellow-500" /> : <Bookmark size={11} />}
          {isSaved ? "Saved" : "Save"}
        </button>
        <button
          onClick={handleAlertClick}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 rounded-md transition-all"
        >
          {hasAlert ? <BellRing size={11} className="text-destructive" /> : <Bell size={11} />}
          {hasAlert ? "Alert Set" : "Alert"}
        </button>
      </div>

      {/* Premium price alert input */}
      {showAlertInput && (
        <div ref={alertPanelRef} className="mt-2 p-3 bg-secondary border border-border/50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Set Price Alert
            </p>
            <button onClick={() => { setShowAlertInput(false); setAlertPrice(""); }} className="text-muted-foreground/50 hover:text-muted-foreground">
              <X size={14} />
            </button>
          </div>

          {parseFloat(item.price) > 0 && (
            <p className="text-[11px] text-muted-foreground/50 mb-2">
              Current price: <span className="text-muted-foreground">{sym}{parseFloat(item.price).toFixed(2)}</span>
            </p>
          )}

          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground font-medium">{sym}</span>
            <button
              onClick={decrement}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-all active:scale-95 text-lg font-light"
            >
              −
            </button>
            <input
              type="text"
              value={alertPrice}
              onChange={handleManualInput}
              onBlur={() => {
                const val = parseFloat(alertPrice);
                if (isNaN(val) || val < 0) setAlertPrice("0.00");
                else setAlertPrice(val.toFixed(2));
              }}
              className="flex-1 text-center bg-secondary border border-border rounded-lg py-1.5 text-foreground font-semibold text-sm focus:outline-none focus:border-destructive/50 transition-colors"
              placeholder="0.00"
              autoFocus
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            />
            <button
              onClick={increment}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-all active:scale-95 text-lg font-light"
            >
              +
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center mb-3">
            Alert when price drops below {sym}{alertPrice || "0.00"}
          </p>

          <button
            onClick={confirmAlert}
            disabled={!alertPrice || parseFloat(alertPrice) <= 0}
            className="w-full py-2 bg-destructive hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed text-destructive-foreground text-sm font-semibold rounded-lg transition-all active:scale-[0.98]"
          >
            🔔 Set Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentViewCard;
