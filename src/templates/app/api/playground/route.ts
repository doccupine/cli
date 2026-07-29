export const playgroundRoutesTemplate = `import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/utils/rateLimit";
import { matchAllowlist } from "@/utils/playgroundAllowlist";
import { guardedFetch, BlockedError } from "@/utils/ssrfGuard";
import { isSiteRequestAuthorized } from "@/lib/access";

// The playground proxy runs server-side so it can call APIs that block
// cross-origin browser requests. It is NOT an open forward proxy: every target
// is gated by the build-time allowlist (derived from the OpenAPI servers) and
// then re-validated against private/metadata IP ranges before any socket opens.
export const runtime = "nodejs";
export const maxDuration = 40;

const MAX_REQUEST_BYTES = 1_000_000;
const MAX_RESPONSE_BYTES = 5_000_000;
const TIMEOUT_MS = 30_000;

const envelopeSchema = z.object({
  targetUrl: z.string().url().max(4096),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  headers: z.record(z.string().max(256), z.string().max(8192)).optional(),
  body: z.string().max(MAX_REQUEST_BYTES).optional(),
  bodyEncoding: z.enum(["utf8", "base64"]).optional(),
});

// Headers we never forward upstream: hop-by-hop, or identity/cookie headers
// that would either leak the docs origin or be set incorrectly.
const BLOCKED_REQUEST_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "cookie",
  "origin",
  "referer",
  "forwarded",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
]);

// The only response headers echoed back to the client. Notably excludes
// set-cookie, authorization, and www-authenticate.
const SAFE_RESPONSE_HEADERS = new Set([
  "content-type",
  "content-length",
  "content-language",
  "content-disposition",
  "cache-control",
  "etag",
  "last-modified",
  "date",
  "location",
  "retry-after",
]);

function hasControlChars(value: string): boolean {
  return (
    value.includes(String.fromCharCode(10)) ||
    value.includes(String.fromCharCode(13))
  );
}

function isTextContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const t = contentType.toLowerCase();
  return (
    t.startsWith("text/") ||
    t.includes("json") ||
    t.includes("xml") ||
    t.includes("javascript") ||
    t.includes("x-www-form-urlencoded") ||
    t.includes("csv")
  );
}

export async function POST(req: Request) {
  if (!(await isSiteRequestAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = envelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { targetUrl, method, headers = {}, body, bodyEncoding } = parsed.data;

  const entry = matchAllowlist(targetUrl);
  if (!entry) {
    console.warn("[playground] blocked: non-allowlisted target");
    return NextResponse.json(
      { error: "This request target is not allowed by the API reference." },
      { status: 403 },
    );
  }

  if (Object.keys(headers).length > 50) {
    return NextResponse.json({ error: "Too many headers" }, { status: 400 });
  }

  const outboundHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (BLOCKED_REQUEST_HEADERS.has(lower)) continue;
    if (hasControlChars(key) || hasControlChars(value)) continue;
    outboundHeaders[key] = value;
  }
  outboundHeaders["user-agent"] =
    outboundHeaders["user-agent"] ?? "Doccupine-API-Playground";
  // Ask for an unencoded body so the response byte cap is measured accurately.
  outboundHeaders["accept-encoding"] = "identity";

  let bodyBuffer: Buffer | undefined;
  if (body !== undefined && method !== "GET" && method !== "HEAD") {
    bodyBuffer = Buffer.from(
      body,
      bodyEncoding === "base64" ? "base64" : "utf8",
    );
  }

  try {
    const result = await guardedFetch(targetUrl, entry, {
      method,
      headers: outboundHeaders,
      body: bodyBuffer,
      timeoutMs: TIMEOUT_MS,
      maxBytes: MAX_RESPONSE_BYTES,
    });

    const safeHeaders: Record<string, string> = {};
    let contentType: string | null = null;
    for (const [key, value] of Object.entries(result.headers)) {
      if (key === "content-type") contentType = value;
      if (SAFE_RESPONSE_HEADERS.has(key)) safeHeaders[key] = value;
    }

    const isText = isTextContentType(contentType);

    // Deliberately do NOT log the request/response here: the full URL (path and
    // query) and headers can carry reader secrets. Only blocked/failed attempts
    // are logged below via console.warn, and those record no sensitive values.
    return NextResponse.json({
      status: result.status,
      statusText: result.statusText,
      headers: safeHeaders,
      contentType,
      bodyEncoding: isText ? "utf8" : "base64",
      body: result.body.toString(isText ? "utf8" : "base64"),
      truncated: result.truncated,
      byteLength: result.body.length,
      durationMs: result.durationMs,
    });
  } catch (error) {
    if (error instanceof BlockedError) {
      console.warn("[playground] " + error.reason);
      return NextResponse.json(
        { error: "This request target is not allowed." },
        { status: 403 },
      );
    }
    const message = error instanceof Error ? error.message : "";
    if (message === "timeout") {
      console.warn("[playground] upstream timeout");
      return NextResponse.json(
        { error: "The upstream request timed out." },
        { status: 504 },
      );
    }
    console.warn("[playground] upstream request failed");
    return NextResponse.json(
      { error: "The upstream request failed." },
      { status: 502 },
    );
  }
}
`;
