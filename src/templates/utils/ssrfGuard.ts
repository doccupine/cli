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

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums;
}

function isBlockedIpv4(ip: string): boolean {
  const nums = parseIpv4(ip);
  if (!nums) return true;
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

function parseIpv6Words(ip: string): number[] | null {
  let clean = ip.toLowerCase().split("%")[0];
  if (clean.includes(".")) {
    const separator = clean.lastIndexOf(":");
    const ipv4 = parseIpv4(clean.slice(separator + 1));
    if (separator < 0 || !ipv4) return null;
    clean =
      clean.slice(0, separator) +
      ":" +
      ((ipv4[0] << 8) | ipv4[1]).toString(16) +
      ":" +
      ((ipv4[2] << 8) | ipv4[3]).toString(16);
  }

  const halves = clean.split("::");
  if (halves.length > 2) return null;
  const parseHalf = (half: string): number[] | null => {
    if (!half) return [];
    const segments = half.split(":");
    if (segments.some((segment) => !/^[0-9a-f]{1,4}$/.test(segment))) {
      return null;
    }
    return segments.map((segment) => parseInt(segment, 16));
  };
  const left = parseHalf(halves[0]);
  const right = parseHalf(halves[1] ?? "");
  if (!left || !right) return null;

  if (halves.length === 1) return left.length === 8 ? left : null;
  const omitted = 8 - left.length - right.length;
  if (omitted < 1) return null;
  return [...left, ...Array(omitted).fill(0), ...right];
}

function ipv4FromWords(words: number[]): string {
  return [words[6] >> 8, words[6] & 255, words[7] >> 8, words[7] & 255].join(
    ".",
  );
}

function translatedIpv4(words: number[]): string | null {
  const firstFourZero = words.slice(0, 4).every((word) => word === 0);
  const firstFiveZero = firstFourZero && words[4] === 0;

  // IPv4-compatible (::/96), mapped (::ffff:0:0/96), and translated
  // (::ffff:0:0:0/96) forms all carry the IPv4 address in the final 32 bits.
  if (
    (firstFiveZero && (words[5] === 0 || words[5] === 0xffff)) ||
    (firstFourZero && words[4] === 0xffff && words[5] === 0)
  ) {
    return ipv4FromWords(words);
  }

  // RFC 6052 well-known NAT64 prefix 64:ff9b::/96.
  if (
    words[0] === 0x64 &&
    words[1] === 0xff9b &&
    words.slice(2, 6).every((word) => word === 0)
  ) {
    return ipv4FromWords(words);
  }

  return null;
}

function isNat64LocalUse(words: number[]): boolean {
  // RFC 8215 reserves the entire 64:ff9b:1::/48 prefix for local translation.
  return words[0] === 0x64 && words[1] === 0xff9b && words[2] === 1;
}

function isBlockedIpv6(ip: string): boolean {
  const words = parseIpv6Words(ip);
  if (!words) return true;
  if (isNat64LocalUse(words)) return true;

  const translated = translatedIpv4(words);
  if (translated) return isBlockedIpv4(translated);

  const allZero = words.every((word) => word === 0);
  const loopback =
    words.slice(0, 7).every((word) => word === 0) && words[7] === 1;
  if (allZero || loopback) return true;

  const head = words[0];
  if ((head & 0xffc0) === 0xfe80 || (head & 0xffc0) === 0xfec0) {
    return true; // link-local fe80::/10 + deprecated site-local fec0::/10
  }
  if ((head & 0xfe00) === 0xfc00) return true; // unique-local fc00::/7
  if ((head & 0xff00) === 0xff00) return true; // multicast ff00::/8
  return false;
}

export function isBlockedIp(ip: string): boolean {
  const type = net.isIP(ip);
  if (type === 4) return isBlockedIpv4(ip);
  if (type === 6) return isBlockedIpv6(ip);
  return true; // not a parseable IP -> fail closed
}

/**
 * Ranges that remain blocked even for an explicitly loopback-enabled entry.
 * In particular, link-local addresses include cloud instance metadata services
 * and must never become reachable through an imported OpenAPI document.
 */
function isAlwaysBlockedIpv4(ip: string): boolean {
  const nums = parseIpv4(ip);
  if (!nums) return true;
  const [a, b] = nums;
  return a === 0 || (a === 169 && b === 254) || a >= 224;
}

export function isAlwaysBlockedIp(ip: string): boolean {
  const type = net.isIP(ip);
  if (type === 4) return isAlwaysBlockedIpv4(ip);
  if (type === 6) {
    const words = parseIpv6Words(ip);
    if (!words || isNat64LocalUse(words)) return true;
    const translated = translatedIpv4(words);
    if (translated) return isAlwaysBlockedIpv4(translated);

    const head = words[0];
    return (
      words.every((word) => word === 0) ||
      (head & 0xffc0) === 0xfe80 ||
      (head & 0xffc0) === 0xfec0 ||
      (head & 0xff00) === 0xff00
    );
  }
  return true;
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
  host = host.replace(/^\\[|\\]$/g, "");

  const literalType = net.isIP(host);
  let validated: LookupAddress[];
  // Loopback opt-in exists only for local development. Production always
  // applies the complete private-address block regardless of generated data.
  const allowPrivate =
    process.env.NODE_ENV !== "production" && entry.allowPrivate === true;

  if (literalType !== 0) {
    // Raw-IP target: only allowed if the spec itself declared this host, and
    // only into a private range when it opted in via allowPrivate.
    if (isAlwaysBlockedIp(host) || (isBlockedIp(host) && !allowPrivate)) {
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
    for (const record of records) {
      if (
        isAlwaysBlockedIp(record.address) ||
        (isBlockedIp(record.address) && !allowPrivate)
      ) {
        throw new BlockedError("blocked: private IP");
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
