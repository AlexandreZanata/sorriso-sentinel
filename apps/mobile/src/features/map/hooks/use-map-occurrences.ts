import { useEffect, useState } from 'react';
import { getDefaultCityId } from '../../../api/config';
import { useSession } from '../../../session/session-context';
import {
  listMapOccurrences,
  type OccurrenceMapItem,
} from '../services/list-occurrences.service';

const DEFAULT_BBOX = {
  minLatitude: -12.58,
  maxLatitude: -12.51,
  minLongitude: -55.76,
  maxLongitude: -55.68,
};

export function useMapOccurrences() {
  const { sessionToken } = useSession();
  const [occurrences, setOccurrences] = useState<OccurrenceMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await listMapOccurrences({
          ...DEFAULT_BBOX,
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
  }, [sessionToken]);

  return {
    occurrences,
    isLoading,
    error,
  };
}
