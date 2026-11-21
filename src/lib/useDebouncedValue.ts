import { useEffect, useState } from "react";

// মান বদলানোর পর delayMs মিলিসেকেন্ড থামলে তবেই নতুন মান দেয় (search বাক্সে প্রতি অক্ষরে request ঠেকাতে)
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
