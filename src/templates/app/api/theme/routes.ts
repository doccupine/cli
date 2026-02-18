export const routesTemplate = `import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { theme } = await request.json();
    if (theme !== "light" && theme !== "dark") {
      return NextResponse.json(
        { ok: false, error: "Invalid theme" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("theme", theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Bad Request" },
      { status: 400 },
    );
  }
}
`;
