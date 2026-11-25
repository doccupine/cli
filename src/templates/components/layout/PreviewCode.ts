export const previewCodeTemplate = `"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { useStrings } from "@/components/useStrings";

interface PreviewCodeProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

/**
 * The collapsible code panel of a <Preview>. Collapsed, the code is clipped
 * to its first lines and fades out under a "View code" pill; expanded, it is
 * shown whole with a "Hide code" pill below it. It is one button that moves,
 * so keyboard focus stays on it across the toggle.
 */
function PreviewCode({ children, defaultExpanded = false }: PreviewCodeProps) {
  const id = useId();
  const source = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const t = useStrings();

  // The code block's <pre> is a tab stop so a long line can be scrolled
  // from the keyboard. Cut off, it has nothing to scroll to, so it leaves
  // the tab order until the code is shown.
  useEffect(() => {
    const pre = source.current?.querySelector("pre");
    if (pre) pre.tabIndex = expanded ? 0 : -1;
  }, [expanded]);

  return (
    <div
      className="dcp-preview__code"
      data-collapsible=""
      data-collapsed={!expanded || undefined}
    >
      <div id={id} ref={source} className="dcp-preview__source">
        {children}
      </div>
      <div className="dcp-preview__toggle-row">
        <button
          type="button"
          className="dcp-reset-button dcp-preview__toggle"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((open) => !open)}
        >
          <Icon name="chevron-down" size={14} />
          {expanded ? t.hideCode : t.viewCode}
        </button>
      </div>
    </div>
  );
}

export { PreviewCode };
`;
