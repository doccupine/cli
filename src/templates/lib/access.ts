export const accessControlTemplate = `import { cookies } from "next/headers";
import {
  GATE_COOKIE_NAME,
  isGateUnlocked,
  timingSafeEqual,
} from "@/lib/siteGate";

function bearerToken(req: Request): string | null {
  const authorization = req.headers.get("authorization");
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
}

/**
 * Route-level authorization for site content. Middleware provides the fast
 * outer gate, while this check ensures direct route invocations are protected
 * too.
 */
export async function isSiteRequestAuthorized(): Promise<boolean> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return true;

  const cookieStore = await cookies();
  return isGateUnlocked(cookieStore.get(GATE_COOKIE_NAME)?.value, password);
}

/**
 * MCP clients may authenticate with DOCS_API_KEY. When no API key is configured,
 * a password-protected site requires the normal gate cookie instead of silently
 * exposing its documentation API.
 */
export async function isMcpRequestAuthorized(req: Request): Promise<boolean> {
  const apiKey = process.env.DOCS_API_KEY;
  if (apiKey) {
    const token = bearerToken(req);
    return token !== null && timingSafeEqual(token, apiKey);
  }
  return isSiteRequestAuthorized();
}
`;
