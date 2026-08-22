import { describe, expect, it } from "vitest";
import net from "node:net";

import { appStructure } from "../lib/structures.js";
import type { AnalyticsConfig } from "../lib/types.js";
import { accessControlTemplate } from "./lib/access.js";
import { gateRoutesTemplate } from "./app/api/gate/route.js";
import { mcpRoutesTemplate } from "./app/api/mcp/route.js";
import { playgroundRoutesTemplate } from "./app/api/playground/route.js";
import { ragRoutesTemplate } from "./app/api/rag/route.js";
import { searchRoutesTemplate } from "./app/api/search/route.js";
import { mcpServerTemplate } from "./services/mcp/server.js";
import { mcpToolsTemplate } from "./services/mcp/tools.js";
import { proxyTemplate } from "./proxy.js";
import { nextConfigTemplate } from "./next.config.js";
import { envExampleTemplate } from "./env.example.js";
import { gitignoreTemplate } from "./gitignore.js";
import { prettierignoreTemplate } from "./prettierignore.js";
import { rateLimitTemplate } from "./utils/rateLimit.js";
import { ssrfGuardTemplate } from "./utils/ssrfGuard.js";
import { playgroundAllowlistTemplate } from "./utils/playgroundAllowlist.js";
import { apiPlaygroundUtilsTemplate } from "./utils/apiPlayground.js";
import { requestBodyTemplate } from "./utils/requestBody.js";
import { chatTemplate } from "./components/Chat.js";
import { apiPlaygroundTemplate } from "./components/layout/ApiPlayground.js";

interface GeneratedRequestBodyModule {
  RequestTooLargeError: new () => Error;
  readJsonBody: (req: Request, maxBytes: number) => Promise<unknown>;
}

function generatedRequestBodyModule(): GeneratedRequestBodyModule {
  const source = requestBodyTemplate
    .replace(/\bexport /g, "")
    .replace(
      "  req: Request,\n  maxBytes: number,\n): Promise<unknown>",
      "  req,\n  maxBytes,\n)",
    )
    .replace("const chunks: Uint8Array[]", "const chunks");
  return Function(
    `${source}\nreturn { RequestTooLargeError, readJsonBody };`,
  )() as GeneratedRequestBodyModule;
}

