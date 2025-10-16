export const middlewareTemplate = `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
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
};`;
