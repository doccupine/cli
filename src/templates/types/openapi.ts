export const openapiTypesTemplate = `// Runtime mirror of the operation descriptor the CLI embeds into each generated
// API reference page. Kept in lockstep with the CLI's src/lib/openapi-types.ts.

export type JsonSchema = unknown;

export type HttpMethod =
  "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

export type ParameterLocation = "query" | "header" | "path" | "cookie";

export interface ParameterDescriptor {
  name: string;
  in: ParameterLocation;
  required: boolean;
  deprecated?: boolean;
  description?: string;
  schema?: JsonSchema;
  example?: unknown;
  anchorId: string;
}

export interface MediaTypeDescriptor {
  contentType: string;
  schema?: JsonSchema;
  example?: unknown;
}

export interface RequestBodyDescriptor {
  required: boolean;
  description?: string;
  content: MediaTypeDescriptor[];
}

export interface ResponseHeaderDescriptor {
  name: string;
  description?: string;
  schema?: JsonSchema;
}

export interface ResponseDescriptor {
  status: string;
  description?: string;
  content: MediaTypeDescriptor[];
  headers: ResponseHeaderDescriptor[];
}

export interface SecuritySchemeDescriptor {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect" | "mutualTLS";
  description?: string;
  name?: string;
  in?: "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  openIdConnectUrl?: string;
  flows?: unknown;
}

export interface SecurityRequirementDescriptor {
  schemeName: string;
  scopes: string[];
  scheme?: SecuritySchemeDescriptor;
}

export interface ServerVariableDescriptor {
  default: string;
  enum?: string[];
  description?: string;
}

export interface ServerDescriptor {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariableDescriptor>;
}

export interface OperationDescriptor {
  specName: string;
  operationId?: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  tags: string[];
  parameters: ParameterDescriptor[];
  requestBody?: RequestBodyDescriptor;
  responses: ResponseDescriptor[];
  servers: ServerDescriptor[];
  security: SecurityRequirementDescriptor[];
  slug: string;
  endpointAnchor: string;
}
`;
