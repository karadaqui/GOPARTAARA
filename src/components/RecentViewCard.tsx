import { useState, useRef, useEffect } from "react";
import { Bookmark, BookmarkCheck, Bell, BellRing } from "lucide-react";
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
        <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-secondary mb-3">
          <img
            src={item.image}
            alt={item.title}
            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
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
          aria-label="Save this part"
          className="flex-1 flex items-center justify-center gap-1 min-h-[44px] py-1.5 text-[11px] text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/40 rounded-md transition-colors"
        >
          {isSaved ? <BookmarkCheck size={11} className="text-yellow-500" /> : <Bookmark size={11} />}
          {isSaved ? "Saved" : "Save"}
        </button>
        <button
          onClick={handleAlertClick}
          aria-label="Set price alert"
          className="flex-1 flex items-center justify-center gap-1 min-h-[44px] py-1.5 text-[11px] text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 rounded-md transition-colors"
        >
          {hasAlert ? <BellRing size={11} className="text-destructive" /> : <Bell size={11} />}
          {hasAlert ? "Alert Set" : "Alert"}
        </button>
      </div>

      {/* Premium price alert input */}
      {showAlertInput && (
        <div ref={alertPanelRef} className="mt-2 p-3 bg-secondary border border-border/50 rounded-xl w-full overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Set Price Alert
            </p>
            <button
              onClick={() => { setShowAlertInput(false); setAlertPrice(""); }}
              className="text-muted-foreground/50 hover:text-muted-foreground text-lg leading-none"
            >
              ×
            </button>
          </div>

          {parseFloat(item.price) > 0 && (
            <p className="text-[11px] text-muted-foreground/50 mb-2">
              Current: <span className="text-muted-foreground font-medium">{sym}{parseFloat(item.price).toFixed(2)}</span>
            </p>
          )}

          <div className="flex items-center gap-1.5 mb-2 w-full">
            <button
              onClick={() => {
                const v = Math.max(0, parseFloat(alertPrice || "0") - 1);
                setAlertPrice(v.toFixed(2));
              }}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border border-border bg-secondary text-foreground text-xl font-light hover:bg-muted active:scale-95 transition-[colors,transform] select-none"
            >
              −
            </button>
            <div className="flex-1 relative min-w-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                {sym}
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={alertPrice}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (isNaN(v) || v < 0) setAlertPrice("0.00");
                  else setAlertPrice(v.toFixed(2));
                }}
                onKeyDown={(e) => {
                  if (e.key === "-") e.preventDefault();
                  if (e.key === "Enter") confirmAlert();
                }}
                className="w-full pl-7 pr-2 py-1.5 bg-secondary border border-border rounded-lg text-foreground text-sm font-semibold text-center focus:outline-none focus:border-destructive/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              />
            </div>
            <button
              onClick={() => {
                const v = parseFloat(alertPrice || "0") + 1;
                setAlertPrice(v.toFixed(2));
              }}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg border border-border bg-secondary text-foreground text-xl font-light hover:bg-muted active:scale-95 transition-[colors,transform] select-none"
            >
              +
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center mb-2.5">
            Notify me when below {sym}{alertPrice || "0.00"}
          </p>

          <button
            onClick={confirmAlert}
            disabled={!alertPrice || parseFloat(alertPrice) <= 0}
            className="w-full py-2 rounded-lg bg-destructive hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed text-destructive-foreground text-sm font-semibold transition-[colors,transform] active:scale-[0.98]"
          >
            🔔 Set Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentViewCard;
