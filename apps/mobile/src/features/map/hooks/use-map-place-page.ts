import { useEffect, useState } from 'react';
import type { MwmPlacePage } from '@sorriso-sentinel/mwm-engine';
import { MwmEngineModule } from '@sorriso-sentinel/mwm-engine';

export function useMapPlacePage() {
  const [placePage, setPlacePage] = useState<MwmPlacePage | null>(null);

  useEffect(() => {
    const unsubscribe = MwmEngineModule.addPlacePageListener((place) => {
      setPlacePage(place);
    });

    return unsubscribe;
  }, []);

  return {
    placePage,
    dismissPlacePage: () => setPlacePage(null),
  };
}
