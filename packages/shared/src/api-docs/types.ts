export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type AuthRequirement = 'public' | 'session';

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  enumValues?: string[];
}

export interface ApiErrorCode {
  status: number;
  code: string;
  description: string;
}

export interface ApiEndpointDoc {
  id: string;
  group: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  auth: AuthRequirement;
  statusCodes: Array<{ status: number; description: string }>;
  headers?: SchemaField[];
  pathParams?: SchemaField[];
  queryParams?: SchemaField[];
  requestBody?: {
    contentType: string;
    fields: SchemaField[];
    example: unknown;
  };
  responseBody?: {
    contentType: string;
    fields: SchemaField[];
    example: unknown;
  };
  errors: ApiErrorCode[];
}

export interface ApiDocumentationSpec {
  title: string;
  version: string;
  baseUrl: string;
  description: string;
  authNotes: string[];
  exampleCityId: string;
  endpoints: ApiEndpointDoc[];
  seedGroups: ApiSeedGroup[];
  baseUrlPresets: ApiBaseUrlPreset[];
}

export interface ApiSeedItem {
  id: string;
  label: string;
  value: string;
  description: string;
}

export interface ApiSeedGroup {
  title: string;
  items: ApiSeedItem[];
}

export interface ApiBaseUrlPreset {
  id: string;
  label: string;
  url: string;
}
