import { describe, expect, it } from "vitest";
import net from "node:net";

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
    expect(mcpRoutesTemplate).toContain("await reader.cancel()");
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
      "async function readJsonBody",
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
