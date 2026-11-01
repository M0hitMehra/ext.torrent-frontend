import { useState, useEffect, useRef, useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';

const { NativeClipboard } = NativeModules;

export function playTVFocusFeedback() {
  try {
    NativeClipboard?.playFocusSound?.();
    NativeClipboard?.triggerHaptic?.();
  } catch (_) {}
}

export function playTVSelectFeedback() {
  try {
    NativeClipboard?.playSelectSound?.();
    NativeClipboard?.triggerHaptic?.();
  } catch (_) {}
}

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
 * TV D-pad focus management hook with audio-haptic feedback.
 * Provides instant pointer highlight state and triggers native TV navigation ticks.
 */
export function useTVFocus(onCustomFocus) {
  const [focused, setFocused] = useState(false);

  const onFocus = useCallback(() => {
    setFocused(true);
    playTVFocusFeedback();
    if (onCustomFocus) onCustomFocus();
  }, [onCustomFocus]);

  const onBlur = useCallback(() => {
    setFocused(false);
  }, []);

  return {
    focused,
    onFocus,
    onBlur,
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