function streamedRequest(
  chunks: Uint8Array[],
  options: { headers?: HeadersInit; signal?: AbortSignal } = {},
): Request {
  let index = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
  });
  return new Request("https://docs.example/api", {
    method: "POST",
    body,
    headers: options.headers,
    signal: options.signal,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

function generatedFunctionSource(
  source: string,
  start: string,
  end: string,
): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source
    .slice(startIndex, endIndex)
    .replace(/\bexport /g, "")
    .replace(/: value is Record<string, unknown>/g, "")
    .replace(/: number\[\] \| null/g, "")
    .replace(/: string \| null/g, "")
    .replace(/: number\[\]/g, "")
    .replace(/: (?:string|number|boolean|unknown)/g, "");
}

describe("generated security boundaries", () => {
  it("registers and imports the API Playground runtime helpers", () => {
    expect(appStructure["utils/apiPlayground.ts"]).toBe(
      apiPlaygroundUtilsTemplate,
    );
    expect(apiPlaygroundTemplate).toContain('from "@/utils/apiPlayground";');
  });

  it("registers one bounded JSON reader for generated API routes", () => {
    expect(appStructure["utils/requestBody.ts"]).toBe(requestBodyTemplate);
    for (const route of [
      gateRoutesTemplate,
      playgroundRoutesTemplate,
      ragRoutesTemplate,
      mcpRoutesTemplate,
    ]) {
      expect(route).toContain('from "@/utils/requestBody"');
      expect(route).toContain("readJsonBody(req,");
      expect(route).not.toContain("req.json()");
    }

    expect(gateRoutesTemplate).toContain(
      "const MAX_GATE_ENVELOPE_BYTES = 8 * 1024",
    );
    expect(playgroundRoutesTemplate).toContain(
      "const MAX_ENVELOPE_BYTES = 1_500_000",
    );
    expect(playgroundRoutesTemplate).toContain("{ status: 413 }");
    expect(gateRoutesTemplate).toContain("{ status: 413 }");
  });

  it("rejects oversized declared request envelopes before reading", async () => {
    const { readJsonBody, RequestTooLargeError } = generatedRequestBodyModule();
    const request = streamedRequest([new TextEncoder().encode("{}")], {
      headers: { "Content-Length": "11" },
    });

    await expect(readJsonBody(request, 10)).rejects.toBeInstanceOf(
      RequestTooLargeError,
    );
  });

  it("rejects oversized streamed request envelopes without a declaration", async () => {
    const { readJsonBody, RequestTooLargeError } = generatedRequestBodyModule();
    const request = streamedRequest([
      new TextEncoder().encode('{"value":"'),
      new TextEncoder().encode('too large"}'),
    ]);

    expect(request.headers.has("content-length")).toBe(false);
    await expect(readJsonBody(request, 16)).rejects.toBeInstanceOf(
      RequestTooLargeError,
    );
  });

  it("measures multibyte JSON envelopes as bytes, not characters", async () => {
    const { readJsonBody, RequestTooLargeError } = generatedRequestBodyModule();
    const text = JSON.stringify({ value: "é".repeat(8) });
    const bytes = new TextEncoder().encode(text);
    expect(bytes.byteLength).toBeGreaterThan(text.length);

    await expect(
      readJsonBody(streamedRequest([bytes]), text.length),
    ).rejects.toBeInstanceOf(RequestTooLargeError);
  });

  it("rejects malformed JSON after the bounded byte read", async () => {
    const { readJsonBody } = generatedRequestBodyModule();
    const request = streamedRequest([new TextEncoder().encode('{"value":')]);

    await expect(readJsonBody(request, 1024)).rejects.toBeInstanceOf(
      SyntaxError,
    );
  });

  it("cancels a pending body read when the request is aborted", async () => {
    const { readJsonBody } = generatedRequestBodyModule();
    const abortController = new AbortController();
    let bodyCancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"value":'));
      },
      cancel() {
        bodyCancelled = true;
      },
    });
    const request = new Request("https://docs.example/api", {
      method: "POST",
      body,
      signal: abortController.signal,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const result = readJsonBody(request, 1024);
    await new Promise((resolve) => setTimeout(resolve, 0));
    abortController.abort();

    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(bodyCancelled).toBe(true);
  });

  it("caps decoded UTF-8 and base64 playground bodies by bytes", () => {
    const start = playgroundRoutesTemplate.indexOf(
      "function decodePlaygroundBody",
    );
    const end = playgroundRoutesTemplate.indexOf(
      "function isTextContentType",
      start,
    );
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const decodeSource = playgroundRoutesTemplate.slice(start, end);
    const executableDecodeSource = decodeSource.replace(
      '  body: string,\n  encoding: "utf8" | "base64" | undefined,\n): Buffer',
      "  body,\n  encoding,\n)",
    );
    const generated = Function(
      "Buffer",
      `class RequestTooLargeError extends Error {}
       const MAX_REQUEST_BODY_BYTES = 1_000_000;
       ${executableDecodeSource}
       return { decodePlaygroundBody, RequestTooLargeError };`,
    )(Buffer) as {
      decodePlaygroundBody: (
        body: string,
        encoding: "utf8" | "base64" | undefined,
      ) => Buffer;
      RequestTooLargeError: new () => Error;
    };

    expect(() =>
      generated.decodePlaygroundBody("é".repeat(500_001), "utf8"),
    ).toThrow(generated.RequestTooLargeError);
    expect(() =>
      generated.decodePlaygroundBody(
        Buffer.alloc(1_000_001).toString("base64"),
        "base64",
      ),
    ).toThrow(generated.RequestTooLargeError);
    expect(playgroundRoutesTemplate).toContain("body: z.string().optional()");
  });

  it("keeps authorization and rate limiting ahead of envelope reads", () => {
    const playgroundAuthorization = playgroundRoutesTemplate.indexOf(
      "isSiteRequestAuthorized()",
    );
    const playgroundRateLimit =
      playgroundRoutesTemplate.indexOf("rateLimit(req)");
    const playgroundRead = playgroundRoutesTemplate.indexOf(
      "readJsonBody(req, MAX_ENVELOPE_BYTES)",
    );
    expect(playgroundAuthorization).toBeLessThan(playgroundRateLimit);
    expect(playgroundRateLimit).toBeLessThan(playgroundRead);
    expect(gateRoutesTemplate.indexOf("rateLimit(req)")).toBeLessThan(
      gateRoutesTemplate.indexOf("readJsonBody(req, MAX_GATE_ENVELOPE_BYTES)"),
    );
  });

  it("protects every content-bearing API inside the route handler", () => {
    expect(mcpRoutesTemplate).toContain("isMcpRequestAuthorized(req)");
    expect(playgroundRoutesTemplate).toContain("isSiteRequestAuthorized()");
    expect(ragRoutesTemplate).toContain("isSiteRequestAuthorized()");
    expect(searchRoutesTemplate).toContain("isSiteRequestAuthorized()");
    expect(accessControlTemplate).toContain("timingSafeEqual(token, apiKey)");
  });

  it("does not expose MCP around the password gate", () => {
    const proxy = proxyTemplate(null);
    expect(proxy).not.toContain("const gateUnlocked = sitePassword");
    expect(proxy).toContain(
      'if (sitePassword && !isMcpPath && !isPathSegment(pathname, "/_next"))',
    );
    expect(proxy).toContain('isPathSegment(pathname, "/api/playground")');
    expect(proxy).toContain("!timingSafeEqual(token, apiKey)");
  });

  it("classifies reserved routes on segment boundaries", () => {
    const proxy = proxyTemplate(null);
    const source = generatedFunctionSource(
      proxy,
      "function isPathSegment",
      "export async function proxy",
    );
    const isPathSegment = Function(`${source}\nreturn isPathSegment;`)() as (
      pathname: string,
      segment: string,
    ) => boolean;

    expect(isPathSegment("/api", "/api")).toBe(true);
    expect(isPathSegment("/api/search", "/api")).toBe(true);
    expect(isPathSegment("/_next/static/app.js", "/_next")).toBe(true);
    expect(isPathSegment("/api-reference", "/api")).toBe(false);
    expect(isPathSegment("/apiary", "/api")).toBe(false);
    expect(isPathSegment("/_next-private", "/_next")).toBe(false);
    expect(isPathSegment("/api/mcp-private", "/api/mcp")).toBe(false);

    expect(proxy).toContain('!isPathSegment(pathname, "/api")');
    expect(proxy).toContain('!isPathSegment(pathname, "/_next")');
    expect(proxy).not.toContain('pathname.startsWith("/api")');
    expect(proxy).not.toContain('pathname.startsWith("/_next")');
  });

  it("runtime-loads the traced docs manifest from one fixed path", () => {
    expect(mcpToolsTemplate).toContain('import fs from "node:fs"');
    expect(mcpToolsTemplate).toContain('"docs-content.json"');
    expect(mcpToolsTemplate).not.toContain(
      'import docsContentData from "@/services/mcp/docs-content.json"',
    );
    expect(mcpToolsTemplate).not.toContain("resolvedPath.startsWith");
    const nextConfig = nextConfigTemplate(null);
    expect(nextConfig).toContain('"./services/mcp/docs-content.json"');
    expect(mcpToolsTemplate).toContain(
      '.replace(/(?:^|\\/)page\\.(?:tsx?|jsx?)$/, "")',
    );
  });

  it("blocks private and metadata IPv4 represented through IPv6", () => {
    const source = generatedFunctionSource(
      ssrfGuardTemplate,
      "function parseIpv4",
      "function flattenHeaders",
    );
    const { isBlockedIp, isAlwaysBlockedIp } = Function(
      "net",
      `${source}\nreturn { isBlockedIp, isAlwaysBlockedIp };`,
    )(net) as {
      isBlockedIp: (ip: string) => boolean;
      isAlwaysBlockedIp: (ip: string) => boolean;
    };

    for (const address of [
      "::127.0.0.1",
      "::ffff:127.0.0.1",
      "::ffff:7f00:1",
      "::ffff:0:10.0.0.1",
      "64:ff9b::10.0.0.1",
      "64:ff9b::7f00:1",
      "64:ff9b:1::808:808",
      "fc00::1",
    ]) {
      expect(isBlockedIp(address), address).toBe(true);
    }

    for (const address of [
      "::ffff:169.254.169.254",
      "::ffff:a9fe:a9fe",
      "::ffff:0:a9fe:a9fe",
      "64:ff9b::169.254.169.254",
      "64:ff9b::a9fe:a9fe",
      "64:ff9b:1::a9fe:a9fe",
    ]) {
      expect(isAlwaysBlockedIp(address), address).toBe(true);
    }

    for (const address of [
      "::ffff:8.8.8.8",
      "::ffff:0:808:808",
      "64:ff9b::808:808",
      "2001:4860:4860::8888",
    ]) {
      expect(isBlockedIp(address), address).toBe(false);
    }
  });

  it("allows private playground targets only outside production", () => {
    expect(ssrfGuardTemplate).toContain(
      'process.env.NODE_ENV !== "production" && entry.allowPrivate === true',
    );
    expect(ssrfGuardTemplate).toContain("isBlockedIp(host) && !allowPrivate");
    expect(ssrfGuardTemplate).toContain(
      "isBlockedIp(record.address) && !allowPrivate",
    );
    expect(ssrfGuardTemplate).not.toContain("!entry.allowPrivate");
  });

  it("matches allowlist base paths on segment boundaries", () => {
    expect(playgroundAllowlistTemplate).toContain(
      '!url.pathname.startsWith(entry.basePath + "/")',
    );
  });

  it("does not accept a public request flag that rebuilds embeddings", () => {
    expect(ragRoutesTemplate).not.toContain("refresh: z.boolean().optional()");
    expect(ragRoutesTemplate).not.toContain("Boolean(refresh)");
  });

  it("registers MCP resources with typed metadata and readable doc URIs", () => {
    expect(mcpServerTemplate).not.toContain("server.resource(");
    expect(mcpServerTemplate).toContain(
      'server.registerResource(\n    "docs-list",\n    "docs://list",',
    );
    expect(mcpServerTemplate).toContain('mimeType: "application/json"');
    expect(mcpServerTemplate).toContain('title: "Documentation index"');
    expect(mcpServerTemplate).toContain(
      'new ResourceTemplate("docs://{+path}", { list: undefined })',
    );
    expect(mcpServerTemplate).toContain('mimeType: "text/markdown"');
    expect(mcpServerTemplate).toContain("getDoc({ path: uri.href })");
  });

  it("initializes embeddings lazily after RAG and MCP authorization", () => {
    const buildCalls = mcpServerTemplate.match(/\bbuildDocsIndex\(/g) ?? [];
    const ensureStart = mcpServerTemplate.indexOf(
      "export async function ensureDocsIndex",
    );
    const ensureEnd = mcpServerTemplate.indexOf(
      "function throwIfCancelled",
      ensureStart,
    );
    const ensureSource = mcpServerTemplate.slice(ensureStart, ensureEnd);
    const searchStart = mcpServerTemplate.indexOf(
      "export async function searchDocs",
    );
    const searchEnd = mcpServerTemplate.indexOf(
      "export function getIndexStatus",
      searchStart,
    );
    const searchSource = mcpServerTemplate.slice(searchStart, searchEnd);

    expect(buildCalls).toHaveLength(3);
    expect(ensureSource.match(/\bbuildDocsIndex\(/g)).toHaveLength(2);
    expect(searchSource).toContain("await ensureDocsIndex(false, signal)");
    expect(mcpServerTemplate).not.toContain("isLLMAvailable");
    expect(mcpServerTemplate).not.toContain("initialBuild");

    const ragAuthorization = ragRoutesTemplate.indexOf(
      "if (!(await isRagRequestAuthorized(req)))",
    );
    expect(ragAuthorization).toBeLessThan(
      ragRoutesTemplate.indexOf("await ensureDocsIndex(false, signal)"),
    );
    expect(ragAuthorization).toBeLessThan(
      ragRoutesTemplate.indexOf("await searchDocs(question, 6, signal)"),
    );

    const mcpPost = mcpRoutesTemplate.indexOf(
      "export async function POST(req: Request)",
    );
    const mcpAuthorization = mcpRoutesTemplate.indexOf(
      "if (!(await isMcpRequestAuthorized(req)))",
      mcpPost,
    );
    expect(mcpAuthorization).toBeLessThan(
      mcpRoutesTemplate.indexOf("return handleMCPRequest(req, body)", mcpPost),
    );
    expect(mcpAuthorization).toBeLessThan(
      mcpRoutesTemplate.indexOf("return handleRESTRequest(req", mcpPost),
    );
  });

  it("keeps extra dev origins an explicit env opt-in", () => {
    // Browsing the dev server via a non-localhost hostname (LAN, Tailscale)
    // needs Next's allowedDevOrigins, but the allowlist must stay empty -
    // preserving Next's DNS-rebinding protection - unless the user opts in
    // through ALLOWED_DEV_ORIGINS.
    const posthogConfig = {
      provider: "posthog",
      posthog: { key: "phc_test", host: "https://us.i.posthog.com" },
    } as AnalyticsConfig;
    for (const nextConfig of [
      nextConfigTemplate(null),
      nextConfigTemplate(posthogConfig),
    ]) {
      expect(nextConfig).toContain('process.env.ALLOWED_DEV_ORIGINS ?? ""');
      expect(nextConfig).toContain(
        "allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}",
      );
      expect(nextConfig).not.toMatch(/allowedDevOrigins:\s*\[[^\]]/);
    }
  });

  it("bounds submitted chat history to the RAG server contract", () => {
    // The client bound now lives in Cherry's ChatProvider (historyLimit
    // defaults to 20 entries capped at 4000 chars each, matching the RAG
    // contract), so the template must pass the provider's history through
    // untouched rather than rebuilding its own.
    expect(chatTemplate).toContain("JSON.stringify({ question, history })");
    expect(ragRoutesTemplate).toContain(
      "history: z.array(messageSchema).max(20).optional()",
    );
    expect(ragRoutesTemplate).toContain("content: z.string().max(4000)");
    expect(ragRoutesTemplate).toContain(
      "const MAX_RAG_REQUEST_BYTES = 512 * 1024",
    );
  });

  it("bounds MCP bodies, tool arguments, batches, and results on both transports", () => {
    expect(mcpServerTemplate).toContain(
      "export const MCP_MAX_REQUEST_BYTES = 64 * 1024",
    );
    expect(mcpServerTemplate).toContain(
      "export const MCP_MAX_TOOL_ARGUMENT_BYTES = 8 * 1024",
    );
    expect(mcpServerTemplate).toContain(
      "export const MCP_MAX_RESULT_BYTES = 256 * 1024",
    );
    expect(requestBodyTemplate).toContain("await reader.cancel()");
    expect(mcpRoutesTemplate).toContain("MAX_PROTOCOL_MESSAGES");
    expect(mcpRoutesTemplate).toContain("protocolToolCallError(body)");
    expect(mcpRoutesTemplate).toContain("{ parsedBody }");
    expect(mcpRoutesTemplate).toContain("serializeMCPResult(value)");
    expect(mcpServerTemplate).toContain("serializeMCPResult(value)");

    for (const schema of [
      "searchDocsArgsSchema",
      "getDocArgsSchema",
      "listDocsArgsSchema",
    ]) {
      expect(mcpRoutesTemplate).toContain(`${schema}.safeParse`);
      expect(mcpServerTemplate).toContain(`inputSchema: ${schema}`);
    }
    expect(mcpServerTemplate).toContain(
      "limit: z.number().int().min(1).max(20).optional()",
    );
  });

  it("allows at most one protocol tool call while retaining non-tool batches", () => {
    const helpers = generatedFunctionSource(
      mcpRoutesTemplate,
      "function isRecord",
      "function protocolToolCallError",
    );
    const validator = generatedFunctionSource(
      mcpRoutesTemplate,
      "function protocolToolCallError",
      "function protocolError",
    );
    const protocolToolCallError = Function(
      "searchDocsArgsSchema",
      "getDocArgsSchema",
      "listDocsArgsSchema",
      `const MAX_PROTOCOL_MESSAGES = 20;\nconst MCP_MAX_TOOL_ARGUMENT_BYTES = 8 * 1024;\n${helpers}\n${validator}\nreturn protocolToolCallError;`,
    )(
      { safeParse: () => ({ success: true }) },
      { safeParse: () => ({ success: true }) },
      { safeParse: () => ({ success: true }) },
    ) as (body: unknown) => string | null;
    const toolCall = (id: number) => ({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: { name: "unknown_tool", arguments: {} },
    });

    expect(protocolToolCallError([toolCall(1), toolCall(2)])).toBe(
      "Only one tools/call is allowed per request",
    );
    expect(
      protocolToolCallError([
        { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
        { jsonrpc: "2.0", method: "notifications/initialized" },
        toolCall(2),
      ]),
    ).toBeNull();
    expect(
      protocolToolCallError([
        { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
        { jsonrpc: "2.0", method: "notifications/initialized" },
      ]),
    ).toBeNull();
  });

  it("never returns MCP exception text in a 500 response", () => {
    expect(mcpRoutesTemplate).toContain('{ error: "Internal server error" }');
    expect(mcpRoutesTemplate).toContain(
      'protocolError("Internal server error", 500)',
    );
    expect(mcpRoutesTemplate).not.toContain("error: message");
    expect(mcpRoutesTemplate).not.toContain("e instanceof Error ? e.message");
  });

  it("uses only platform-trusted rate-limit identity headers", () => {
    for (const route of [
      gateRoutesTemplate,
      playgroundRoutesTemplate,
      ragRoutesTemplate,
      mcpRoutesTemplate,
    ]) {
      expect(route).toContain("rateLimit(req)");
      expect(route).not.toContain('headers.get("x-forwarded-for")');
    }
    expect(rateLimitTemplate).not.toContain('headers.get("x-forwarded-for")');
    expect(rateLimitTemplate).toContain('process.env.VERCEL === "1"');
    expect(rateLimitTemplate).toContain('process.env.CF_PAGES === "1"');
    expect(rateLimitTemplate).toContain("process.env.FLY_APP_NAME");
    expect(rateLimitTemplate).toContain('"shared:untrusted-proxy"');
    expect(rateLimitTemplate).toContain("rateLimit(request: Request)");
    expect(rateLimitTemplate).not.toContain("legacy");
  });

  it("cancels RAG work through indexing, search, and model streaming", () => {
    expect(ragRoutesTemplate).toContain("new AbortController()");
    expect(ragRoutesTemplate).toContain(
      'req.signal.addEventListener("abort", abortWork',
    );
    expect(ragRoutesTemplate).toContain("ensureDocsIndex(false, signal)");
    expect(ragRoutesTemplate).toContain("searchDocs(question, 6, signal)");
    expect(ragRoutesTemplate).toContain("llm.stream(prompt, { signal })");
    expect(ragRoutesTemplate).toContain("if (signal.aborted) return");
    expect(mcpServerTemplate).toContain("signal?: AbortSignal");
    expect(mcpServerTemplate).toContain("signal?.throwIfAborted()");
    expect(mcpServerTemplate).toContain("await embedQuery(query, signal)");
  });

  it("makes paid RAG access explicitly protectable without changing public defaults", () => {
    expect(ragRoutesTemplate).toContain("process.env.RAG_API_KEY");
    expect(ragRoutesTemplate).toContain("timingSafeEqual(token, apiKey)");
    expect(ragRoutesTemplate).toContain(
      "if (process.env.SITE_PASSWORD && siteAuthorized) return true",
    );
    expect(envExampleTemplate).toContain("# RAG_API_KEY=");
    expect(envExampleTemplate).toContain(
      "Public documentation remains intentionally public",
    );
    expect(envExampleTemplate).toContain("browser chat cannot safely hold");
  });

  it("ignores every env variant except the non-secret example", () => {
    expect(gitignoreTemplate).toContain(".env*\n!.env.example");
    expect(gitignoreTemplate).not.toContain(".env*.local");
  });

  it("keeps machine-local generator state out of user formatting and commits", () => {
    expect(gitignoreTemplate).toContain(".doccupine-*");
    expect(prettierignoreTemplate).toContain(".doccupine-*");
  });
});
