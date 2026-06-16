export interface MwmEngineInitOptions {
  writablePath: string;
  cachePath: string;
  locale: string;
  dataVersion: number;
  metadataUrl: string;
}

export interface MwmRegionDescriptor {
  id: string;
  name: string;
  sizeBytes: number;
  version: number;
}

export interface MwmDownloadProgress {
  regionId: string;
  downloadedBytes: number;
  totalBytes: number;
  status: 'queued' | 'downloading' | 'finished' | 'failed';
}

export interface MwmOccurrencePin {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  category: string;
}
