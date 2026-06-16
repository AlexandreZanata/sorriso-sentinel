/**
 * Mirrors CoMaps `place_page::Info` / Android `MapObject` fields exposed to UI.
 * Populated by native Framework on POI tap (Phase 3) or by app adapters until then.
 */
export interface MwmPlacePage {
  featureId?: string;
  title: string;
  subtitle?: string;
  secondaryTitle?: string;
  secondarySubtitle?: string;
  address?: string;
  latitude: number;
  longitude: number;
  rawTypes?: string[];
  phone?: string;
  website?: string;
  openingHours?: string;
  wikiDescription?: string;
  osmDescription?: string;
  isBookmark?: boolean;
  isMyPosition?: boolean;
}
