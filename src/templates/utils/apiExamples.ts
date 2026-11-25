export const apiExamplesTemplate = `// <RequestExample> and <ResponseExample> blocks belong in the right rail, but
// MDX renders every component where it is written. So before compiling, Docs
// cuts the blocks out of the page source and compiles them on their own into
// one rail (components/Docs.tsx): it stands where the first block was, which
// is where phones show it, and lifts into the right rail on wide screens.
//
// A block must start on its own line. Code fences are tracked, so a fence
// that shows the syntax (or holds a closing tag) is never cut.

const OPEN = /^\\s*<(?:RequestExample|ResponseExample)\\b/;
const CLOSE = /<\\/(?:RequestExample|ResponseExample)\\s*>/;
const FENCE = /^\\s*(\`{3,}|~{3,})/;

/** Where the examples rail renders in the page body. */
export const API_EXAMPLES_SLOT = "<ApiExamplesSlot />";

export function splitApiExamples(source: string): {
  body: string;
  examples: string | null;
} {
  const body: string[] = [];
  const blocks: string[][] = [];
  let block: string[] | null = null;
  let fence: string | null = null;

  const close = () => {
    if (!block) return;
    blocks.push(block);
    if (blocks.length === 1) body.push(API_EXAMPLES_SLOT);
    block = null;
  };

  for (const line of source.split("\\n")) {
    const target = block ?? body;
    const fenceMatch = FENCE.exec(line);
    if (fence) {
      target.push(line);
      const marker = fenceMatch?.[1];
      if (
        marker &&
        marker[0] === fence[0] &&
        marker.length >= fence.length &&
        line.trim() === marker
      ) {
        fence = null;
      }
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      target.push(line);
      continue;
    }
    if (!block && OPEN.test(line)) {
      block = [line];
      if (CLOSE.test(line)) close();
      continue;
    }
    target.push(line);
    if (block && CLOSE.test(line)) close();
  }
  // An unclosed block is left in the body, where MDX reports it.
  if (block) body.push(...(block as string[]));

  if (blocks.length === 0) return { body: source, examples: null };
  return {
    body: body.join("\\n"),
    examples: blocks.map((lines) => lines.join("\\n")).join("\\n\\n"),
  };
}
`;
