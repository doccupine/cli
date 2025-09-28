export const renderMarkdownTemplate = `import React from "react";
import { StyledMarkdownContainer } from "@/components/layout/DocsComponents";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { useMDXComponents } from "@/components/MDXComponents";

function extractAllTextFromChildren(children: React.ReactNode): string {
  if (children == null) return "";

  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (typeof children === "boolean") return "";

  if (Array.isArray(children)) {
    return children.map(extractAllTextFromChildren).join("");
  }

  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<any>;
    return extractAllTextFromChildren(element.props.children);
  }

  return "";
}

function normalizeMarkdownSpacing(input: string): string {
  return (
    input
      // Ensure a blank line before headings
      .replace(/([^\\n])(#[\\s]+)/g, '$1\\n\\n$2')

      // Ensure a blank line before fenced code blocks
      .replace(/([^\\n])(~~~|\`\`\`)/g, '$1\\n\\n$2')

      // Ensure a blank line before images/links if they start a line
      .replace(/([^\\n])(!\\[)/g, '$1\\n\\n$2')
  );
}

function RenderMarkdown({ children }: { children: React.ReactNode }) {
  const childrenAsString = extractAllTextFromChildren(children);
  const normalizedChildren = normalizeMarkdownSpacing(childrenAsString);
  const components = useMDXComponents({});

  return (
    <StyledMarkdownContainer>
      <MDXRemote
        source={normalizedChildren}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
          },
        }}
        components={components}
      />
    </StyledMarkdownContainer>
  );
}

export { RenderMarkdown };
`;
