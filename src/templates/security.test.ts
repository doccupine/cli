import { describe, expect, it } from "vitest";

import { accessControlTemplate } from "./lib/access.js";
import { mcpRoutesTemplate } from "./app/api/mcp/route.js";
import { playgroundRoutesTemplate } from "./app/api/playground/route.js";
import { ragRoutesTemplate } from "./app/api/rag/route.js";
import { searchRoutesTemplate } from "./app/api/search/route.js";
import { mcpToolsTemplate } from "./services/mcp/tools.js";
import { proxyTemplate } from "./proxy.js";
import { nextConfigTemplate } from "./next.config.js";
import { gitignoreTemplate } from "./gitignore.js";
import { prettierignoreTemplate } from "./prettierignore.js";
import { ssrfGuardTemplate } from "./utils/ssrfGuard.js";
import { playgroundAllowlistTemplate } from "./utils/playgroundAllowlist.js";

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
      'if (sitePassword && !isMcpPath && !pathname.startsWith("/_next"))',
    );
    expect(proxy).toContain('pathname.startsWith("/api/playground")');
    expect(proxy).toContain("!timingSafeEqual(token, apiKey)");
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

  it("keeps metadata/link-local addresses permanently blocked", () => {
    expect(ssrfGuardTemplate).toContain("isAlwaysBlockedIp");
    expect(ssrfGuardTemplate).toContain("a === 169 && b === 254");
    expect(ssrfGuardTemplate).toContain('head.startsWith("ff")');
    expect(ssrfGuardTemplate).toContain('if (clean.startsWith("::ffff:"))');
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

  it("keeps machine-local generator state out of user formatting and commits", () => {
    expect(gitignoreTemplate).toContain(".doccupine-install");
    expect(prettierignoreTemplate).toContain(".doccupine-*");
  });
});
