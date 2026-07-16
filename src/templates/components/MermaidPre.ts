export const mermaidPreTemplate = `import React from "react";
import { Pre, extractAllTextFromChildren } from "@/components/MDXComponents";
import { Code as CodeBlock } from "@/components/layout/Code";
import { MermaidView, MermaidPlacement } from "@/components/layout/Mermaid";
import { parseCodeMeta } from "@/utils/parseCodeMeta";
import { renderDiagram } from "@/utils/mermaid";

const PLACEMENTS: MermaidPlacement[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

interface PreProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode;
}

function toPlacement(value: unknown): MermaidPlacement | undefined {
  return typeof value === "string" && (PLACEMENTS as string[]).includes(value)
    ? (value as MermaidPlacement)
    : undefined;
}

function createMermaidPre(sourcePath?: string) {
  return function MermaidPre(props: PreProps) {
    const child = React.Children.only(props.children) as React.ReactElement<{
      className?: string;
      meta?: string;
      children?: React.ReactNode;
    }> | null;

    const isMermaid =
      child &&
      child.type === "code" &&
      /language-mermaid\\b/.test(child.props.className || "");

    if (child && isMermaid) {
      const code = extractAllTextFromChildren(child.props.children).replace(
        /\\n$/,
        "",
      );
      const meta = parseCodeMeta(child.props.meta);
      const result = renderDiagram(code);

      if (!result.ok) {
        console.warn(
          \`[doccupine] Mermaid diagram in \${sourcePath ?? "an MDX file"} could not be rendered, falling back to a code block: \${result.error}\`,
        );
        return <CodeBlock code={code} language="mermaid" />;
      }

      return (
        <MermaidView
          svg={result.svg}
          width={result.width}
          placement={toPlacement(meta.placement)}
          actions={typeof meta.actions === "boolean" ? meta.actions : undefined}
        />
      );
    }

    return <Pre {...props} />;
  };
}

export { createMermaidPre };
`;
