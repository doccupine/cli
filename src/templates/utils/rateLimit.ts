export const rateLimitTemplate = `const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;
const MAX_TRACKED_CLIENTS = 10_000;

// Clean up stale entries periodically
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  });
}

function validClientAddress(value: string | null): string | null {
  const candidate = value?.split(",")[0]?.trim();
  return candidate && /^[0-9a-f:.]{3,64}$/i.test(candidate) ? candidate : null;
}

/**
 * Web Request does not expose the peer address. Trust an IP header only when
 * the runtime identifies a platform that overwrites that specific header.
 * Self-hosted deployments fall back to one shared bucket and should enforce a
 * stronger distributed rate limit at their trusted reverse proxy.
 */
function clientIdentity(request: Request): string {
  let platform = "";
  let address: string | null = null;

  if (process.env.VERCEL === "1") {
    platform = "vercel";
    address = validClientAddress(request.headers.get("x-vercel-forwarded-for"));
  } else if (process.env.CF_PAGES === "1") {
    platform = "cloudflare";
    address = validClientAddress(request.headers.get("cf-connecting-ip"));
  } else if (process.env.FLY_APP_NAME) {
    platform = "fly";
    address = validClientAddress(request.headers.get("fly-client-ip"));
  }

  return address ? \`\${platform}:\${address}\` : "shared:untrusted-proxy";
}

export function rateLimit(request: Request): {
  allowed: boolean;
  retryAfter: number;
} {
  cleanup();

  const now = Date.now();
  const identity = clientIdentity(request);
  const entry = rateLimitMap.get(identity);

  if (!entry || now > entry.resetTime) {
    // Bound memory even when an attacker rotates spoofed forwarding headers.
    // Map iteration is insertion ordered, so remove the oldest tracked client.
    if (rateLimitMap.size >= MAX_TRACKED_CLIENTS) {
      const oldestKey = rateLimitMap.keys().next().value;
      if (oldestKey !== undefined) rateLimitMap.delete(oldestKey);
    }
    rateLimitMap.set(identity, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, retryAfter: 0 };
}
`;
