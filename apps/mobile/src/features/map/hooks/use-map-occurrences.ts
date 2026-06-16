import { useEffect, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionToken) {
      setOccurrences([]);
      setIsLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await listMapOccurrences({
          ...bounds,
          cityId: getDefaultCityId(),
          token: sessionToken,
        });

        if (active) {
          setOccurrences(data);
        }
      } catch {
        if (active) {
          setError('map.loadError');
        }
      } finally {
        if (active) {
          setIsLoading(false);
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
    isLoading,
    error,
  };
}
