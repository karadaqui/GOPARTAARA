import { useState } from "react";
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
  const [targetPrice, setTargetPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const isSaved = savedIds.has(item.id);
  const hasAlert = alertIds.has(item.id);

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
    setShowAlertInput(!showAlertInput);
  };

  const confirmAlert = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const tp = parseFloat(targetPrice);
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
      } as any);
      if (error) throw error;
      onAlertSet(item.id);
      setShowAlertInput(false);
      setTargetPrice("");
      toast.success("🔔 Alert set! We'll notify you when price drops.");
    } catch { toast.error("Failed to set alert"); }
  };

  const sym = currencySymbol(item.currency);

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

      {/* Price alert input */}
      {showAlertInput && (
        <div className="mt-1 px-1 flex gap-1">
          <input
            type="number"
            placeholder={`Target ${sym}`}
            className="flex-1 bg-secondary border border-border rounded text-xs px-2 py-1 text-foreground"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          />
          <button
            onClick={confirmAlert}
            className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded hover:bg-destructive/90"
          >
            Set
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentViewCard;
