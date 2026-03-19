export const searchRoutesTemplate = `import { NextResponse } from "next/server";
import { z } from "zod";
import { searchContent } from "@/services/search";

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(30).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const parsed = searchSchema.safeParse({
    q: url.searchParams.get("q"),
    ...(limitParam != null && { limit: limitParam }),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const results = await searchContent(parsed.data.q, parsed.data.limit ?? 10);
  return NextResponse.json({ results });
}
`;
