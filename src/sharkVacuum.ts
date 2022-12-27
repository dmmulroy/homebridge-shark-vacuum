import { DeviceProperties, SharkAPIClient } from './sharkApi';

export class SharkVacuum {
  constructor(
    private readonly api: SharkAPIClient,
    public readonly properties: DeviceProperties,
  ) {}

  async getOperatingMode() {
    const operatingMode = await this.api.getDeviceProperty(
      this.properties.serialNumber,
      'Operating_Mode',
    );
  }

  async clean() {
    await this.api.setDeviceProperty(
      this.properties.serialNumber,
      'Operating_Mode',
      2,
    );
  }

  async stop() {
    await this.api.setDeviceProperty(
      this.properties.serialNumber,
      'Operating_Mode',
      3,
    );
  }

  async pause() {
    await this.api.setDeviceProperty(
      this.properties.serialNumber,
      'Operating_Mode',
      0,
    );
  }

  async locate() {
    await this.api.setDeviceProperty(
      this.properties.serialNumber,
      'Find_Device',
      1,
    );
  }
}
