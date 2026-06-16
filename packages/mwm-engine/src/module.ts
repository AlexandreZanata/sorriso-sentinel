import { NativeModulesProxy } from 'expo-modules-core';
import type {
  MwmDownloadProgress,
  MwmEngineInitOptions,
  MwmRegionDescriptor,
} from './types';

interface MwmEngineNativeModule {
  initializeEngine(options: MwmEngineInitOptions): Promise<boolean>;
  listInstalledRegions(): Promise<MwmRegionDescriptor[]>;
  downloadRegion(regionId: string): Promise<boolean>;
  getDownloadProgress(regionId: string): Promise<MwmDownloadProgress>;
}

const FALLBACK_PROGRESS: MwmDownloadProgress = {
  regionId: '',
  downloadedBytes: 0,
  totalBytes: 0,
  status: 'failed',
};

const fallbackModule: MwmEngineNativeModule = {
  async initializeEngine() {
    return false;
  },
  async listInstalledRegions() {
    return [];
  },
  async downloadRegion() {
    return false;
  },
  async getDownloadProgress(regionId: string) {
    return { ...FALLBACK_PROGRESS, regionId };
  },
};

export const MwmEngineModule: MwmEngineNativeModule =
  (NativeModulesProxy.MwmEngineModule as MwmEngineNativeModule | undefined) ??
  fallbackModule;
