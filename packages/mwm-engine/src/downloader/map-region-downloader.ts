import * as FileSystem from 'expo-file-system/legacy';
import type { DownloadProgressData } from 'expo-file-system/legacy';
import type {
  MwmDownloadProgress,
  MwmEngineInitOptions,
  MwmRegionCatalogEntry,
  MwmRegionDescriptor,
} from '../types';
import {
  buildCountriesCatalogPath,
  buildMwmDownloadUrls,
} from './build-download-url';
import {
  DEFAULT_CDN_SERVERS,
  DEFAULT_DATA_VERSION,
  METASERVER_URL,
  MWM_ENGINE_APP_VERSION,
  MWM_FILE_EXTENSION,
} from './constants';
import {
  buildCoMapsRegionDirectory,
  buildCoMapsRegionFilePath,
} from './comaps-storage';
import { joinUrl } from './join-url';
import { parseCountriesCatalog } from './parse-countries-catalog';
import { parseMetaConfig } from './parse-meta-config';
import { verifyRegionFile } from './verify-region-file';

type ProgressCallback = (data: DownloadProgressData) => void;

export class MapRegionDownloader {
  private options: MwmEngineInitOptions | null = null;
  private servers: string[] = [...DEFAULT_CDN_SERVERS];
  private catalogDataVersion = 0;
  private progressByRegion = new Map<string, MwmDownloadProgress>();
  private activeDownloads = new Map<string, ReturnType<typeof FileSystem.createDownloadResumable>>();

  async initialize(options: MwmEngineInitOptions): Promise<boolean> {
    this.options = options;
    await this.refreshServers();
    await this.loadCatalog();
    return true;
  }

  async listInstalledRegions(): Promise<MwmRegionDescriptor[]> {
    const regions: MwmRegionDescriptor[] = [];
    const seen = new Set<string>();

    const roots = this.getStorageRoots();

    for (const root of roots) {
      const entries = await FileSystem.readDirectoryAsync(root.path).catch(() => []);

      for (const entry of entries) {
        if (!entry.endsWith(MWM_FILE_EXTENSION)) {
          continue;
        }

        const regionId = entry.slice(0, -MWM_FILE_EXTENSION.length);

        if (seen.has(regionId)) {
          continue;
        }

        const info = await FileSystem.getInfoAsync(`${root.path}/${entry}`);

        if (!info.exists || typeof info.size !== 'number') {
          continue;
        }

        seen.add(regionId);
        regions.push({
          id: regionId,
          name: regionId,
          sizeBytes: info.size,
          version: root.dataVersion,
        });
      }
    }

    return regions;
  }

  async downloadRegion(regionId: string): Promise<boolean> {
    if (!this.options) {
      return false;
    }

    const region = await this.getCatalogRegion(regionId);

    if (!region) {
      this.setProgress(regionId, {
        regionId,
        downloadedBytes: 0,
        totalBytes: 0,
        status: 'failed',
      });
      return false;
    }

    const existing = this.progressByRegion.get(regionId);

    if (existing?.status === 'downloading' || existing?.status === 'finished') {
      return existing.status === 'finished';
    }

    this.setProgress(regionId, {
      regionId,
      downloadedBytes: 0,
      totalBytes: region.sizeBytes,
      status: 'downloading',
    });

    const storageDir = this.getStorageDirectory();
    const targetPath = this.getRegionFilePath(regionId);

    if (!storageDir || !targetPath) {
      this.setProgress(regionId, {
        regionId,
        downloadedBytes: 0,
        totalBytes: region.sizeBytes,
        status: 'failed',
      });
      return false;
    }

    await FileSystem.makeDirectoryAsync(storageDir, { intermediates: true });

    const urls = buildMwmDownloadUrls(this.servers, regionId, this.catalogDataVersion);
    const downloaded = await this.downloadWithFailover(
      regionId,
      urls,
      targetPath,
      region.sizeBytes,
    );

    if (!downloaded) {
      this.setProgress(regionId, {
        regionId,
        downloadedBytes: 0,
        totalBytes: region.sizeBytes,
        status: 'failed',
      });
      return false;
    }

    const verified = await verifyRegionFile(
      targetPath,
      region.sizeBytes,
      region.sha1Base64,
    );

    if (!verified) {
      await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => undefined);
      this.setProgress(regionId, {
        regionId,
        downloadedBytes: 0,
        totalBytes: region.sizeBytes,
        status: 'failed',
      });
      return false;
    }

    this.setProgress(regionId, {
      regionId,
      downloadedBytes: region.sizeBytes,
      totalBytes: region.sizeBytes,
      status: 'finished',
    });

