export const searchRoutesTemplate = `import { NextResponse } from "next/server";
import { z } from "zod";
import { searchContent } from "@/services/search";
import { isSiteRequestAuthorized } from "@/lib/access";

// A language code or version slug is a lowercase URL segment.
const variantTokenSchema = z
  .string()
  .regex(/^[a-z0-9-]{1,32}$/)
  .optional();

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(30).optional(),
  locale: variantTokenSchema,
  version: variantTokenSchema,
});

export async function GET(req: Request) {
  if (!(await isSiteRequestAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const localeParam = url.searchParams.get("locale");
  const versionParam = url.searchParams.get("version");
  const parsed = searchSchema.safeParse({
    q: url.searchParams.get("q"),
    ...(limitParam != null && { limit: limitParam }),
    ...(localeParam != null && { locale: localeParam }),
    ...(versionParam != null && { version: versionParam }),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const results = await searchContent(parsed.data.q, parsed.data.limit ?? 10, {
    locale: parsed.data.locale,
    version: parsed.data.version,
  });
  return NextResponse.json({ results });
}
`;
