export const viewTemplate = `// Styles: app/styles/design.css (.dcp-view, see src/templates/styles/views.ts
// in the CLI).

export interface ViewProps {
  /** The view's name in the page's view selector ("React", "Vue"). */
  title: string;
  children?: React.ReactNode;
}

interface ViewLayoutProps extends ViewProps {
  /** The page's first view title, shown until the reader picks another. */
  defaultTitle?: string;
}

/**
 * One alternative of the page's content. Every view renders on the server;
 * CSS shows those of the selected title (the page's first, until the reader
 * picks one in the view selector, which Docs renders in the page header).
 * The pick is remembered site-wide, and the pre-paint script in
 * app/layout.tsx restores it on <html data-view> before the first paint, so
 * the right view shows from the start.
 */
function View({ title, defaultTitle, children }: ViewLayoutProps) {
  return (
    <div
      className="dcp-view"
      data-view={title}
      data-default={title === defaultTitle || undefined}
    >
      {children}
    </div>
  );
}

export { View };
`;
