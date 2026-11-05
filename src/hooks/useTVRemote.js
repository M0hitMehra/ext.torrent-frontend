import { useEffect, useRef } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';

/**
 * Universal Android TV remote key listener.
 * Receives native hardware D-pad events dispatched from MainActivity.
 */
export function useTVRemote(onKey, active = true) {
  const handlerRef = useRef(onKey);
  handlerRef.current = onKey;

  useEffect(() => {
    if (!active) return;
    if (!Platform.isTV && Platform.OS !== 'android') return;

    const sub = DeviceEventEmitter.addListener('onTVRemoteKey', (data) => {
      if (handlerRef.current) {
        handlerRef.current(data.eventType, data);
      }
    });

    return () => {
      sub.remove();
    };
  }, [active]);
}
