import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, parseISO, isValid } from "date-fns";

/** On login, check vehicles for upcoming MOT/Tax expiry and create notifications */
export const useMotTaxReminders = () => {
  const { user } = useAuth();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;

    const check = async () => {
      try {
        const { data: vehicles } = await supabase
          .from("user_vehicles")
          .select("id, make, model, year, mot_expiry_date, tax_expiry_date" as any)
          .eq("user_id", user.id);

        if (!vehicles || vehicles.length === 0) return;

        for (const v of vehicles as any[]) {
          const name = `${v.make} ${v.model} ${v.year}`;

          for (const { field, label } of [
            { field: "mot_expiry_date", label: "MOT" },
            { field: "tax_expiry_date", label: "Road Tax" },
          ]) {
            const dateStr = v[field];
            if (!dateStr) continue;
            const date = parseISO(dateStr);
            if (!isValid(date)) continue;
            const days = differenceInDays(date, new Date());

            if (days > 30) continue;

            const title = days < 0
              ? `❌ ${label} Expired`
              : `⚠️ ${label} Reminder`;
            const message = days < 0
              ? `${name} ${label} has expired! Please renew immediately.`
              : `${name} ${label} expires in ${days} days. Don't forget to book!`;

            // Check if we already sent this notification today
            const today = new Date().toISOString().slice(0, 10);
            const { count } = await supabase
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("title", title)
              .gte("created_at", today);

            if ((count || 0) > 0) continue;

            await supabase.from("notifications").insert({
              user_id: user.id,
              title,
              message,
              type: "reminder",
              link: "/garage",
            });
          }
        }
      } catch {
        // silently ignore
      }
    };

    check();
  }, [user]);
};
