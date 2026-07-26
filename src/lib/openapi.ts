import path from "path";
import chalk from "chalk";
import { dereference } from "@readme/openapi-parser";
import type { NormalizedOpenApiSpec, PageMeta } from "./types.js";
import type {
  AllowlistEntry,
  HttpMethod,
  MediaTypeDescriptor,
  OperationDescriptor,
  ParameterDescriptor,
  RequestBodyDescriptor,
  ResponseDescriptor,
  SecurityRequirementDescriptor,
  SecuritySchemeDescriptor,
  ServerDescriptor,
} from "./openapi-types.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Default base route segment for the generated API reference section. */
export const DEFAULT_API_BASE_SLUG = "api-reference";

const HTTP_METHODS: HttpMethod[] = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
];

const MAX_SERIALIZE_DEPTH = 20;

/**
 * Slugifies a single route/anchor segment: lowercase, collapse any run of
 * non-alphanumerics to a single dash, trim edge dashes. Never returns "" and
 * never contains a slash, so each segment is exactly one path/anchor part.
 * (Distinct from `generateSlug`, which preserves "/" for nested MDX routes.)
 */
export function slugifySegment(input: string): string {
  const slug = String(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "item";
}

/**
 * Deterministic anchor id for a parameter, shared verbatim with the runtime
 * component so deep links resolve. Top-level: `param-{in}-{name}`; nested schema
 * properties append their parent path: `param-body-user-address-city`.
 */
export function buildParamAnchor(
  name: string,
  location: string,
  parentPath: string[] = [],
): string {
  return ["param", location, ...parentPath, name].map(slugifySegment).join("-");
}

/**
 * Returns a deeply-cloned, JSON-serializable copy of `value`. A dereferenced
 * OpenAPI tree contains live circular references for recursive schemas, so a
 * naive `JSON.stringify` would throw. Cycles (an object still on the current
 * descent path) and over-deep nesting collapse to an `{ "x-circular": true }`
 * placeholder. Sibling/shared (acyclic) references are fully expanded.
 */
function toSerializable(
  value: any,
  seen: WeakSet<object> = new WeakSet(),
  depth = 0,
): any {
  if (value === null || typeof value !== "object") return value;
  if (depth > MAX_SERIALIZE_DEPTH) return { "x-circular": true };
  if (seen.has(value)) return { "x-circular": true };
  seen.add(value);
  let result: any;
  if (Array.isArray(value)) {
    result = value.map((item) => toSerializable(item, seen, depth + 1));
  } else {
    result = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = toSerializable(item, seen, depth + 1);
    }
  }
  seen.delete(value);
  return result;
}

/** Picks `example`, else the first of `examples` (OpenAPI example object). */
function pickExample(source: any): unknown {
  if (source == null) return undefined;
  if (source.example !== undefined) return toSerializable(source.example);
  const examples = source.examples;
  if (examples && typeof examples === "object") {
    const first = Object.values(examples)[0] as any;
    if (first && typeof first === "object" && "value" in first) {
      return toSerializable(first.value);
    }
    if (first !== undefined) return toSerializable(first);
  }
  return undefined;
}

/** Maps an OpenAPI `content` map to an array of media-type descriptors. */
function mapContent(content: any): MediaTypeDescriptor[] {
  if (!content || typeof content !== "object") return [];
  return Object.entries(content).map(([contentType, mt]) => {
    const media = mt as any;
    const descriptor: MediaTypeDescriptor = { contentType };
    if (media?.schema !== undefined)
      descriptor.schema = toSerializable(media.schema);
    const example = pickExample(media);
    if (example !== undefined) descriptor.example = example;
    return descriptor;
  });
}

/** Maps an OpenAPI `servers` array to serializable server descriptors. */
function mapServers(servers: any): ServerDescriptor[] {
  if (!Array.isArray(servers)) return [];
  return servers
    .filter((s) => s && typeof s.url === "string")
    .map((s) => {
      const descriptor: ServerDescriptor = { url: s.url };
      if (s.description) descriptor.description = s.description;
      if (s.variables && typeof s.variables === "object") {
        descriptor.variables = toSerializable(s.variables);
      }
      return descriptor;
    });
}

/** Substitutes `{var}` placeholders in a server URL with variable defaults. */
function resolveServerUrl(server: ServerDescriptor): string {
  let url = server.url;
  if (server.variables) {
    for (const [name, variable] of Object.entries(server.variables)) {
      url = url.replaceAll(`{${name}}`, variable?.default ?? "");
    }
  }
  return url;
}

