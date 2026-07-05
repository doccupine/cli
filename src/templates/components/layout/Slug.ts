export const slugTemplate = `// Shared heading/anchor id helpers.
//
// \`slugify\` turns heading text into a URL-safe base slug. \`createSlugger\`
// wraps it with occurrence-based de-duplication so repeated heading text
// yields stable, unique ids ("setup", "setup-1", "setup-2", ...) matching
// the scheme used by GitHub and rehype-slug.
//
// The index sidebar (components/Docs.tsx) and the rendered headings
// (components/MDXComponents.tsx, components/layout/Update.tsx) must walk the
// document in the same order with a shared slugger so every sidebar link
// resolves to exactly one heading.

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\\w\\s-]/g, "")
    .replace(/\\s+/g, "-")
    .trim();
}

export type Slugger = (text: string) => string;

export function createSlugger(): Slugger {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : \`\${base}-\${count}\`;
  };
}
`;
