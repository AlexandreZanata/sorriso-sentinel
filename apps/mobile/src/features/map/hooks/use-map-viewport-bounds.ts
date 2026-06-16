import { useCallback, useEffect, useRef, useState } from 'react';
import { MAP_CONFIG, type MapViewportBounds, SORRISO_DEFAULT_BOUNDS } from '@sorriso-sentinel/mwm-engine';

export function useMapViewportBounds() {
  const [bounds, setBounds] = useState<MapViewportBounds>(SORRISO_DEFAULT_BOUNDS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onBoundsChange = useCallback((nextBounds: MapViewportBounds) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setBounds(nextBounds);
    }, MAP_CONFIG.boundsDebounceMs);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    bounds,
    onBoundsChange,
  };
}
