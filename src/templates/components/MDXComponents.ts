export const mdxComponentsTemplate = `import React from "react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MDXComponents = Record<string, React.ComponentType<any>>;
import { Space } from "cherry-styled-components";
import { Code as CodeBlock, CodeTabs } from "@/components/layout/Code";
import { Card } from "@/components/layout/Card";
import { Accordion } from "@/components/layout/Accordion";
import { Tabs, TabContent } from "@/components/layout/Tabs";
import { Callout } from "@/components/layout/Callout";
import { Icon } from "@/components/layout/Icon";
import { Columns } from "@/components/layout/Columns";
import { Field } from "@/components/layout/Field";
import { Update } from "@/components/layout/Update";
import { Steps, Step } from "@/components/layout/Steps";
import { Button } from "@/components/layout/Button";
import { ColorSwatch, ColorSwatchGroup } from "@/components/layout/ColorSwatch";
import { DemoTheme } from "@/components/layout/DemoTheme";
import { createSlugger } from "@/components/layout/Slug";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

interface PreProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode;
}

function extractAllTextFromChildren(children: React.ReactNode): string {
  if (children == null) return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (typeof children === "boolean") return "";
  if (Array.isArray(children))
    return children.map(extractAllTextFromChildren).join("");
  if (React.isValidElement(children)) {
    const element = children as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return extractAllTextFromChildren(element.props.children);
  }
  return "";
}

// Map <pre><code class="language-xyz"> to our <Code /> component
function Pre(props: PreProps) {
  const child = React.Children.only(props.children) as React.ReactElement<{
    className?: string;
    children?: React.ReactNode;
  }> | null;
  if (child && child.type === "code") {
    const className = child.props.className || "";
    const match = /language-(\\w+)/.exec(className);
    const language = match ? match[1] : undefined;
    const code = extractAllTextFromChildren(child.props.children).replace(
      /\\n$/,
      "",
    );
    if (language) {
      return (
        <CodeBlock className={className} code={code} language={language} />
      );
    }
  }
  return <pre {...props} />;
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  // One slugger per render so repeated heading text (and <Update> labels)
  // resolve to unique, document-order ids that match the index sidebar built
  // in components/Docs.tsx.
  const slug = createSlugger();
  return {
    // Headings with auto-generated ids for TOC and deep links
    h1: ({ children, ...props }: HeadingProps) => {
      const id = slug(extractAllTextFromChildren(children));
      return (
        <h1 id={id} {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }: HeadingProps) => {
      const id = slug(extractAllTextFromChildren(children));
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: HeadingProps) => {
      const id = slug(extractAllTextFromChildren(children));
      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }: HeadingProps) => {
      const id = slug(extractAllTextFromChildren(children));
      return (
        <h4 id={id} {...props}>
          {children}
        </h4>
      );
    },
    h5: ({ children, ...props }: HeadingProps) => {
      const id = slug(extractAllTextFromChildren(children));
      return (
        <h5 id={id} {...props}>
          {children}
        </h5>
      );
    },
    h6: ({ children, ...props }: HeadingProps) => {
      const id = slug(extractAllTextFromChildren(children));
      return (
        <h6 id={id} {...props}>
          {children}
        </h6>
      );
    },

    // Links - use Next.js Link for internal paths
    a: ({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      if (href && href.startsWith("/")) {
        return (
          <Link href={href} {...props}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },

    // Tables - wrap in a div for responsive overflow
    table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
      <div className="table-wrapper">
        <table {...props} />
      </div>
    ),

    // Code blocks
    pre: Pre,

    // Expose your custom components for MDX usage
    Code: CodeBlock,
    CodeTabs,
    Card,
    Accordion,
    Tabs,
    TabContent,
    Callout,
    Icon,
    Columns,
    Field,
    // Share the heading slugger so an <Update> label anchor stays unique and
    // in document order alongside the surrounding headings. Only consume a
    // slug when a label is present so a label-less <Update> does not crash the
    // slugger (Update itself renders gracefully without a label anchor).
    Update: (props: React.ComponentProps<typeof Update>) => (
      <Update {...props} id={props.label ? slug(props.label) : undefined} />
    ),
    Steps,
    Step,
    Button,
    ColorSwatch,
    ColorSwatchGroup,
    DemoTheme,
    Space,
    ...components,
  };
}
`;
