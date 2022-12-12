import fetch from 'node-fetch';
import { z } from 'zod';
import { getErrorMessage } from './getErrorMessage';
import { CustomError } from 'ts-custom-error';

type MobileOSType = 'Apple iOS' | 'Android OS';
type AppId = 'Shark-iOS-field-id' | 'Shark-Android-field-id';
type AppSecret =
  | 'Shark-iOS-field-_wW7SiwgrHN8dpU_ugCattOoDk8'
  | 'Shark-Android-field-Wv43MbdXRM297HUHotqe6lU1n-w';

const BASE_API_URL = 'https://ads-field-39a9391a.aylanetworks.com';

export class SharkAPIClient {
  private accessToken: string | undefined;
  private refreshToken: string | undefined;
  private readonly appId: AppId;
  private readonly appSecret: AppSecret;
  private devices: Device[] = [];

  constructor(
    private readonly email: string,
    private readonly password: string,
    private readonly mobileType: MobileOSType,
  ) {
    this.appId =
      mobileType === 'Apple iOS'
        ? 'Shark-iOS-field-id'
        : 'Shark-Android-field-id';

    this.appSecret =
      mobileType === 'Apple iOS'
        ? 'Shark-iOS-field-_wW7SiwgrHN8dpU_ugCattOoDk8'
        : 'Shark-Android-field-Wv43MbdXRM297HUHotqe6lU1n-w';
  }

  public async login() {
    try {
      const response = await fetch(`${BASE_API_URL}/users/sign_in.json`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            email: this.email,
            password: this.password,
            application: {
              app_id: this.appId,
              app_secret: this.appSecret,
            },
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const { error } = errorSchema.parse(data);

        throw new SharkBadRequestError(error);
      }

      const data = await response.json();

      const loginResponseData = loginSchema.parse(data);

      this.accessToken = loginResponseData.access_token;
      this.refreshToken = loginResponseData.refresh_token;
    } catch (error) {
      if (error instanceof SharkAPIError) {
        throw error;
      } else {
        throw new SharkAPIError(
          `An error occured while attempting to login: ${getErrorMessage(
            error,
          )}`,
        );
      }
    }
  }

  public async getAllDevices() {
    try {
      const response = await fetch(`${BASE_API_URL}/apiv1/devices.json`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `auth_token ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        const { error } = errorSchema.parse(data);

        throw new SharkBadRequestError(error);
      }

      const data = await response.json();

      const devices = getAllDevicesSchema.parse(data);

      this.devices = devices.map(({ device }) => device);

      return devices;
    } catch (error) {
      if (error instanceof SharkAPIError) {
        throw error;
      } else {
        throw new SharkAPIError(
          `An error while retrieving all devices: ${getErrorMessage(error)}`,
        );
      }
    }
  }

  public async getDeviceMetadata(deviceId: string) {
    try {
      const response = await fetch(
        `${BASE_API_URL}/apiv1/dsns/${deviceId}/data.json`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `auth_token ${this.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        const { error } = errorSchema.parse(data);

        throw new SharkBadRequestError(error);
      }

      const data = await response.json();
      const metadata = getDeviceMetadataSchema.parse(data);

      return metadata;
    } catch (error) {
      if (error instanceof SharkAPIError) {
        throw error;
      } else {
        throw new SharkAPIError(
          `An error while retrieving metadata for device ${deviceId}: ${getErrorMessage(
            error,
          )}`,
        );
      }
    }
  }

  public async getDeviceProperties(deviceId: string) {
    try {
      const response = await fetch(
        `${BASE_API_URL}/apiv1/dsns/${deviceId}/data.json`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `auth_token ${this.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        const { error } = errorSchema.parse(data);

        throw new SharkBadRequestError(error);
      }

      const data = await response.json();
    } catch (error) {
      if (error instanceof SharkAPIError) {
        throw error;
      } else {
        throw new SharkAPIError(
          `An error while retrieving properties for device ${deviceId}: ${getErrorMessage(
            error,
          )}`,
        );
      }
    }
  }
}

// Custom Errors
class SharkAPIError extends CustomError {}

class SharkBadRequestError extends SharkAPIError {
  constructor(errorMsg: string) {
    super(errorMsg);
  }
}

class UnauthenticatedError extends SharkAPIError {}

// Zod Validators
const loginSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  role: z.enum(['EndUser']),
  role_tags: z.array(
    z.object({ namespace: z.string(), key: z.string(), value: z.string() }),
  ),
});

const deviceSchema = z.object({
  device: z.object({
    id: z.number().optional(),
    product_name: z.string().optional(),
    model: z.string().optional(),
    dsn: z.string(),
    oem: z.string().optional(),
    oem_model: z.string().optional(),
    sw_version: z.string().optional(),
    user_id: z.string().optional(),
    user_uuid: z.string().optional(),
    template_id: z.number().optional(),
    mac: z.string().optional(),
    ip: z.string().optional(),
    lan_ip: z.string().optional(),
    ssid: z.string().optional(),
    connected_at: z.string().optional(),
    key: z.number().optional(),
    product_class: z.string().nullable(),
    has_properties: z.boolean().optional(),
    lan_enabled: z.boolean().optional(),
    enable_ssl: z.boolean().optional(),
    ans_enabled: z.boolean().optional(),
    ans_server: z.string().optional(),
    log_enabled: z.boolean().optional(),
    registered: z.boolean().optional(),
    connection_status: z.string().optional(),
    registration_type: z.string().optional(),
    lat: z.string().optional(),
    lng: z.string().optional(),
    locality: z.string().optional(),
    homekit: z.string().optional(),
    module_updated_at: z.string().optional(),
    registrable: z.boolean().optional(),
    regtoken: z.string().optional(),
    setup_token: z.string().optional(),
    provisional: z.boolean().optional(),
    device_type: z.string().optional(),
    activated_at: z.string().optional(),
    created_at: z.string().optional(),
    grant: z
      .object({
        'user-id': z.number().optional(),
        'start-date-at': z.string().optional(),
        'end-date-at': z.string().optional(),
        operation: z.string().optional(),
      })
      .optional(),
    'gateway-type': z.string().optional(),
  }),
});

const getAllDevicesSchema = z.array(deviceSchema);

const errorSchema = z.object({ error: z.string() });

// Zod Inferred Types
type Device = z.infer<typeof deviceSchema>['device'];

const getDeviceMetadataSchema = z.object({
  datum: z.object({
    created_at: z.string().optional(),
    from_template: z.boolean().optional(),
    key: z.string().optional(),
    update_at: z.string().optional(),
    value: z.object({}).optional(),
    dsn: z.string().optional(),
  }),
});

const getDevicePropertiesSchema = z.object({});
