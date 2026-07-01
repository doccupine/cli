export const siteGateTemplate = `/**
 * Shared site-gate crypto. The gate cookie never stores the password itself -
 * it stores HMAC-SHA256(key=SITE_PASSWORD, data=GATE_MESSAGE) as hex. Uses Web
 * Crypto (crypto.subtle) so the same helpers run in both the Edge middleware
 * (proxy.ts) and the Node route handler (app/api/gate/route.ts).
 */
export const GATE_COOKIE_NAME = "doccupine_gate";

// Bump the suffix to invalidate every previously issued cookie at once.
const GATE_MESSAGE = "doccupine-gate-v1";

async function hmacHex(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(data),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Derive the gate cookie token for a given password. */
export function gateToken(password: string): Promise<string> {
  return hmacHex(password, GATE_MESSAGE);
}

/** Constant-time comparison so a mismatch never leaks token bytes via timing. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Whether the request carrying the given cookie value is allowed past the gate.
 * Returns true (open) when no password is configured.
 */
export async function isGateUnlocked(
  cookieValue: string | undefined,
  password: string | undefined = process.env.SITE_PASSWORD,
): Promise<boolean> {
  if (!password) return true;
  if (!cookieValue) return false;
  const expected = await gateToken(password);
  return timingSafeEqual(cookieValue, expected);
}
`;
