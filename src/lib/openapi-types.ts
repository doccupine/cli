/**
 * Canonical, JSON-serializable model for a single OpenAPI operation.
 *
 * This is the ONE contract shared by both halves of the API playground:
 *  - the build side (src/lib/openapi.ts) produces these objects from a parsed,
 *    dereferenced spec and embeds them into generated pages, and
 *  - the runtime side (the generated Next.js `<ApiPlayground>` component) is
 *    written strictly against this shape.
 *
 * Everything here must survive `JSON.stringify` (no class instances, no
 * circular refs). Schemas/examples are passed through `toSerializable()` before
 * they land in a descriptor, so a recursive `$ref` cannot break serialization.
 */

/** A dereferenced JSON Schema fragment, already cycle-guarded and serializable. */
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
  /** Stable anchor id for deep-linking this parameter, e.g. "param-query-page". */
  anchorId: string;
}

export interface MediaTypeDescriptor {
  /** e.g. "application/json". */
  contentType: string;
  schema?: JsonSchema;
  /** `example` when present, otherwise the first value of `examples`. */
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
  /** e.g. "200" | "default". */
  status: string;
  description?: string;
  content: MediaTypeDescriptor[];
  headers: ResponseHeaderDescriptor[];
}

export interface SecuritySchemeDescriptor {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect" | "mutualTLS";
  description?: string;
  /** apiKey */
  name?: string;
  in?: "query" | "header" | "cookie";
  /** http: "bearer" | "basic" */
  scheme?: string;
  bearerFormat?: string;
  openIdConnectUrl?: string;
  /** oauth2 flows, kept as serializable JSON. */
  flows?: unknown;
}

export interface SecurityRequirementDescriptor {
  schemeName: string;
  scopes: string[];
  /** Resolved scheme from `components.securitySchemes`, when found. */
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
  /** Which named spec this operation came from. */
  specName: string;
  operationId?: string;
  method: HttpMethod;
  /** Templated path, e.g. "/users/{id}". */
  path: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  /** May be empty; a fallback tag is applied at routing time. */
  tags: string[];
  parameters: ParameterDescriptor[];
  requestBody?: RequestBodyDescriptor;
  responses: ResponseDescriptor[];
  /** Operation -> path -> root precedence; empty if the spec has none. */
  servers: ServerDescriptor[];
  /** Resolved security requirements; empty means anonymous. */
  security: SecurityRequirementDescriptor[];
  /** Full route slug of this endpoint's generated page. */
  slug: string;
  /** Stable base anchor for the endpoint block on its page. */
  endpointAnchor: string;
}

/**
 * A single entry in the request-execution allowlist emitted at build time from
 * the union of every spec's `servers[]`. The proxy route (server) and the
 * playground component (client) both read this to decide whether a target URL
 * may be called. `allowPrivate` is set ONLY when the spec's own declared server
 * host is itself a loopback/private/metadata literal (the local-dev case).
 */
export interface AllowlistEntry {
  scheme: "http" | "https";
  /** Lowercased hostname (never an IP unless the spec literally declared one). */
  host: string;
  port: number | null;
  basePath?: string;
  allowPrivate?: boolean;
}
