export const previewTemplate = `import React from "react";
import { Code } from "@/components/layout/Code";
import { PreviewCode } from "@/components/layout/PreviewCode";
import {
  isCollapsible,
  type PreviewSource,
} from "@/components/layout/PreviewData";

// Styles: app/styles/design.css (.dcp-preview, see
// src/templates/styles/preview.ts in the CLI).

export interface PreviewProps {
  children?: React.ReactNode;
  /** Minimum stage height in pixels (240 by default). */
  minHeight?: number | string;
  /** Start with the code panel open. */
  expanded?: boolean;
  /** Stretch images, videos and iframes to the stage width. */
  fill?: boolean;
  /** Drop the stage's padding: the content runs edge to edge. Wins over fill. */
  bleed?: boolean;
}

interface PreviewLayoutProps extends PreviewProps {
  /** The code panel's source, split from the children by MDXComponents. */
  source?: PreviewSource | null;
}

// Bounds the author's value so a typo cannot push the page miles down.
const MAX_MIN_HEIGHT = 2000;

function toMinHeight(value: number | string | undefined): string | undefined {
  const height = typeof value === "string" ? Number(value) : value;
  if (typeof height !== "number" || !Number.isFinite(height) || height < 0) {
    return undefined;
  }
  return \`\${Math.min(Math.round(height), MAX_MIN_HEIGHT)}px\`;
}

/**
 * A live example and its source: a stage that centers whatever it holds,
 * over the site's own code block. Long source collapses behind a "View
 * code" toggle, the only part that runs in the browser (PreviewCode); short
 * source is shown whole. Whether it collapses is decided from the line
 * count here, so the server markup is already final and nothing shifts on
 * hydration.
 */
function Preview({
  children,
  source,
  minHeight,
  expanded = false,
  fill = false,
  bleed = false,
}: PreviewLayoutProps) {
  const height = toMinHeight(minHeight);
  const style = height
    ? ({ "--dcp-preview-min-height": height } as React.CSSProperties)
    : undefined;
  const code = source ? (
    <Code code={source.code} language={source.language} />
  ) : null;

  return (
    <div className="dcp-preview">
      <div
        className="dcp-preview__stage"
        data-fill={(fill && !bleed) || undefined}
        data-bleed={bleed || undefined}
        style={style}
      >
        {children}
      </div>
      {source &&
        (isCollapsible(source.code) ? (
          <PreviewCode defaultExpanded={expanded}>{code}</PreviewCode>
        ) : (
          <div className="dcp-preview__code">{code}</div>
        ))}
    </div>
  );
}

export { Preview };
`;
