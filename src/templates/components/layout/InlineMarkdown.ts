export const inlineMarkdownTemplate = `import React from "react";
import Link from "next/link";

// Frame captions and hints, and the site banner, accept a deliberately
// small slice of Markdown: links, bold, italic and inline code. Everything is
// parsed into React elements - never dangerouslySetInnerHTML - so author
// text can't inject raw markup.
const INLINE_MD =
  /\\[([^\\]]+)\\]\\(([^)\\s]+)\\)|\\*\\*([^*]+)\\*\\*|__([^_]+)__|\`([^\`]+)\`|\\*([^*]+)\\*|_([^_]+)_/g;

// Link targets are limited to schemes that can't execute script. Anything
// else (javascript:, data:, vbscript:) falls back to literal text.
const SAFE_HREF = /^(?:https?:\\/\\/|mailto:|[/#]|\\.{1,2}\\/)/i;

// Emphasis and link labels are parsed recursively, so the matcher must not
// carry state between calls - matchAll() iterates over its own clone of the
// pattern, leaving INLINE_MD.lastIndex untouched for the caller mid-loop.
function renderInline(text: string, keyPrefix = ""): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_MD)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    // RegExpExecArray types every group as string, but unmatched alternatives
    // are undefined at runtime - widen so the branch checks below are honest.
    const full = match[0];
    const groups: Array<string | undefined> = match;
    const [, linkText, href, strong, strongAlt, code, em, emAlt] = groups;
    const key = \`\${keyPrefix}\${start}\`;

    if (href !== undefined) {
      const label = renderInline(linkText as string, \`\${key}-\`);
      if (!SAFE_HREF.test(href)) {
        nodes.push(full);
      } else if (href.startsWith("/")) {
        nodes.push(
          <Link key={key} href={href}>
            {label}
          </Link>,
        );
      } else if (href.startsWith("#")) {
        nodes.push(
          <a key={key} href={href}>
            {label}
          </a>,
        );
      } else {
        nodes.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>,
        );
      }
    } else if (strong !== undefined || strongAlt !== undefined) {
      nodes.push(
        <strong key={key}>
          {renderInline((strong ?? strongAlt) as string, \`\${key}-\`)}
        </strong>,
      );
    } else if (code !== undefined) {
      nodes.push(<code key={key}>{code}</code>);
    } else {
      nodes.push(
        <em key={key}>{renderInline((em ?? emAlt) as string, \`\${key}-\`)}</em>,
      );
    }

    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export { renderInline };
`;
