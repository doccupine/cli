export const apiExampleTemplate = `import React from "react";
import { Code, CodeTabs } from "@/components/layout/Code";
import type { PreviewSource } from "@/components/layout/PreviewData";

// Styles: app/styles/design.css (.dcp-api-example, see
// src/templates/styles/api-examples.ts in the CLI).

export interface ApiExampleProps {
  children?: React.ReactNode;
  /** The label above the code: "Request" or "Response" by default. */
  title?: string;
}

interface ApiExampleLayoutProps extends ApiExampleProps {
  kind: "request" | "response";
  /** The default label, in the page's language. */
  label: string;
  /** The fenced code blocks, split from the children by MDXComponents. */
  sources: PreviewSource[];
}

/**
 * One request or response example: its code blocks in the site's own code
 * window, as tabs when there are several (labeled by each fence's title, or
 * else its language). Request tabs share the reader's pick across the site,
 * so choosing Python once shows Python in every request example. Anything
 * that is not a code block renders under the code.
 */
function ApiExample({
  kind,
  title,
  label,
  sources,
  children,
}: ApiExampleLayoutProps) {
  if (sources.length === 0 && React.Children.count(children) === 0) {
    return null;
  }
  return (
    <figure className="dcp-api-example" data-kind={kind}>
      <figcaption className="dcp-api-example__label">
        {title || label}
      </figcaption>
      {sources.length === 1 && (
        <Code
          code={sources[0].code}
          language={sources[0].language}
          title={sources[0].title}
        />
      )}
      {sources.length > 1 && (
        <CodeTabs
          tabs={sources.map((source) => ({
            label: source.title || source.language,
            code: source.code,
            language: source.language,
          }))}
          syncKey={kind === "request" ? "api-request" : undefined}
        />
      )}
      {children}
    </figure>
  );
}

export { ApiExample };
`;
