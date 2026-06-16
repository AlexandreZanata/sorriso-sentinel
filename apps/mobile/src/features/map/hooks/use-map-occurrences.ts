import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../api/errors';
import { getDefaultCityId } from '../../../api/config';
import { useSession } from '../../../session/session-context';
import { SORRISO_DEFAULT_BOUNDS } from '@sorriso-sentinel/mwm-engine';
import { runSessionBootstrap } from '../../bootstrap/bootstrap-session.service';
import { resetApiBaseUrlCache } from '../../../api/resolve-api-base-url';
import {
  listMapOccurrences,
  type OccurrenceMapItem,
} from '../services/list-occurrences.service';

export function useMapOccurrences() {
  const { sessionToken, clearSession, setSessionTokenState } = useSession();
  const [occurrences, setOccurrences] = useState<OccurrenceMapItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const isLoadingRef = useRef(false);

  const retry = useCallback(() => {
    resetApiBaseUrlCache();
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!sessionToken) {
      setOccurrences([]);
      setError(null);
      return;
    }

    let active = true;

    async function load() {
      if (isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;
      setError(null);

      try {
        const data = await listMapOccurrences({
          ...SORRISO_DEFAULT_BOUNDS,
          cityId: getDefaultCityId(),
          token: sessionToken,
        });

        if (active) {
          setOccurrences(data);
        }
      } catch (caught) {
        if (!active) {
          return;
        }

        if (caught instanceof ApiError && caught.status === 401) {
          await clearSession();
          resetApiBaseUrlCache();

          try {
            const freshToken = await runSessionBootstrap();
            setSessionTokenState(freshToken);
            return;
          } catch {
            setError('errors.sessionExpired');
            return;
          }
        }

        if (caught instanceof ApiError && caught.i18nKey) {
          setError(caught.i18nKey);
          return;
        }

        setError('map.loadError');
      } finally {
        isLoadingRef.current = false;
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [sessionToken, clearSession, setSessionTokenState, reloadToken]);

  return {
    occurrences,
    error,
    retry,
  };
}
