import type { AbuseSignalPort } from '../ports/abuse-signal.port.js';

export class DeviceAlreadyRegisteredError extends Error {
  constructor() {
    super('A user account already exists for this device in this city');
    this.name = 'DeviceAlreadyRegisteredError';
  }
}

export class SingleAccountPerDevicePolicy {
  static async assertUniqueDevice(params: {
    cityId: string;
    deviceBindingDigest: string;
    abuseSignal: AbuseSignalPort;
  }): Promise<void> {
    const alreadyRegistered = await params.abuseSignal.isDeviceAlreadyRegistered(
      params.cityId,
      params.deviceBindingDigest,
    );

    if (alreadyRegistered) {
      throw new DeviceAlreadyRegisteredError();
    }
  }
}
