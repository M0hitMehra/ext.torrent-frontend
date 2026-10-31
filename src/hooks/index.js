import { useState, useEffect, useRef } from 'react';

/**
 * Generic data-fetching hook with loading/error state and pagination support.
 */
export function useFetch(fetchFn, deps = [], options = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFn()
      .then((res) => { if (!cancelled && mountedRef.current) { setData(res); setLoading(false); } })
      .catch((err) => { if (!cancelled && mountedRef.current) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = () => {
    setLoading(true);
    setError(null);
    fetchFn()
      .then((res) => { if (mountedRef.current) { setData(res); setLoading(false); } })
      .catch((err) => { if (mountedRef.current) { setError(err.message); setLoading(false); } });
  };

  return { data, loading, error, refetch };
}

/**
 * TV D-pad focus management hook.
 * Returns ref + focus/blur handlers that manage visual focus on TV.
 */
export function useTVFocus() {
  const [focused, setFocused] = useState(false);
  return {
    focused,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
}

/**
 * Debounce hook for search input.
 */
export function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
