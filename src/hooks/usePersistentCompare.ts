import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import type { CompareItem } from "@/components/PartsComparison";

const STORAGE_KEY = "gopartara_compare_list";

/**
 * useState-compatible hook that persists the compare list in sessionStorage.
 * - Survives page refresh
 * - Cleared when the browser tab is closed
 */
export function usePersistentCompare(): [CompareItem[], Dispatch<SetStateAction<CompareItem[]>>] {
  const [items, setItems] = useState<CompareItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as CompareItem[]) : [];
    } catch {
      return [];
    }
  });

  const isFirst = useRef(true);
  useEffect(() => {
    // Skip first run if items came from storage (avoids redundant write).
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    try {
      if (items.length === 0) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } catch {
      // ignore quota / disabled storage
    }
  }, [items]);

  return [items, setItems];
}
