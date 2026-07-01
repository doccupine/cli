export const gateRoutesTemplate = `import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GATE_COOKIE_NAME, gateToken, timingSafeEqual } from "@/lib/siteGate";
import { rateLimit } from "@/utils/rateLimit";

export async function POST(req: Request) {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    return NextResponse.json({ ok: true });
  }

  // Rate limit password attempts by IP to slow down brute-force guessing.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let submitted: unknown;
  try {
    submitted = (await req.json())?.password;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Bad Request" },
      { status: 400 },
    );
  }

  const expected = await gateToken(password);
  const candidate = await gateToken(
    typeof submitted === "string" ? submitted : "",
  );

  if (!timingSafeEqual(candidate, expected)) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password" },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(GATE_COOKIE_NAME, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({ ok: true });
}
`;
