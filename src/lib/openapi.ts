import path from "path";
import net from "node:net";
import { constants } from "node:fs";
import fs from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import chalk from "chalk";
import { bundle, dereference, parse } from "@readme/openapi-parser";
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
 * True only for a loopback host. Loopback is useful for a local playground, but
 * broader private and link-local ranges are never auto-enabled from spec input:
 * an imported spec must not be able to turn the generated site into an internal
 * network or cloud-metadata proxy.
 */
function isLoopbackHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1") return true;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/);
  return Boolean(m && Number(m[1]) === 127);
}

/** True when the runtime proxy will reject a non-loopback IP literal. */
function isBlockedNonLoopbackLiteral(host: string): boolean {
  const type = net.isIP(host);
  if (type === 4) {
    const [a, b] = host.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (type === 6) {
    const clean = host.toLowerCase().split("%")[0];
    const head = clean.split(":")[0];
    return (
      clean === "::" ||
      head.startsWith("fc") ||
      head.startsWith("fd") ||
      head.startsWith("fe8") ||
      head.startsWith("fe9") ||
      head.startsWith("fea") ||
      head.startsWith("feb") ||
      head.startsWith("fec") ||
      head.startsWith("fed") ||
      head.startsWith("fee") ||
      head.startsWith("fef") ||
      head.startsWith("ff")
    );
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
  const host = url.hostname
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^\[|\]$/g, "");
  const entry: AllowlistEntry = {
    scheme: url.protocol === "https:" ? "https" : "http",
    host,
    port: url.port ? Number(url.port) : null,
  };
  if (url.pathname && url.pathname !== "/") {
    entry.basePath = url.pathname.replace(/\/+$/, "");
  }
  if (isLoopbackHost(host)) entry.allowPrivate = true;
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

function isWithinDirectory(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

export function isLocalOpenApiPath(reference: string): boolean {
  if (path.win32.isAbsolute(reference)) return true;
  return !/^[a-z][a-z\d+.-]*:/i.test(reference);
}

async function resolveLocalOpenApiFile(
  rootRealPath: string,
  candidate: string,
  reference: string,
): Promise<string> {
  let realPath: string;
  try {
    realPath = await fs.realpath(candidate);
  } catch (error) {
    throw new Error(`Unable to resolve OpenAPI file "${reference}"`, {
      cause: error,
    });
  }
  if (!isWithinDirectory(rootRealPath, realPath)) {
    throw new Error(`OpenAPI file "${reference}" resolves outside rootDir`);
  }
  return realPath;
}

interface ResolverFile {
  url: string;
}

interface OpenApiFileResolver {
  order: number;
  canRead(file: ResolverFile): boolean;
  read(file: ResolverFile): unknown | Promise<unknown>;
}

// The wrapper's runtime passes resolver objects through, although its public
// ParserOptions type narrows resolve.file to boolean.
function parserFileResolver(resolver: OpenApiFileResolver): boolean {
  return resolver as unknown as boolean;
}

async function readOpenApiSnapshot(
  rootRealPath: string,
  realPath: string,
  reference: string,
): Promise<Buffer> {
  let handle: Awaited<ReturnType<typeof fs.open>>;
  try {
    const noFollow = process.platform === "win32" ? 0 : constants.O_NOFOLLOW;
    handle = await fs.open(realPath, constants.O_RDONLY | noFollow);
  } catch (error) {
    throw new Error(`Unable to open OpenAPI file "${reference}"`, {
      cause: error,
    });
  }

  try {
    const [openedStat, confirmedRealPath] = await Promise.all([
      handle.stat(),
      fs.realpath(realPath),
    ]);
    if (
      !openedStat.isFile() ||
      !isWithinDirectory(rootRealPath, confirmedRealPath)
    ) {
      throw new Error(`OpenAPI file "${reference}" resolves outside rootDir`);
    }
    const currentStat = await fs.stat(confirmedRealPath);
    if (
      openedStat.dev !== currentStat.dev ||
      openedStat.ino !== currentStat.ino
    ) {
      throw new Error(`OpenAPI file "${reference}" changed while being read`);
    }
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

async function parseOpenApiSnapshot(
  filePath: string,
  contents: Buffer,
): Promise<any> {
  return parse(filePath, {
    resolve: {
      file: parserFileResolver({
        order: 1,
        canRead: () => true,
        read: () => contents,
      }),
    },
  });
}

function resolveOpenApiReference(filePath: string, reference: string): string {
  if (path.isAbsolute(reference) || path.win32.isAbsolute(reference)) {
    return path.normalize(reference);
  }
  try {
    const url = new URL(reference, pathToFileURL(filePath));
    if (url.protocol !== "file:") throw new Error("Not a local file");
    return fileURLToPath(url);
  } catch (error) {
    throw new Error(`Invalid OpenAPI external reference "${reference}"`, {
      cause: error,
    });
  }
}

/**
 * Captures every allowed file once and rewrites external refs to closed,
 * in-memory snapshot URLs. No parser phase after this function reads disk.
 */
async function snapshotOpenApiDocuments(
  rootRealPath: string,
  rootFile: string,
): Promise<{ rootDocument: any; snapshots: Map<string, any> }> {
  const byRealPath = new Map<string, { document: any; url: string }>();
  const snapshots = new Map<string, any>();

  const visit = async (
    candidate: string,
    reference: string,
  ): Promise<string> => {
    const realPath = await resolveLocalOpenApiFile(
      rootRealPath,
      candidate,
      reference,
    );
    const existing = byRealPath.get(realPath);
    if (existing) return existing.url;

    const contents = await readOpenApiSnapshot(
      rootRealPath,
      realPath,
      reference,
    );
    const document: any = await parseOpenApiSnapshot(realPath, contents);
    const snapshotUrl = `file:///__doccupine_openapi_snapshot__/${byRealPath.size}.json`;
    byRealPath.set(realPath, { document, url: snapshotUrl });
    snapshots.set(snapshotUrl, document);

    const seen = new WeakSet<object>();
    const scan = async (value: any): Promise<void> => {
      if (value === null || typeof value !== "object" || seen.has(value))
        return;
      seen.add(value);

      if (typeof value.$ref === "string") {
        const hashIndex = value.$ref.indexOf("#");
        const externalPath =
          hashIndex >= 0 ? value.$ref.slice(0, hashIndex) : value.$ref;
        if (externalPath) {
          if (!isLocalOpenApiPath(externalPath)) {
            throw new Error(
              `OpenAPI external reference "${value.$ref}" must be a local file`,
            );
          }
          const targetUrl = await visit(
            resolveOpenApiReference(realPath, externalPath),
            value.$ref,
          );
          const fragment = hashIndex >= 0 ? value.$ref.slice(hashIndex) : "";
          value.$ref = `${targetUrl}${fragment}`;
        }
      }

      await Promise.all(Object.values(value).map(scan));
    };
    await scan(document);
    return snapshotUrl;
  };

  const rootUrl = await visit(rootFile, rootFile);
  return { rootDocument: snapshots.get(rootUrl), snapshots };
}

async function dereferenceOpenApiSnapshots(
  rootDocument: any,
  snapshots: Map<string, any>,
): Promise<any> {
  const snapshotResolver = parserFileResolver({
    order: 1,
    canRead: (file) => snapshots.has(file.url),
    read: (file) => {
      const document = snapshots.get(file.url);
      if (document === undefined) {
        throw new Error(`Unknown OpenAPI snapshot "${file.url}"`);
      }
      return document;
    },
  });
  const bundled = await bundle(rootDocument, {
    resolve: { file: snapshotResolver },
  });
  return dereference(bundled, { resolve: { external: false } });
}

/**
 * Parses one or more OpenAPI specs and exposes everything the generator needs:
 * the operation descriptors, lookup indices for the MDX frontmatter path,
 * synthetic sidebar/sitemap `PageMeta` objects, per-endpoint markdown bodies
 * (for llms output), and the request-execution allowlist.
 *
 * `load()` is transactional: every configured spec must parse and process
 * successfully before the current registry is replaced. A failed reload throws
 * and leaves the last-known-good state available to callers.
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
    const next = new OpenApiRegistry();
    const multi = specs.length > 1;
    const usedSlugs = new Set<string>();
    const allowlistKeys = new Set<string>();

    const rootRealPath =
      specs.length > 0 ? await fs.realpath(rootDir) : path.resolve(rootDir);

    for (const spec of specs) {
      let doc: any;
      try {
        if (!isLocalOpenApiPath(spec.file)) {
          throw new Error(
            `OpenAPI spec "${spec.file}" must be a local file within rootDir`,
          );
        }
        const configuredPath =
          path.isAbsolute(spec.file) || path.win32.isAbsolute(spec.file)
            ? path.normalize(spec.file)
            : path.resolve(rootDir, spec.file);
        const absolute = await resolveLocalOpenApiFile(
          rootRealPath,
          configuredPath,
          spec.file,
        );
        const { rootDocument, snapshots } = await snapshotOpenApiDocuments(
          rootRealPath,
          absolute,
        );
        doc = await dereferenceOpenApiSnapshots(rootDocument, snapshots);
      } catch (error) {
        throw new Error(
          `Failed to parse OpenAPI spec "${spec.file}": ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
      try {
        next.ingest(doc, spec, multi, apiBaseSlug, usedSlugs, allowlistKeys);
      } catch (error) {
        throw new Error(
          `Failed to process OpenAPI spec "${spec.file}": ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
    }

    if (next.operations.length > 0) {
      const body = buildApiIndexBody(next.operations);
      next.pages.unshift({
        slug: apiBaseSlug,
        title: "API Reference",
        description: `Browse all ${next.operations.length} API endpoints.`,
        date: null,
        category: "Overview",
        path: "@openapi/index",
        categoryOrder: -1,
        order: -1,
        section: apiBaseSlug,
      });
      next.bodies.set(apiBaseSlug, body);
    }

    this.operations = next.operations;
    this.byOperationId = next.byOperationId;
    this.byMethodPath = next.byMethodPath;
    this.pages = next.pages;
    this.bodies = next.bodies;
    this.allowlistEntries = next.allowlistEntries;
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
      if (isBlockedNonLoopbackLiteral(entry.host)) {
        console.warn(
          chalk.yellow(
            `⚠️ OpenAPI server "${resolveServerUrl(server)}" is a private or reserved IP. ` +
              "It remains documented, but the generated playground proxy will block requests to it.",
          ),
        );
      }
      this.allowlistEntries.push(entry);
    }
  }
}

/**
 * Builds the API-reference landing page as safe MDX. Endpoint metadata is
 * emitted through JSX string expressions, so arbitrary OpenAPI summaries,
 * paths, tags, and descriptions remain text rather than executable MDX.
 */
function buildApiIndexBody(operations: OperationDescriptor[]): string {
  const bySpec = new Map<string, Map<string, OperationDescriptor[]>>();
  for (const operation of operations) {
    const tag = operation.tags[0] ?? "Endpoints";
    let byTag = bySpec.get(operation.specName);
    if (!byTag) {
      byTag = new Map();
      bySpec.set(operation.specName, byTag);
    }
    const endpoints = byTag.get(tag) ?? [];
    endpoints.push(operation);
    byTag.set(tag, endpoints);
  }

  const lines = [
    "# API Reference",
    "",
    `Browse all ${operations.length} API endpoint${operations.length === 1 ? "" : "s"}. Select an endpoint to view its parameters, responses, and live request playground.`,
  ];
  const multipleSpecs = bySpec.size > 1;

  for (const [specName, byTag] of bySpec) {
    if (multipleSpecs) {
      lines.push("", `<h2>{${JSON.stringify(specName)}}</h2>`);
    }
    for (const [tag, endpoints] of byTag) {
      const heading = multipleSpecs ? "h3" : "h2";
      lines.push(
        "",
        `<${heading}>{${JSON.stringify(tag)}}</${heading}>`,
        "",
        "<Columns cols={2}>",
      );

      for (const endpoint of endpoints) {
        const method = endpoint.method.toUpperCase();
        const title = endpoint.summary ?? `${method} ${endpoint.path}`;
        const description =
          firstLine(endpoint.description) ||
          `View the ${method} ${endpoint.path} endpoint.`;
        const badgeColor =
          endpoint.method === "get"
            ? "info"
            : endpoint.method === "post"
              ? "success"
              : endpoint.method === "put" || endpoint.method === "patch"
                ? "warning"
                : endpoint.method === "delete"
                  ? "error"
                  : "gray";
        lines.push(
          "",
          `<Card title={${JSON.stringify(title)}} href={${JSON.stringify(`/${endpoint.slug}`)}}>`,
          `  <Badge color=${JSON.stringify(badgeColor)} size="sm">{${JSON.stringify(method)}}</Badge>`,
          `  <code>{${JSON.stringify(endpoint.path)}}</code>`,
          `  <p>{${JSON.stringify(description)}}</p>`,
          "</Card>",
        );
      }

      lines.push("", "</Columns>");
    }
  }

  return lines.join("\n");
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

/** Emits untrusted prose as a JSX string expression, never as executable MDX. */
function jsxText(text: string): string {
  return `{${JSON.stringify(text)}}`;
}

function jsonCode(value: unknown): string {
  const serialized = JSON.stringify(value, null, 2) ?? "null";
  return `<Code language="json" code=${jsxText(serialized)} />`;
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
    `<Field value={${JSON.stringify(name)}} type={${JSON.stringify(type)}}${required ? " required" : ""}>`,
  ];
  if (desc) lines.push(jsxText(desc));
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
 * a schema/example code block per response. Spec-derived strings are emitted
 * only through serialized JSX expressions. Rendered above the playground.
 */
export function buildEndpointDoc(op: OperationDescriptor): string {
  const out: string[] = [];
  if (op.description) out.push(jsxText(op.description));
  else if (op.summary) out.push(jsxText(op.summary));

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
      out.push(jsonCode(body.schema));
    }
  }

  if (op.responses.length > 0) {
    out.push("## Responses");
    for (const response of op.responses) {
      out.push(`<h3>{${JSON.stringify(response.status)}}</h3>`);
      if (response.description) {
        out.push(jsxText(inlineText(response.description)));
      }
      const media =
        response.content.find((m) => m.contentType.includes("json")) ??
        response.content[0];
      const payload = media?.example ?? media?.schema;
      if (payload !== undefined) {
        out.push(jsonCode(payload));
      }
    }
  }

  return out.join("\n\n");
}
