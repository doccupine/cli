/**
 * `<Visibility for="humans">` and `<Visibility for="agents">` blocks in MDX.
 *
 * Every consumer of a page reads one of two versions of its MDX:
 *
 * - humans: the rendered page (and its table of contents, raw view and RSS
 *   items) and the site search;
 * - agents: llms-full.txt, the per-page .md copies, the MCP server's docs
 *   content, the AI chat's index and the "Copy content" button.
 *
 * A version drops the other audience's blocks and unwraps its own, so the
 * Visibility tags never reach either one. Code (fenced blocks and inline
 * spans) is left exactly as written, so a page can document the syntax.
 */
export type Audience = "humans" | "agents";

const FENCED_CODE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm;
const INLINE_CODE = /`[^`\n]*`/g;
// An innermost block: no other Visibility opening tag between its own tags.
const INNERMOST =
  /<Visibility\b([^>]*?)>((?:(?!<Visibility\b)[\s\S])*?)<\/Visibility\s*>/;
const SELF_CLOSING = /<Visibility\b[^>]*?\/>/g;
const FOR_ATTRIBUTE =
  /\bfor\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*(?:"([^"]*)"|'([^']*)')\s*\})/;
// Placeholders for protected code: private-use characters that never occur
// in a page, numbered so each restores its own original.
const PLACEHOLDER = /\uE000(\d+)\uE001/g;

/** The audience a block is for; anything else is shown to both. */
function blockAudience(attributes: string): Audience | null {
  const match = FOR_ATTRIBUTE.exec(attributes);
  const value = match?.slice(1).find((group) => group !== undefined);
  return value === "humans" || value === "agents" ? value : null;
}

/** Whether the MDX has any Visibility block outside code. */
export function hasVisibilityBlocks(mdx: string): boolean {
  return /<Visibility\b/.test(
    mdx.replace(FENCED_CODE, "").replace(INLINE_CODE, ""),
  );
}

/** The MDX one audience reads: the other audience's blocks removed. */
export function forAudience(mdx: string, audience: Audience): string {
  if (!mdx.includes("<Visibility")) return mdx;

  const protectedCode: string[] = [];
  const protect = (code: string) =>
    `\uE000${protectedCode.push(code) - 1}\uE001`;
  let text = mdx.replace(FENCED_CODE, protect).replace(INLINE_CODE, protect);
  if (!text.includes("<Visibility")) return mdx;

  let removed = false;
  for (;;) {
    const match = INNERMOST.exec(text);
    if (!match) break;
    const [whole, attributes, inner] = match;
    const target = blockAudience(attributes);
    const keep = target === null || target === audience;
    if (!keep) removed = true;
    text =
      text.slice(0, match.index) +
      (keep ? inner : "") +
      text.slice(match.index + whole.length);
  }
  text = text.replace(SELF_CLOSING, "");
  // A removed block leaves the blank lines that framed it behind.
  if (removed) text = text.replace(/\n{3,}/g, "\n\n");

  return text.replace(
    PLACEHOLDER,
    (_, index: string) => protectedCode[Number(index)],
  );
}