/**
 * True when a host literal is loopback/private/link-local/CGNAT (or localhost).
 * Used ONLY at build time to mark an allowlist entry `allowPrivate` when the
 * spec's own declared server is a local-dev host. The runtime SSRF guard still
 * enforces the range checks; this just records the operator's explicit intent.
 */
function isLocalOrPrivateHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1") return true;
  // IPv6 link-local (fe80::/10) and unique-local (fc00::/7 -> fc../fd..).
  if (
    host.startsWith("fe80:") ||
    host.startsWith("fc") ||
    host.startsWith("fd")
  ) {
    return true;
  }
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 0 || a === 127 || a === 10) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

/** Derives an allowlist entry from a server, or null for relative/non-http. */
function serverToAllowlistEntry(
  server: ServerDescriptor,
): AllowlistEntry | null {
  let url: URL;
  try {
    url = new URL(resolveServerUrl(server));
  } catch {
    return null; // relative server URL — no cross-origin host to allow
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const entry: AllowlistEntry = {
    scheme: url.protocol === "https:" ? "https" : "http",
    host,
    port: url.port ? Number(url.port) : null,
  };
  if (url.pathname && url.pathname !== "/") {
    entry.basePath = url.pathname.replace(/\/+$/, "");
  }
  if (isLocalOrPrivateHost(host)) entry.allowPrivate = true;
  return entry;
}

/** Merges path-level and operation-level parameters; op overrides by name+in. */
function mergeParameters(pathParams: any, opParams: any): any[] {
  const byKey = new Map<string, any>();
  const add = (list: any) => {
    if (!Array.isArray(list)) return;
    for (const p of list) {
      if (p && typeof p.name === "string" && typeof p.in === "string") {
        byKey.set(`${p.in}:${p.name}`, p);
      }
    }
  };
  add(pathParams);
  add(opParams); // operation wins on collision
  return [...byKey.values()];
}

/** Resolves security requirements to a deduped list with schemes attached. */
function resolveSecurity(
  requirements: any,
  schemes: any,
): SecurityRequirementDescriptor[] {
  if (!Array.isArray(requirements)) return [];
  const byName = new Map<string, SecurityRequirementDescriptor>();
  for (const requirement of requirements) {
    if (!requirement || typeof requirement !== "object") continue;
    for (const [schemeName, scopes] of Object.entries(requirement)) {
      const existing = byName.get(schemeName);
      const scopeList = Array.isArray(scopes) ? (scopes as string[]) : [];
      if (existing) {
        existing.scopes = [...new Set([...existing.scopes, ...scopeList])];
        continue;
      }
      const rawScheme = schemes?.[schemeName];
      const descriptor: SecurityRequirementDescriptor = {
        schemeName,
        scopes: scopeList,
      };
      if (rawScheme && typeof rawScheme === "object") {
        descriptor.scheme = toSerializable(
          rawScheme,
        ) as SecuritySchemeDescriptor;
      }
      byName.set(schemeName, descriptor);
    }
  }
  return [...byName.values()];
}

function firstLine(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.split("\n")[0]?.trim() ?? "";
}

/**
 * Parses one or more OpenAPI specs and exposes everything the generator needs:
 * the operation descriptors, lookup indices for the MDX frontmatter path,
 * synthetic sidebar/sitemap `PageMeta` objects, per-endpoint markdown bodies
 * (for llms output), and the request-execution allowlist.
 *
 * `load()` never throws: a spec that fails to parse is logged and skipped so one
 * malformed file cannot abort a build or crash a watcher.
 */
export class OpenApiRegistry {
  private operations: OperationDescriptor[] = [];
  private byOperationId = new Map<string, OperationDescriptor>();
  private byMethodPath = new Map<string, OperationDescriptor>();
  private pages: PageMeta[] = [];
  private bodies = new Map<string, string>();
  private allowlistEntries: AllowlistEntry[] = [];

  get all(): OperationDescriptor[] {
    return this.operations;
  }

  get isEmpty(): boolean {
    return this.operations.length === 0;
  }

  async load(
    specs: NormalizedOpenApiSpec[],
    rootDir: string,
    apiBaseSlug: string = DEFAULT_API_BASE_SLUG,
  ): Promise<void> {
    this.operations = [];
    this.byOperationId.clear();
    this.byMethodPath.clear();
    this.pages = [];
    this.bodies.clear();
    this.allowlistEntries = [];

    const multi = specs.length > 1;
    const usedSlugs = new Set<string>();
    const allowlistKeys = new Set<string>();

    for (const spec of specs) {
      const absolute = path.resolve(rootDir, spec.file);
      let doc: any;
      try {
        doc = await dereference(absolute);
      } catch (error) {
        console.error(
          chalk.red(`❌ Failed to parse OpenAPI spec "${spec.file}":`),
          error instanceof Error ? error.message : error,
        );
        continue;
      }
      try {
        this.ingest(doc, spec, multi, apiBaseSlug, usedSlugs, allowlistKeys);
      } catch (error) {
        console.error(
          chalk.red(`❌ Failed to process OpenAPI spec "${spec.file}":`),
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  /** Fresh copies of the synthetic pages (caller may mutate/spread safely). */
  syntheticPages(): PageMeta[] {
    return this.pages.map((page) => ({ ...page }));
  }

  bodyForSlug(slug: string): string | undefined {
    return this.bodies.get(slug);
  }

  allowlist(): AllowlistEntry[] {
    return this.allowlistEntries.map((entry) => ({ ...entry }));
  }

  /** Looks up an operation by `operationId` or by `"METHOD /path"`. */
  lookup(ref: string): OperationDescriptor | undefined {
    const trimmed = ref.trim();
    if (/\s/.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const method = parts.shift() ?? "";
      return this.byMethodPath.get(
        `${method.toUpperCase()} ${parts.join(" ")}`,
      );
    }
    return this.byOperationId.get(trimmed);
  }

  private ingest(
    doc: any,
    spec: NormalizedOpenApiSpec,
    multi: boolean,
    apiBaseSlug: string,
    usedSlugs: Set<string>,
    allowlistKeys: Set<string>,
  ): void {
    const base = multi
      ? `${apiBaseSlug}/${slugifySegment(spec.name)}`
      : apiBaseSlug;

    const rootServers = mapServers(doc.servers);
    this.addAllowlist(rootServers, allowlistKeys);

    const schemes = doc.components?.securitySchemes ?? {};

    // Category ordering: honour the spec's top-level `tags` order; unknown tags
    // are appended in first-appearance order.
    const tagOrder = new Map<string, number>();
    let nextTagOrder = 0;
    if (Array.isArray(doc.tags)) {
      doc.tags.forEach((tag: any) => {
        if (tag && typeof tag.name === "string" && !tagOrder.has(tag.name)) {
          tagOrder.set(tag.name, nextTagOrder++);
        }
      });
    }
    const withinTag = new Map<string, number>();

    const paths = doc.paths ?? {};
    for (const [pathKey, pathItemRaw] of Object.entries(paths)) {
      const pathItem = pathItemRaw as any;
      if (!pathItem || typeof pathItem !== "object") continue;
      const pathServers = mapServers(pathItem.servers);
      this.addAllowlist(pathServers, allowlistKeys);
      const pathParams = pathItem.parameters;

      for (const method of HTTP_METHODS) {
        const opRaw = pathItem[method];
        if (!opRaw || typeof opRaw !== "object") continue;

        const opServers = mapServers(opRaw.servers);
        this.addAllowlist(opServers, allowlistKeys);
        const effectiveServers = opServers.length
          ? opServers
          : pathServers.length
            ? pathServers
            : rootServers;

        const parameters = mergeParameters(pathParams, opRaw.parameters).map(
          (p): ParameterDescriptor => {
            const descriptor: ParameterDescriptor = {
              name: p.name,
              in: p.in,
              required: p.in === "path" ? true : Boolean(p.required),
              anchorId: buildParamAnchor(p.name, p.in),
            };
            if (p.deprecated) descriptor.deprecated = true;
            if (p.description) descriptor.description = p.description;
            const schema = p.schema ?? (p.type ? { type: p.type } : undefined);
            if (schema !== undefined)
              descriptor.schema = toSerializable(schema);
            const example = pickExample(p);
            if (example !== undefined) descriptor.example = example;
            return descriptor;
          },
        );

        let requestBody: RequestBodyDescriptor | undefined;
        if (opRaw.requestBody?.content) {
          requestBody = {
            required: Boolean(opRaw.requestBody.required),
            content: mapContent(opRaw.requestBody.content),
          };
          if (opRaw.requestBody.description) {
            requestBody.description = opRaw.requestBody.description;
          }
        }

        const responses: ResponseDescriptor[] = Object.entries(
          opRaw.responses ?? {},
        ).map(([status, r]) => {
          const raw = r as any;
          const response: ResponseDescriptor = {
            status,
            content: raw?.content ? mapContent(raw.content) : [],
            headers: raw?.headers
              ? Object.entries(raw.headers).map(([name, h]) => {
                  const rawHeader = h as any;
                  const header: ResponseDescriptor["headers"][number] = {
                    name,
                  };
                  if (rawHeader?.description)
                    header.description = rawHeader.description;
                  if (rawHeader?.schema !== undefined) {
                    header.schema = toSerializable(rawHeader.schema);
                  }
                  return header;
                })
              : [],
          };
          if (raw?.description) response.description = raw.description;
          return response;
        });

        const tags = Array.isArray(opRaw.tags)
          ? opRaw.tags.filter((t: any) => typeof t === "string")
          : [];
        const primaryTag = tags[0] ?? "Endpoints";

        const opSlug = opRaw.operationId
          ? slugifySegment(String(opRaw.operationId))
          : slugifySegment(`${method}-${pathKey}`);
        const slug = this.uniqueSlug(
          `${base}/${slugifySegment(primaryTag)}/${opSlug}`,
          usedSlugs,
        );

        const methodUpper = method.toUpperCase();
        const descriptor: OperationDescriptor = {
          specName: spec.name,
          method,
          path: pathKey,
          tags,
          parameters,
          responses,
          servers: effectiveServers,
          security: resolveSecurity(opRaw.security ?? doc.security, schemes),
          slug,
          endpointAnchor: `endpoint-${slugifySegment(method)}-${slugifySegment(pathKey)}`,
        };
        if (opRaw.operationId)
          descriptor.operationId = String(opRaw.operationId);
        if (opRaw.summary) descriptor.summary = opRaw.summary;
        if (opRaw.description) descriptor.description = opRaw.description;
        if (opRaw.deprecated) descriptor.deprecated = true;
        if (requestBody) descriptor.requestBody = requestBody;

        this.operations.push(descriptor);
        if (descriptor.operationId) {
          this.byOperationId.set(descriptor.operationId, descriptor);
        }
        this.byMethodPath.set(`${methodUpper} ${pathKey}`, descriptor);

        if (!tagOrder.has(primaryTag)) tagOrder.set(primaryTag, nextTagOrder++);
        const order = withinTag.get(primaryTag) ?? 0;
        withinTag.set(primaryTag, order + 1);

        const title = opRaw.summary || `${methodUpper} ${pathKey}`;
        this.pages.push({
          slug,
          title,
          description:
            opRaw.summary ||
            firstLine(opRaw.description) ||
            `${methodUpper} ${pathKey}`,
          date: null,
          category: primaryTag,
          path: `@openapi/${spec.name}/${method}${pathKey}`,
          categoryOrder: tagOrder.get(primaryTag) ?? 0,
          order,
          section: apiBaseSlug,
          httpMethod: methodUpper,
        });
        this.bodies.set(
          slug,
          buildEndpointBody(title, methodUpper, pathKey, opRaw),
        );
      }
    }
  }

  private uniqueSlug(candidate: string, used: Set<string>): string {
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    let n = 2;
    let slug = `${candidate}-${n}`;
    while (used.has(slug)) slug = `${candidate}-${++n}`;
    used.add(slug);
    console.warn(
      chalk.yellow(
        `⚠️ Duplicate API route slug "${candidate}"; using "${slug}"`,
      ),
    );
    return slug;
  }

  private addAllowlist(servers: ServerDescriptor[], keys: Set<string>): void {
    for (const server of servers) {
      const entry = serverToAllowlistEntry(server);
      if (!entry) continue;
      const key = `${entry.scheme}://${entry.host}:${entry.port ?? ""}${entry.basePath ?? ""}`;
      if (keys.has(key)) continue;
      keys.add(key);
      this.allowlistEntries.push(entry);
    }
  }
}

/** Minimal markdown body for an endpoint, used by the llms.txt aggregation. */
function buildEndpointBody(
  title: string,
  methodUpper: string,
  pathKey: string,
  opRaw: any,
): string {
  const lines = [`# ${title}`, "", `\`${methodUpper} ${pathKey}\``];
  if (opRaw.description && typeof opRaw.description === "string") {
    lines.push("", opRaw.description);
  } else if (opRaw.summary && opRaw.summary !== title) {
    lines.push("", opRaw.summary);
  }
  return lines.join("\n");
}

/** Human-readable type label for a (dereferenced) JSON schema. */
function docSchemaType(schema: any): string {
  if (!schema || typeof schema !== "object") return "any";
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  if (schema.type === "array") return `array of ${docSchemaType(schema.items)}`;
  if (typeof schema.type === "string") {
    return schema.format ? `${schema.type} (${schema.format})` : schema.type;
  }
  if (schema.properties) return "object";
  if (Array.isArray(schema.enum)) return "enum";
  return "any";
}

/** Collapses a description to a single inline line safe inside JSX children. */
function inlineText(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

/** The object schema whose `properties` we can document (unwraps arrays). */
function objectShape(schema: any): any | null {
  if (!schema || typeof schema !== "object") return null;
  if (schema.type === "array") return objectShape(schema.items);
  if (schema.properties && typeof schema.properties === "object") return schema;
  return null;
}

/**
 * Renders one parameter/property as a `<Field>`, recursing into nested object
 * properties up to `MAX_FIELD_DEPTH` levels. Nested fields are emitted flush so
 * MDX does not treat the indentation as a code block.
 */
const MAX_FIELD_DEPTH = 2;
function renderDocField(
  name: string,
  schema: any,
  required: boolean,
  description: string | undefined,
  depth: number,
): string {
  const type = docSchemaType(schema);
  const desc = inlineText(description ?? schema?.description);
  const lines = [
    `<Field value="${name}" type="${type}"${required ? " required" : ""}>`,
  ];
  if (desc) lines.push(desc);
  const shape = depth < MAX_FIELD_DEPTH ? objectShape(schema) : null;
  if (shape) {
    const req: string[] = Array.isArray(shape.required) ? shape.required : [];
    for (const [propName, propSchema] of Object.entries(shape.properties)) {
      lines.push(
        renderDocField(
          propName,
          propSchema,
          req.includes(propName),
          undefined,
          depth + 1,
        ),
      );
    }
  }
  lines.push(`</Field>`);
  return lines.join("\n");
}

const PARAM_LOCATION_TITLES: Record<string, string> = {
  path: "Path parameters",
  query: "Query parameters",
  header: "Header parameters",
  cookie: "Cookie parameters",
};

/**
 * Builds the MDX body for a generated endpoint page: the operation description,
 * followed by `<Field>` documentation for the parameters and request body, and
 * a schema/example code block per response. Rendered above the playground.
 */
export function buildEndpointDoc(op: OperationDescriptor): string {
  const out: string[] = [];
  if (op.description) out.push(op.description);
  else if (op.summary) out.push(op.summary);

  for (const location of ["path", "query", "header", "cookie"] as const) {
    const params = op.parameters.filter((p) => p.in === location);
    if (params.length === 0) continue;
    out.push(`## ${PARAM_LOCATION_TITLES[location]}`);
    for (const p of params) {
      out.push(renderDocField(p.name, p.schema, p.required, p.description, 0));
    }
  }

  const body =
    op.requestBody?.content.find((m) => m.contentType.includes("json")) ??
    op.requestBody?.content[0];
  if (body?.schema !== undefined) {
    out.push("## Request body");
    const shape = objectShape(body.schema);
    if (shape) {
      const req: string[] = Array.isArray(shape.required) ? shape.required : [];
      for (const [propName, propSchema] of Object.entries(shape.properties)) {
        out.push(
          renderDocField(
            propName,
            propSchema,
            req.includes(propName),
            undefined,
            0,
          ),
        );
      }
    } else {
      out.push("```json\n" + JSON.stringify(body.schema, null, 2) + "\n```");
    }
  }

  if (op.responses.length > 0) {
    out.push("## Responses");
    for (const response of op.responses) {
      out.push(`### ${response.status}`);
      if (response.description) {
        out.push(inlineText(response.description));
      }
      const media =
        response.content.find((m) => m.contentType.includes("json")) ??
        response.content[0];
      const payload = media?.example ?? media?.schema;
      if (payload !== undefined) {
        out.push("```json\n" + JSON.stringify(payload, null, 2) + "\n```");
      }
    }
  }

  return out.join("\n\n");
}
