import { useEffect, useRef, useState } from 'react';
import { getDefaultCityId } from '../../../api/config';
import { useSession } from '../../../session/session-context';
import type { MapViewportBounds } from '@sorriso-sentinel/mwm-engine';
import {
  listMapOccurrences,
  type OccurrenceMapItem,
} from '../services/list-occurrences.service';

export function useMapOccurrences(bounds: MapViewportBounds) {
  const { sessionToken } = useSession();
  const [occurrences, setOccurrences] = useState<OccurrenceMapItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (!sessionToken) {
      setOccurrences([]);
      setIsInitialLoading(false);
      return;
    }

    let active = true;

    async function load() {
      if (!hasLoadedOnce.current) {
        setIsInitialLoading(true);
      }

      setError(null);

      try {
        const data = await listMapOccurrences({
          ...bounds,
          cityId: getDefaultCityId(),
          token: sessionToken,
        });

        if (active) {
          setOccurrences(data);
          hasLoadedOnce.current = true;
        }
      } catch {
        if (active) {
          setError('map.loadError');
        }
      } finally {
        if (active) {
          setIsInitialLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [
    sessionToken,
    bounds.minLatitude,
    bounds.maxLatitude,
    bounds.minLongitude,
    bounds.maxLongitude,
  ]);

  return {
    occurrences,
    isInitialLoading,
    error,
  };
}
