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

export const ABUSE_SIGNAL_PORT = Symbol('ABUSE_SIGNAL_PORT');

export const DEVICE_BINDING_TTL_SECONDS = 72 * 60 * 60;
