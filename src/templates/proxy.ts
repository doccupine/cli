export const proxyTemplate = `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  // API key auth for /api/mcp when DOCS_API_KEY is configured
  if (req.nextUrl.pathname.startsWith("/api/mcp")) {
    const apiKey = process.env.DOCS_API_KEY;
    if (apiKey) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (token !== apiKey) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 },
        );
      }
    }
  }

  const res = NextResponse.next();

  res.headers.set("Accept-CH", "Sec-CH-Prefers-Color-Scheme");
  res.headers.set("Vary", "Sec-CH-Prefers-Color-Scheme");
  res.headers.set("Critical-CH", "Sec-CH-Prefers-Color-Scheme");

  const existing = req.cookies.get("theme")?.value;
  const hint = req.headers.get("Sec-CH-Prefers-Color-Scheme");

  if (!existing && hint) {
    const value = hint === "dark" ? "dark" : "light";
    res.cookies.set("theme", value, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  matcher: ["/:path*"],
};
`;
