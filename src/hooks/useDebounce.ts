import { useEffect, useState } from 'react';

/**
 * Debounces a value by the specified delay.
 * Used for search inputs to avoid excessive API calls.
 * Default delay: 300ms.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
