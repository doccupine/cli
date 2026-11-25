export const previewDataTemplate = `import React from "react";

/**
 * A fenced code block's source: the code a <Preview> shows in its code
 * panel, or one tab of a <RequestExample> / <ResponseExample>. \`title\` is
 * the fence's title="..." meta, when it has one.
 */
export interface PreviewSource {
  code: string;
  language: string;
  title?: string;
}

/**
 * Lines the code panel has room for while collapsed: three in full and a
 * fourth fading out under the toggle. Source of this many lines or fewer
 * already fits, so it is shown whole with no toggle.
 */
export const PREVIEW_COLLAPSED_LINES = 4;

/** Whether a code panel needs the "View code" toggle. */
export function isCollapsible(code: string): boolean {
  return code.split("\\n").length > PREVIEW_COLLAPSED_LINES;
}

function extractText(children: React.ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return extractText(element.props.children);
  }
  return "";
}

const LANGUAGE_CLASS = /(?:^|\\s)language-([\\w-]+)/;
// The fence's title="..." meta (rehypeCodeMeta hands the meta string down).
const TITLE_META = /(?:^|\\s)title=(?:"([^"]*)"|'([^']*)')/;

/**
 * The source of a fenced code block, or null for any other node. A fence
 * reaches MDX as <pre><code className="language-x">, but both tags arrive as
 * whatever the components map turns them into: the page maps pre to its
 * Mermaid-aware Pre and code to InlineCode, so neither type is the plain
 * tag. The check is structural instead: any element whose only child is a
 * code element (isCode decides which types count) with a language class.
 * Inline code never carries a language class, so a paragraph holding only
 * inline code is not mistaken for a fence.
 */
export function fenceSource(
  node: React.ReactNode,
  isCode: (type: unknown) => boolean,
): PreviewSource | null {
  if (!React.isValidElement(node)) return null;
  const child = (node.props as { children?: React.ReactNode }).children;
  if (!React.isValidElement(child) || !isCode(child.type)) return null;
  const props = child.props as {
    className?: string;
    meta?: string;
    children?: React.ReactNode;
  };
  const match = LANGUAGE_CLASS.exec(props.className ?? "");
  if (!match) return null;
  const titleMatch = TITLE_META.exec(props.meta ?? "");
  const title = titleMatch?.[1] ?? titleMatch?.[2];
  return {
    code: extractText(props.children).replace(/\\n$/, ""),
    language: match[1],
    ...(title ? { title } : {}),
  };
}

/**
 * Splits children into every fenced code block's source, in order, and
 * everything else.
 */
export function collectFences(
  children: React.ReactNode,
  isCode: (type: unknown) => boolean,
): { sources: PreviewSource[]; rest: React.ReactNode[] } {
  const sources: PreviewSource[] = [];
  const rest: React.ReactNode[] = [];
  for (const node of React.Children.toArray(children)) {
    const found: PreviewSource | null = fenceSource(node, isCode);
    if (found) sources.push(found);
    else rest.push(node);
  }
  return { sources, rest };
}

/**
 * Splits a <Preview>'s children: the first fenced code block becomes the
 * code panel's source, everything else (any later fences included) stays on
 * the stage, in order.
 */
export function splitPreviewChildren(
  children: React.ReactNode,
  isCode: (type: unknown) => boolean,
): { stage: React.ReactNode[]; source: PreviewSource | null } {
  const stage: React.ReactNode[] = [];
  let source: PreviewSource | null = null;
  for (const node of React.Children.toArray(children)) {
    const found: PreviewSource | null = source
      ? null
      : fenceSource(node, isCode);
    if (found) source = found;
    else stage.push(node);
  }
  return { stage, source };
}
`;
