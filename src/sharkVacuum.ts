import { SharkAPIClient } from './sharkApi';

interface SharkVacuumProperties {
  serialNumber: string;
  name: string;
  model: string;
  connectionStatus: 'online' | 'offline';
  softwareVersion: string;
}

export class SharkVacuum {
  readonly serialNumber: string;
  readonly name: string;
  readonly model: string;
  readonly connectionStatus: 'online' | 'offline';
  readonly softwareVersion: string;

  constructor(
    private readonly api: SharkAPIClient,
    properties: SharkVacuumProperties,
  ) {
    this.serialNumber = properties.serialNumber;
    this.name = properties.name;
    this.model = properties.model;
    this.connectionStatus = properties.connectionStatus;
    this.softwareVersion = properties.softwareVersion;
  }
}
