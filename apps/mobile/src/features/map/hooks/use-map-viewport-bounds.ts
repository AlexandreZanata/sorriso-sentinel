import { useCallback, useEffect, useRef, useState } from 'react';
import { MAP_CONFIG, type MapViewportBounds, SORRISO_DEFAULT_BOUNDS } from '@sorriso-sentinel/mwm-engine';

const BOUNDS_EPSILON = 0.0001;

function boundsAreSimilar(left: MapViewportBounds, right: MapViewportBounds): boolean {
  return (
    Math.abs(left.minLatitude - right.minLatitude) < BOUNDS_EPSILON &&
    Math.abs(left.maxLatitude - right.maxLatitude) < BOUNDS_EPSILON &&
    Math.abs(left.minLongitude - right.minLongitude) < BOUNDS_EPSILON &&
    Math.abs(left.maxLongitude - right.maxLongitude) < BOUNDS_EPSILON
  );
}

export function useMapViewportBounds() {
  const [bounds, setBounds] = useState<MapViewportBounds>(SORRISO_DEFAULT_BOUNDS);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestBounds = useRef(bounds);

  const onBoundsChange = useCallback((nextBounds: MapViewportBounds) => {
    if (boundsAreSimilar(latestBounds.current, nextBounds)) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      latestBounds.current = nextBounds;
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
