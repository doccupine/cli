export const ssrfGuardTemplate = `// SERVER-ONLY. Imported solely by app/api/playground/route.ts (a route handler,
// which never ships to the client). Performs SSRF-safe outbound requests for
// the API playground proxy: it resolves the target host, rejects any address in
// a private/loopback/link-local/metadata range, and pins the connection to the
// pre-validated IPs so DNS rebinding between check and connect cannot redirect
// the socket to an internal address.

import dns from "node:dns/promises";
import net from "node:net";
import http from "node:http";
import https from "node:https";
import type { LookupAddress } from "node:dns";
import type { LookupFunction } from "node:net";
import type { AllowlistEntry } from "@/utils/playgroundAllowlist";

export class BlockedError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = "BlockedError";
  }
}

export interface GuardedInit {
  method: string;
  headers: Record<string, string>;
  body?: Buffer;
  timeoutMs: number;
  maxBytes: number;
}

export interface GuardedResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: Buffer;
  truncated: boolean;
  durationMs: number;
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return true;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const a = nums[0];
  const b = nums[1];
  const c = nums[2];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local incl. metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0 && c === 0) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

function isBlockedIpv6(ip: string): boolean {
  const clean = ip.toLowerCase().split("%")[0];
  if (clean === "::" || clean === "::1") return true;
  if (clean.startsWith("::ffff:")) {
    const rest = clean.slice("::ffff:".length);
    if (rest.includes(".")) return isBlockedIpv4(rest);
    const segs = rest.split(":");
    if (segs.length === 2) {
      const hi = parseInt(segs[0], 16);
      const lo = parseInt(segs[1], 16);
      if (Number.isInteger(hi) && Number.isInteger(lo)) {
        const v4 = [(hi >> 8) & 255, hi & 255, (lo >> 8) & 255, lo & 255].join(
          ".",
        );
        return isBlockedIpv4(v4);
      }
    }
  }
  const head = clean.split(":")[0];
  if (
    head.startsWith("fe8") ||
    head.startsWith("fe9") ||
    head.startsWith("fea") ||
    head.startsWith("feb")
  ) {
    return true; // link-local fe80::/10
  }
  if (head.startsWith("fc") || head.startsWith("fd")) return true; // unique-local
  return false;
}

function isBlockedIp(ip: string): boolean {
  const type = net.isIP(ip);
  if (type === 4) return isBlockedIpv4(ip);
  if (type === 6) return isBlockedIpv6(ip);
  return true; // not a parseable IP -> fail closed
}

function flattenHeaders(
  headers: http.IncomingHttpHeaders,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
  }
  return out;
}

export async function guardedFetch(
  targetUrl: string,
  entry: AllowlistEntry,
  init: GuardedInit,
): Promise<GuardedResult> {
  const url = new URL(targetUrl);
  let host = url.hostname.toLowerCase();
  if (host.endsWith(".")) host = host.slice(0, -1);

  const literalType = net.isIP(host);
  let validated: LookupAddress[];

  if (literalType !== 0) {
    // Raw-IP target: only allowed if the spec itself declared this host, and
    // only into a private range when it opted in via allowPrivate.
    if (isBlockedIp(host) && !entry.allowPrivate) {
      throw new BlockedError("blocked: private IP-literal target");
    }
    validated = [{ address: host, family: literalType }];
  } else {
    let records: LookupAddress[];
    try {
      records = await dns.lookup(host, { all: true, verbatim: true });
    } catch {
      throw new BlockedError("blocked: DNS resolution failed");
    }
    if (records.length === 0) throw new BlockedError("blocked: no DNS records");
    if (!entry.allowPrivate) {
      for (const record of records) {
        if (isBlockedIp(record.address)) {
          throw new BlockedError("blocked: private IP");
        }
      }
    }
    validated = records;
  }

  const isHttps = url.protocol === "https:";
  const transport = isHttps ? https : http;

  // Pin resolution to the addresses we just validated so a re-resolution
  // between check and connect (DNS rebinding) cannot swap in a private IP.
  const lookup: LookupFunction = (_hostname, options, callback) => {
    if (options && options.all) {
      callback(null, validated);
    } else {
      callback(null, validated[0].address, validated[0].family);
    }
  };

  const requestOptions: https.RequestOptions = {
    method: init.method,
    headers: init.headers,
    lookup,
    timeout: init.timeoutMs,
  };

  return await new Promise<GuardedResult>((resolve, reject) => {
    const start = Date.now();
    let settled = false;
    const done = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const req = transport.request(url, requestOptions, (res) => {
      const chunks: Buffer[] = [];
      let received = 0;
      let truncated = false;

      res.on("data", (chunk: Buffer) => {
        received += chunk.length;
        if (received > init.maxBytes) {
          truncated = true;
          res.destroy();
          return;
        }
        chunks.push(chunk);
      });

      const finish = () =>
        done(() =>
          resolve({
            status: res.statusCode ?? 0,
            statusText: res.statusMessage ?? "",
            headers: flattenHeaders(res.headers),
            body: Buffer.concat(chunks),
            truncated,
            durationMs: Date.now() - start,
          }),
        );

      res.on("end", finish);
      res.on("close", finish);
      res.on("error", () => done(() => reject(new Error("stream error"))));
    });

    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", (err) => done(() => reject(err)));

    if (init.body && init.method !== "GET" && init.method !== "HEAD") {
      req.write(init.body);
    }
    req.end();
  });
}
`;
