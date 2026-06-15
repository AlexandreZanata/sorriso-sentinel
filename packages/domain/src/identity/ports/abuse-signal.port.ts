export interface AbuseSignalPort {
  isDeviceAlreadyRegistered(
    cityId: string,
    deviceBindingDigest: string,
  ): Promise<boolean>;

  registerDeviceBinding(
    cityId: string,
    deviceBindingDigest: string,
    ttlSeconds: number,
  ): Promise<void>;
}

export const DEVICE_BINDING_TTL_SECONDS = 72 * 60 * 60;
