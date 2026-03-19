export const searchServiceTemplate = `import MiniSearch from "minisearch";
import { listDocs } from "@/services/mcp/tools";

interface IndexedDoc {
  id: string;
  slug: string;
  title: string;
  content: string;
}

export interface SearchHit {
  slug: string;
  snippet: string;
}

let index: MiniSearch<IndexedDoc> | null = null;
let docs: IndexedDoc[] = [];
let buildPromise: Promise<void> | null = null;

const CONTEXT_BEFORE = 60;
const CONTEXT_AFTER = 90;

async function ensureIndex(): Promise<MiniSearch<IndexedDoc>> {
  if (index) return index;
  if (buildPromise) {
    await buildPromise;
    return index!;
  }

  buildPromise = (async () => {
    const resources = await listDocs();

    docs = resources.map((doc) => {
      const slug =
        doc.path.replace(/^app\\//, "").replace(/\\/page\\.\\w+$/, "") || "";
      const cleanContent = doc.content
        .replace(/\\r\\n/g, "\\n")
        .replace(/\\n{3,}/g, "\\n\\n")
        .slice(0, 200_000);
      return {
        id: slug || "__index__",
        slug,
        title: doc.name,
        content: cleanContent,
      };
    });

    index = new MiniSearch<IndexedDoc>({
      fields: ["title", "content"],
      storeFields: ["slug", "title", "content"],
      searchOptions: {
        boost: { title: 3 },
        fuzzy: 0.2,
        prefix: true,
      },
    });

    index.addAll(docs);
  })();

  await buildPromise;
  return index!;
}

function extractSnippet(content: string, query: string): string {
  const lower = content.toLowerCase();
  const qLower = query.toLowerCase();
  const matchIdx = lower.indexOf(qLower);

  if (matchIdx === -1) {
    // Fuzzy match - no exact substring. Return start of content.
    const end = Math.min(content.length, CONTEXT_BEFORE + CONTEXT_AFTER);
    const raw = content.slice(0, end).trim();
    return raw.length < content.length ? raw + "..." : raw;
  }

  let start = Math.max(0, matchIdx - CONTEXT_BEFORE);
  let end = Math.min(content.length, matchIdx + query.length + CONTEXT_AFTER);

  // Align to word boundaries
  if (start > 0) {
    const space = content.indexOf(" ", start);
    if (space !== -1 && space < matchIdx) start = space + 1;
  }
  if (end < content.length) {
    const space = content.lastIndexOf(" ", end);
    if (space > matchIdx + query.length) end = space;
  }

  const prefix = start > 0 ? "..." : "";
  const suffix = end < content.length ? "..." : "";
  const snippet = content.slice(start, end).replace(/\\n+/g, " ").trim();

  return prefix + snippet + suffix;
}

export async function searchContent(
  query: string,
  limit = 10,
): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const idx = await ensureIndex();
  const results = idx.search(q);

  return results.slice(0, limit).map((result) => {
    const doc = docs.find((d) => d.id === result.id);
    const content = doc?.content || "";
    return {
      slug: doc?.slug || "",
      snippet: extractSnippet(content, q),
    };
  });
}
`;