    return true;
  }

  getDownloadProgress(regionId: string): MwmDownloadProgress {
    return (
      this.progressByRegion.get(regionId) ?? {
        regionId,
        downloadedBytes: 0,
        totalBytes: 0,
        status: 'queued',
      }
    );
  }

  async getRegionCatalogEntry(regionId: string): Promise<MwmRegionCatalogEntry | null> {
    const region = await this.getCatalogRegion(regionId);

    if (!region) {
      return null;
    }

    return {
      id: region.id,
      sizeBytes: region.sizeBytes,
      sha1Base64: region.sha1Base64,
    };
  }

  private async refreshServers(): Promise<void> {
    const dataVersion = String(this.getDataVersion());
    const response = await fetch(joinUrl(METASERVER_URL, 'servers'), {
      headers: {
        Accept: 'application/json',
        'Accept-Language': this.options?.locale ?? 'en',
        'X-OM-DataVersion': dataVersion,
        'X-OM-AppVersion': MWM_ENGINE_APP_VERSION,
      },
    }).catch(() => null);

    if (!response?.ok) {
      return;
    }

    const config = parseMetaConfig(await response.text());

    if (config) {
      this.servers = config.servers;
    }
  }

  private async loadCatalog(): Promise<void> {
    if (!this.options || this.servers.length === 0) {
      return;
    }

    const relativePath = buildCountriesCatalogPath(this.getDataVersion());
    const catalogText = await this.fetchTextWithFailover(relativePath);

    if (!catalogText) {
      return;
    }

    const catalog = parseCountriesCatalog(catalogText);

    if (catalog) {
      this.catalogDataVersion = catalog.dataVersion;
    }
  }

  private async getCatalogRegion(regionId: string) {
    if (!this.options) {
      return null;
    }

    const relativePath = buildCountriesCatalogPath(this.getDataVersion());
    const catalogText = await this.fetchTextWithFailover(relativePath);

    if (!catalogText) {
      return null;
    }

    const catalog = parseCountriesCatalog(catalogText);

    if (!catalog) {
      return null;
    }

    this.catalogDataVersion = catalog.dataVersion;
    return catalog.regions.get(regionId) ?? null;
  }

  private async fetchTextWithFailover(relativePath: string): Promise<string | null> {
    for (const server of this.servers) {
      const response = await fetch(joinUrl(server, relativePath)).catch(() => null);

      if (response?.ok) {
        return response.text();
      }
    }

    return null;
  }

  private async downloadWithFailover(
    regionId: string,
    urls: string[],
    targetPath: string,
    totalBytes: number,
  ): Promise<boolean> {
    for (const url of urls) {
      const success = await this.downloadSingleUrl(regionId, url, targetPath, totalBytes);

      if (success) {
        return true;
      }
    }

    return false;
  }

  private async downloadSingleUrl(
    regionId: string,
    url: string,
    targetPath: string,
    totalBytes: number,
  ): Promise<boolean> {
    const callback: ProgressCallback = (event) => {
      this.setProgress(regionId, {
        regionId,
        downloadedBytes: event.totalBytesWritten,
        totalBytes: event.totalBytesExpectedToWrite || totalBytes,
        status: 'downloading',
      });
    };

    const download = FileSystem.createDownloadResumable(url, targetPath, {}, callback);
    this.activeDownloads.set(regionId, download);

    try {
      const result = await download.downloadAsync();

      if (!result) {
        return false;
      }

      const info = await FileSystem.getInfoAsync(result.uri);

      if (!info.exists || typeof info.size !== 'number' || info.size !== totalBytes) {
        await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => undefined);
        return false;
      }

      return true;
    } catch {
      await FileSystem.deleteAsync(targetPath, { idempotent: true }).catch(() => undefined);
      return false;
    } finally {
      this.activeDownloads.delete(regionId);
    }
  }

  private getDataVersion(): number {
    if (!this.options || this.options.dataVersion <= 0) {
      return DEFAULT_DATA_VERSION;
    }

    return this.catalogDataVersion > 0
      ? this.catalogDataVersion
      : this.options.dataVersion;
  }

  private getMapsBaseDirectory(): string {
    if (!this.options) {
      return '';
    }

    if (this.options.writablePath.startsWith('/')) {
      return this.options.writablePath.endsWith('/')
        ? this.options.writablePath
        : `${this.options.writablePath}/`;
    }

    return FileSystem.documentDirectory ?? '';
  }

  private getStorageDirectory(): string | null {
    const baseDirectory = this.getMapsBaseDirectory();

    if (!baseDirectory) {
      return null;
    }

    return buildCoMapsRegionDirectory(baseDirectory, this.getDataVersion());
  }

  private getRegionFilePath(regionId: string): string | null {
    const baseDirectory = this.getMapsBaseDirectory();

    if (!baseDirectory) {
      return null;
    }

    return buildCoMapsRegionFilePath(
      baseDirectory,
      this.getDataVersion(),
      regionId,
    );
  }

  private getStorageRoots(): Array<{ path: string; dataVersion: number }> {
    if (!this.options) {
      return [];
    }

    const dataVersion = this.getDataVersion();
    const baseDirectory = this.getMapsBaseDirectory();
    const roots: Array<{ path: string; dataVersion: number }> = [];

    if (baseDirectory) {
      roots.push({
        path: buildCoMapsRegionDirectory(baseDirectory, dataVersion),
        dataVersion,
      });
    }

    if (FileSystem.documentDirectory && this.options.writablePath && !this.options.writablePath.startsWith('/')) {
      roots.push({
        path: `${FileSystem.documentDirectory}${this.options.writablePath}/`,
        dataVersion,
      });
    }

    return roots.filter(
      (root, index, all) => all.findIndex((entry) => entry.path === root.path) === index,
    );
  }

  private setProgress(regionId: string, progress: MwmDownloadProgress): void {
    this.progressByRegion.set(regionId, progress);
  }
}
