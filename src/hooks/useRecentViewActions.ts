import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useRecentViewActions() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [alertIds, setAlertIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); setAlertIds(new Set()); return; }

    const fetchStatus = async () => {
      try {
        const [savedRes, alertRes] = await Promise.all([
          supabase.from("saved_parts").select("part_number").eq("user_id", user.id),
          supabase.from("price_alerts").select("ebay_item_id").eq("user_id", user.id).eq("active", true),
        ]);
        if (savedRes.data) setSavedIds(new Set(savedRes.data.map((r) => r.part_number).filter(Boolean) as string[]));
        if (alertRes.data) setAlertIds(new Set(alertRes.data.map((r) => r.ebay_item_id).filter(Boolean) as string[]));
      } catch {}
    };
    fetchStatus();
  }, [user]);

  const onSaved = useCallback((id: string) => setSavedIds((prev) => new Set(prev).add(id)), []);
  const onAlertSet = useCallback((id: string) => setAlertIds((prev) => new Set(prev).add(id)), []);

  return { savedIds, alertIds, onSaved, onAlertSet };
}
