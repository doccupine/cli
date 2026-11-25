export const sidePanelTemplate = `import React from "react";

// Styles: app/styles (.dcp-side-panel). It renders on the server, so the
// columns that make room for it (keyed off data-side-panel) are right on the
// first paint.
interface SidePanelProps {
  children?: React.ReactNode;
}

function SidePanel({ children }: SidePanelProps) {
  return (
    <aside className="dcp-side-panel" aria-label="Page panel" data-side-panel>
      {children}
    </aside>
  );
}

export { SidePanel };
`;
