export const updateTemplate = `import { slugify } from "@/components/layout/Slug";

interface UpdateProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label: string;
  description?: string;
  // Alternative pure-Markdown text for this entry in the page's RSS feed.
  // Consumed at generation time; never rendered on the page.
  rss?: string;
}

function Update({ children, label = "Label", description, id }: UpdateProps) {
  // MDXComponents injects a de-duplicated id from the shared slugger so the
  // index sidebar anchor resolves here; fall back to a plain slug when used
  // outside the MDX pipeline. The label doubles as an anchor so readers can
  // right-click to copy the deep link (native #anchor jump is offset by the
  // global scroll-padding-top).
  const anchor = id ?? slugify(label);
  return (
    <div className="dcp-update" id={anchor}>
      <div className="dcp-update__sidebar">
        <div>
          <a className="dcp-update__label" href={\`#\${anchor}\`}>
            {label}
          </a>
        </div>
        {description && (
          <div className="dcp-update__description">{description}</div>
        )}
      </div>
      <div className="dcp-update__body">{children}</div>
    </div>
  );
}

export { Update };
`;
