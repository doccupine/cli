export const mdxComponentsTemplate = `import React from "react";
type MDXComponents = Record<string, React.ComponentType<any>>;
import { Code as CodeBlock } from "@/components/layout/Code";
import { Card } from "@/components/layout/Card";
import { Accordion } from "@/components/layout/Accordion";
import { Tabs, TabContent } from "@/components/layout/Tabs";
import { Callout } from "@/components/layout/Callout";

function extractAllTextFromChildren(children: React.ReactNode): string {
  if (children == null) return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (typeof children === "boolean") return "";
  if (Array.isArray(children)) return children.map(extractAllTextFromChildren).join("");
  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<any>;
    return extractAllTextFromChildren(element.props.children);
  }
  return "";
}

function generateId(text: string): string {
  return text.toLowerCase().replace(/[^\\w\\s-]/g, "").replace(/\\s+/g, "-").trim();
}

// Map <pre><code class="language-xyz"> to our <Code /> component
function Pre(props: any) {
  const child = React.Children.only(props.children) as React.ReactElement<any> | null;
  if (child && child.type === "code") {
    const className = child.props.className || "";
    const match = /language-(\\w+)/.exec(className);
    const language = match ? match[1] : undefined;
    const code = typeof child.props.children === "string" ? child.props.children.replace(/\\n$/, "") : String(child.props.children ?? "");
    if (language) {
      return (
        <CodeBlock className={className} code={code} language={language} />
      );
    }
  }
  return <pre {...props} />;
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings with auto-generated ids for TOC and deep links
    h1: ({ children, ...props }: any) => {
      const id = generateId(extractAllTextFromChildren(children));
      return (
        <h1 id={id} {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }: any) => {
      const id = generateId(extractAllTextFromChildren(children));
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: any) => {
      const id = generateId(extractAllTextFromChildren(children));
      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }: any) => {
      const id = generateId(extractAllTextFromChildren(children));
      return (
        <h4 id={id} {...props}>
          {children}
        </h4>
      );
    },
    h5: ({ children, ...props }: any) => {
      const id = generateId(extractAllTextFromChildren(children));
      return (
        <h5 id={id} {...props}>
          {children}
        </h5>
      );
    },
    h6: ({ children, ...props }: any) => {
      const id = generateId(extractAllTextFromChildren(children));
      return (
        <h6 id={id} {...props}>
          {children}
        </h6>
      );
    },

    // Code blocks
    pre: Pre,

    // Expose your custom components for MDX usage
    Card,
    Accordion,
    Tabs,
    TabContent,
    Callout,

    ...components,
  };
}`;
