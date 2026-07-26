export const playgroundAllowlistTemplate = `import allowlistData from "@/services/openapi/playground-allowlist.json";

// A single request-execution target the API playground is permitted to call.
// Derived at build time from the union of every OpenAPI spec's \`servers\`.
// \`allowPrivate\` is set ONLY when the spec's own declared server host is itself
// a loopback/private/metadata literal (the local-dev case).
export interface AllowlistEntry {
  scheme: "http" | "https";
  host: string;
  port: number | null;
  basePath?: string;
  allowPrivate?: boolean;
}

const allowlist: AllowlistEntry[] = Array.isArray(allowlistData)
  ? (allowlistData as AllowlistEntry[])
  : [];

export function getAllowlist(): AllowlistEntry[] {
  return allowlist;
}

function defaultPort(scheme: string): number {
  return scheme === "https" ? 443 : 80;
}

/**
 * Returns the matching allowlist entry for a target URL, or null. Matches on
 * exact scheme + hostname + effective port, plus an optional base-path prefix.
 * This is isomorphic: the server proxy uses it as a hard gate; the client uses
 * it for a consistent pre-flight check (NOT a security boundary on its own).
 */
export function matchAllowlistIn(
  entries: AllowlistEntry[],
  targetUrl: string,
): AllowlistEntry | null {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    return null;
  }
  const scheme =
    url.protocol === "https:"
      ? "https"
      : url.protocol === "http:"
        ? "http"
        : null;
  if (!scheme) return null;
  // Reject embedded credentials (userinfo) outright.
  if (url.username || url.password) return null;

  const host = url.hostname.toLowerCase().replace(/\\.$/, "");
  const port = url.port ? Number(url.port) : defaultPort(scheme);

  for (const entry of entries) {
    if (entry.scheme !== scheme) continue;
    if (entry.host !== host) continue;
    const entryPort = entry.port ?? defaultPort(entry.scheme);
    if (entryPort !== port) continue;
    if (entry.basePath && !url.pathname.startsWith(entry.basePath)) continue;
    return entry;
  }
  return null;
}

export function matchAllowlist(targetUrl: string): AllowlistEntry | null {
  return matchAllowlistIn(allowlist, targetUrl);
}
`;
