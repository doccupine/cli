import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Client as LegacyClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport as LegacyTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  Client as ModernClient,
  StreamableHTTPClientTransport as ModernTransport,
} from "@modelcontextprotocol/client";

const MODERN_VERSION = "2026-07-28";

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitUntilReady(url, server) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) {
      throw new Error(`next start exited with ${server.exitCode}`);
    }
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Not listening yet.
    }
    await delay(500);
  }
  throw new Error(`${url} did not come up`);
}

// Records what each client sends, so the check proves which protocol era it
// spoke rather than trusting the client's defaults. Each client gets its own
// address so the site's per-client rate limit does not cut the run short.
function recordingFetch(clientAddress) {
  const sent = [];
  const fetchImpl = async (input, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set("fly-client-ip", clientAddress);
    if (typeof init.body === "string") {
      const body = JSON.parse(init.body);
      sent.push({
        method: Array.isArray(body) ? undefined : body.method,
        version: headers.get("mcp-protocol-version"),
      });
    }
    return fetch(input, { ...init, headers });
  };
  return { sent, fetchImpl };
}

async function exercise(label, client, Transport, url, clientAddress) {
  const { sent, fetchImpl } = recordingFetch(clientAddress);
  await client.connect(new Transport(url, { fetch: fetchImpl }));
  try {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name).sort();
    if (names.join() !== "get_doc,list_docs,search_docs") {
      throw new Error(`${label}: unexpected tools ${names.join()}`);
    }

    const listed = await client.callTool({ name: "list_docs", arguments: {} });
    const docs = JSON.parse(listed.content[0].text);
    if (!docs.some((doc) => doc.uri === "docs://guides/guide")) {
      throw new Error(`${label}: list_docs did not include the guide`);
    }

    const doc = await client.callTool({
      name: "get_doc",
      arguments: { path: "guides/guide" },
    });
    if (doc.isError || !doc.content[0].text.includes("A sectioned page.")) {
      throw new Error(`${label}: get_doc did not return the guide`);
    }

    const resource = await client.readResource({ uri: "docs://guides/guide" });
    if (!resource.contents[0].text.includes("A sectioned page.")) {
      throw new Error(`${label}: the guide resource was not readable`);
    }
  } finally {
    await client.close();
  }
  return sent;
}

/** Starts the built site and connects a 2025-era and a 2026-07-28 client. */
export async function smokeMcpEndpoint(siteDir) {
  const port = await freePort();
  const server = spawn(
    process.execPath,
    [
      path.join(siteDir, "node_modules", "next", "dist", "bin", "next"),
      "start",
      "--port",
      String(port),
      "--hostname",
      "127.0.0.1",
    ],
    {
      cwd: siteDir,
      // FLY_APP_NAME makes the rate limiter trust fly-client-ip, so each
      // client below has its own bucket.
      env: { ...process.env, FLY_APP_NAME: "doccupine-smoke" },
      stdio: ["ignore", "inherit", "inherit"],
    },
  );

  try {
    const url = new URL(`http://127.0.0.1:${port}/api/mcp`);
    await waitUntilReady(url, server);

    const legacy = await exercise(
      "2025 client",
      new LegacyClient({ name: "doccupine-smoke-2025", version: "1.0.0" }),
      LegacyTransport,
      url,
      "192.0.2.1",
    );
    if (legacy[0]?.method !== "initialize") {
      throw new Error("The 2025 client did not open with initialize");
    }
    if (legacy.some(({ version }) => version === MODERN_VERSION)) {
      throw new Error(`The 2025 client sent ${MODERN_VERSION}`);
    }

    // Pinned with no fallback: if the endpoint stopped serving 2026-07-28,
    // connect fails instead of quietly dropping to the 2025 handshake.
    const modern = await exercise(
      `${MODERN_VERSION} client`,
      new ModernClient(
        { name: "doccupine-smoke-2026", version: "1.0.0" },
        { versionNegotiation: { mode: { pin: MODERN_VERSION } } },
      ),
      ModernTransport,
      url,
      "192.0.2.2",
    );
    if (modern.some(({ method }) => method === "initialize")) {
      throw new Error(`The ${MODERN_VERSION} client sent initialize`);
    }
    if (!modern.every(({ version }) => version === MODERN_VERSION)) {
      throw new Error(
        `The ${MODERN_VERSION} client sent a request without its version`,
      );
    }
  } finally {
    server.kill();
  }
}
