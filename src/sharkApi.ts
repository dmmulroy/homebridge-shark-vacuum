import fetch, { RequestInit } from 'node-fetch';
import { z, ZodType, ZodTypeDef } from 'zod';
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
  private expirationTime: number | undefined;
  private readonly appId: AppId;
  private readonly appSecret: AppSecret;

  constructor(
    private readonly email: string,
    private readonly password: string,
    private readonly mobileType: MobileOSType,
  ) {
    this.appId =
      this.mobileType === 'Apple iOS'
        ? 'Shark-iOS-field-id'
        : 'Shark-Android-field-id';

    this.appSecret =
      this.mobileType === 'Apple iOS'
        ? 'Shark-iOS-field-_wW7SiwgrHN8dpU_ugCattOoDk8'
        : 'Shark-Android-field-Wv43MbdXRM297HUHotqe6lU1n-w';
  }

  private async fetch<T>(
    endpoint: string,
    responeSchema: ZodType<T, ZodTypeDef, unknown>,
    opts?: RequestInit,
  ) {
    try {
      const mergedOptions = {
        ...opts,
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...opts?.headers,
        },
      };

      if (this.accessToken) {
        mergedOptions.headers[
          'Authorization'
        ] = `auth_token ${this.accessToken}`;
      }

      const accessTokenStatus = this.getAccessTokenStatus();

      if (['expiring_soon', 'expired'].includes(accessTokenStatus)) {
        await this.refreshAcessToken();
      }

      const response = await fetch(`${BASE_API_URL}${endpoint}`, opts);

      if (!response.ok) {
        const data = await response.json();
        const { error } = errorSceham.parse(data);

        throw new SharkBadRequestError(error, response.status);
      }

      const data = await response.json();

      return responeSchema.parse(data);
    } catch (error) {
      if (error instanceof SharkAPIError) {
        throw error;
      } else {
        throw new SharkAPIError(
          `An error occured while making making a request to ${BASE_API_URL}${endpoint}: ${getErrorMessage(
            error,
          )}`,
        );
      }
    }
  }

  public async login() {
    try {
      const loginResponseData = await this.fetch(
        '/users/sign_in',
        loginSchema,
        {
          method: 'post',
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
        },
      );

      this.expirationTime = Date.now() + loginResponseData.expires_in * 1000;
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

  public async refreshAcessToken() {
    try {
      const loginResponseData = await this.fetch(
        '/users/refresh_token',
        loginSchema,
        {
          method: 'post',
          body: JSON.stringify({
            user: {
              refresh_token: this.refreshToken,
            },
          }),
        },
      );

      this.expirationTime = Date.now() + loginResponseData.expires_in * 1000;
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

  private getAccessTokenStatus():
    | 'fresh'
    | 'expiring_soon'
    | 'expired'
    | 'unauthenticated' {
    if (!this.expirationTime) {
      return 'unauthenticated';
    }

    if (Date.now() >= this.expirationTime) {
      return 'expired';
    }

    // expiring_soon will be returned if there is less than 30 minutes until expiration
    if (this.expirationTime - Date.now() < 1800 * 1000) {
      return 'expiring_soon';
    }

    return 'fresh';
  }

  public async getAllDevices() {
    try {
      const devices = await this.fetch(
        `${BASE_API_URL}/apiv1/devices`,
        getAllDevicesSchema,
      );

      return devices.map(({ device }) => device);
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

  public async getDeviceMetadata(deviceSerialNumber: string) {
    try {
      const metadata = await this.fetch(
        `${BASE_API_URL}/apiv1/dsns/${deviceSerialNumber}/data`,
        getDeviceMetadataSchema,
      );

      return metadata;
    } catch (error) {
      if (error instanceof SharkAPIError) {
        throw error;
      } else {
        throw new SharkAPIError(
          `An error while retrieving metadata for device ${deviceSerialNumber}: ${getErrorMessage(
            error,
          )}`,
        );
      }
    }
  }

  public async getDeviceProperties(deviceSerialNumber: string) {
    try {
      const properties = await this.fetch(
        `${BASE_API_URL}/apiv1/dsns/${deviceSerialNumber}/properties`,
        getDevicePropertiesSchema,
      );

      return properties.map(({ property }) => property);
    } catch (error) {
      if (error instanceof SharkAPIError) {
        throw error;
      } else {
        throw new SharkAPIError(
          `An error while retrieving properties for device ${deviceSerialNumber}: ${getErrorMessage(
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
  readonly code: number;

  constructor(errorMsg: string, code: number) {
    super(errorMsg);
    this.code = code;
  }
}

// class UnauthenticatedError extends SharkAPIError {}

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

const errorSceham = z.object({ error: z.string() });

// Zod Inferred Types
// type Device = z.infer<typeof deviceSchema>['device'];

const getDeviceMetadataSchema = z.array(
  z.object({
    datum: z.object({
      created_at: z.string().optional(),
      from_template: z.boolean().optional(),
      key: z.string().optional(),
      update_at: z.string().optional(),
      value: z.object({}).optional(),
      dsn: z.string().optional(),
    }),
  }),
);

const getDevicePropertiesSchema = z.array(
  z.object({
    property: z.object({
      type: z.string().optional(),
      name: z.string().optional(),
      'base-type': z.string().optional(),
      'read-only': z.boolean().optional(),
      direction: z.string().optional(),
      scope: z.string().optional(),
      'data-updated-at': z.string().optional(),
      key: z.number().optional(),
      'device-key': z.number().optional(),
      'product-name': z.string().optional(),
      track_only_changes: z.boolean().optional(),
      display_name: z.string().optional(),
      host_sw_version: z.boolean().optional(),
      time_series: z.boolean().optional(),
      derived: z.boolean().optional(),
      app_type: z.string().optional(),
      recipe: z.string().optional(),
      value: z.string().optional(),
      denied_roles: z.array(z.string().or(z.null())),
      ack_enabled: z.boolean().optional(),
      retention_days: z.number().optional(),
      ack_status: z.number().optional(),
      ack_message: z.number().optional(),
      acked_at: z.string().optional(),
    }),
  }),
);
