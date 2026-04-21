import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of no changes. Use this to gate expensive side-effects (API calls,
 * filtering, autocomplete) on rapidly-changing input state, while keeping
 * the underlying input controlled and lag-free.
 *
 * @example
 * const [input, setInput] = useState("");
 * const debounced = useDebounce(input, 400);
 * useEffect(() => { if (debounced) doSearch(debounced); }, [debounced]);
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
