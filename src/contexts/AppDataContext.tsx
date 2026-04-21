import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AppData {
  profile: any | null;
  vehicles: any[];
  notifications: any[];
  conversations: any[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const AppDataContext = createContext<AppData>({
  profile: null,
  vehicles: [],
  notifications: [],
  conversations: [],
  isLoading: true,
  refresh: async () => {},
});

/**
 * Consolidates per-user data fetches (profile, vehicles, notifications,
 * conversations) into a single batch. Replaces 13+ duplicate per-page
 * queries across the app with one shared cache, dramatically reducing
 * Supabase round-trips on mobile.
 */
export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedForUser = useRef<string | null>(null);

  const fetchAll = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const [profileRes, vehiclesRes, notificationsRes, conversationsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("subscription_plan, bonus_searches, trial_ends_at, subscription_period, referral_code, display_name, avatar_url, email")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_vehicles")
          .select("id, make, model, year, nickname, mot_expiry_date, tax_expiry_date, registration_number, vin, engine_size")
          .eq("user_id", userId),
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("conversations")
          .select("id, buyer_id, seller_id, listing_id, created_at")
          .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`),
      ]);

      setProfile(profileRes.data ?? null);
      setVehicles(vehiclesRes.data ?? []);
      setNotifications(notificationsRes.data ?? []);
      setConversations(conversationsRes.data ?? []);
    } catch {
      // Silent fail — keep prior cache
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    await fetchAll(user.id);
  }, [user?.id, fetchAll]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      fetchedForUser.current = null;
      setProfile(null);
      setVehicles([]);
      setNotifications([]);
      setConversations([]);
      setIsLoading(false);
      return;
    }
    if (fetchedForUser.current === user.id) return;
    fetchedForUser.current = user.id;
    fetchAll(user.id);
  }, [user?.id, authLoading, fetchAll]);

  return (
    <AppDataContext.Provider
      value={{ profile, vehicles, notifications, conversations, isLoading, refresh }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
