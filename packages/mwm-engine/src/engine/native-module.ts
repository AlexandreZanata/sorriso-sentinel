import { requireNativeModule } from 'expo-modules-core';
import type { MwmPlacePage } from '../types/place-page';

export interface NativeMwmEngineModule {
  isNativeMapAvailable(): boolean;
  initializeEngine(options: Record<string, unknown>): Promise<boolean>;
  getWritableMapsPath(): Promise<string>;
  listInstalledRegions(): Promise<Array<Record<string, unknown>>>;
  downloadRegion(regionId: string): Promise<boolean>;
  getDownloadProgress(regionId: string): Promise<Record<string, unknown>>;
  reloadInstalledMaps(): Promise<boolean>;
  addListener(
    eventName: 'onPlacePageActivated' | 'onPlacePageDeactivated',
    listener: (event: Record<string, unknown>) => void,
  ): { remove: () => void };
}

let nativeModule: NativeMwmEngineModule | null | undefined;

export function getNativeMwmEngineModule(): NativeMwmEngineModule | null {
  if (nativeModule !== undefined) {
    return nativeModule;
  }

  try {
    nativeModule = requireNativeModule<NativeMwmEngineModule>('MwmEngineModule');
  } catch {
    nativeModule = null;
  }

  return nativeModule;
}

export function isNativeMapEngineAvailable(): boolean {
  const module = getNativeMwmEngineModule();

  if (!module) {
    return false;
  }

  try {
    return module.isNativeMapAvailable();
  } catch {
    return false;
  }
}

export function mapNativePlacePagePayload(
  payload: Record<string, unknown>,
): MwmPlacePage {
  return {
    featureId: typeof payload.featureId === 'string' ? payload.featureId : undefined,
    title: typeof payload.title === 'string' ? payload.title : 'Unknown place',
    subtitle: typeof payload.subtitle === 'string' ? payload.subtitle : undefined,
    secondaryTitle:
      typeof payload.secondaryTitle === 'string' ? payload.secondaryTitle : undefined,
    address: typeof payload.address === 'string' ? payload.address : undefined,
    latitude: typeof payload.latitude === 'number' ? payload.latitude : 0,
    longitude: typeof payload.longitude === 'number' ? payload.longitude : 0,
    phone: typeof payload.phone === 'string' ? payload.phone : undefined,
    website: typeof payload.website === 'string' ? payload.website : undefined,
    wikiDescription:
      typeof payload.wikiDescription === 'string' ? payload.wikiDescription : undefined,
    osmDescription:
      typeof payload.osmDescription === 'string' ? payload.osmDescription : undefined,
    isBookmark: payload.isBookmark === true,
    isMyPosition: payload.isMyPosition === true,
  };
}
