export const mdxComponentsTemplate = `import React from "react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MDXComponents = Record<string, React.ComponentType<any>>;
import { Badge } from "@/components/layout/Badge";
import { Code as CodeBlock, CodeTabs } from "@/components/layout/Code";
import { Card } from "@/components/layout/Card";
import { Accordion } from "@/components/layout/Accordion";
import { Tabs, TabContent } from "@/components/layout/Tabs";
import { Callout } from "@/components/layout/Callout";
import { Icon } from "@/components/layout/Icon";
import { Install } from "@/components/layout/Install";
import { Kbd } from "@/components/layout/Kbd";
import { Visibility } from "@/components/layout/Visibility";
import { View } from "@/components/layout/View";
import { GitHubCard } from "@/components/layout/GitHubCard";
import { Columns } from "@/components/layout/Columns";
import { Field } from "@/components/layout/Field";
import { Frame } from "@/components/layout/Frame";
import {
  Preview as PreviewLayout,
  type PreviewProps,
} from "@/components/layout/Preview";
import {
  collectFences,
  splitPreviewChildren,
} from "@/components/layout/PreviewData";
import {
  ApiExample,
  type ApiExampleProps,
} from "@/components/layout/ApiExample";
import { DEFAULT_STRINGS, type UiStrings } from "@/utils/strings";
import { Prompt } from "@/components/layout/Prompt";
import { SidePanel } from "@/components/layout/SidePanel";
import { Space } from "@/components/layout/Space";
import { Update } from "@/components/layout/Update";
import { Steps, Step } from "@/components/layout/Steps";
import { Button } from "@/components/layout/Button";
import { ColorSwatch, ColorSwatchGroup } from "@/components/layout/ColorSwatch";
import { DemoTheme } from "@/components/layout/DemoTheme";
import { Tooltip } from "@/components/layout/Tooltip";
import { Tree as TreeRoot } from "@/components/layout/Tree";
import {
  parseTreeChildren,
  TreeFolder,
  TreeFile,
} from "@/components/layout/TreeData";
import { createSlugger } from "@/components/layout/Slug";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

interface PreProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode;
}

// The Tree compound is assembled here in shared code: statics attached to
// the client component would not survive the client-reference boundary, and
// the Tree.Folder / Tree.File elements MDX creates must be parsed in the
// same runtime that created them, where marker identity is guaranteed. Only
// the resulting plain TreeNode data crosses to the client component.
const Tree = Object.assign(
  function Tree({ children }: { children?: React.ReactNode }) {
    return <TreeRoot nodes={parseTreeChildren(children, "node")} />;
  },
  { Folder: TreeFolder, File: TreeFile },
);

// <Tree> and <FileTree> are aliases; either tag supports either syntax.
const FileTree = Tree;

export function extractAllTextFromChildren(children: React.ReactNode): string {
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

// Inline code. A value with an unbroken run longer than this (a URL, a long
// path) is marked data-long, and only those may break anywhere: breaking any
// code anywhere would also let a table column shrink until short values like
// \`classic\` split mid-word.
const LONG_CODE_RUN = 20;

export function InlineCode(props: React.ComponentProps<"code">) {
  const text = extractAllTextFromChildren(props.children);
  const isLong = text.split(/\\s+/).some((run) => run.length > LONG_CODE_RUN);
  return <code {...props} data-long={isLong ? "" : undefined} />;
}

// Map <pre><code class="language-xyz"> to our <Code /> component
export function Pre(props: PreProps) {
  const child = React.Children.only(props.children) as React.ReactElement<{
    className?: string;
    children?: React.ReactNode;
  }> | null;
  if (child && (child.type === "code" || child.type === InlineCode)) {
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

// A fence's <code> arrives as the components map's \`code\` (InlineCode
// below), or as the plain tag where nothing maps it.
function isCodeType(type: unknown): boolean {
  return type === "code" || type === InlineCode;
}

// <Preview>: the first fenced code block among the children becomes the code
// panel, the rest is the stage. Split here, where InlineCode is in scope, so
// the layout component stays free of this module.
export function Preview({ children, ...props }: PreviewProps) {
  const { stage, source } = splitPreviewChildren(children, isCodeType);
  return (
    <PreviewLayout {...props} source={source}>
      {stage}
    </PreviewLayout>
  );
}

// <RequestExample> and <ResponseExample>: their fenced code blocks become the
// example's code, split here for the same reason as <Preview>. Docs passes
// the page language's strings for the default labels.
type LocalizedApiExampleProps = ApiExampleProps & { strings?: UiStrings };

export function RequestExample({
  children,
  strings = DEFAULT_STRINGS,
  ...props
}: LocalizedApiExampleProps) {
  const { sources, rest } = collectFences(children, isCodeType);
  return (
    <ApiExample
      {...props}
      kind="request"
      label={strings.requestExample}
      sources={sources}
    >
      {rest}
    </ApiExample>
  );
}

export function ResponseExample({
  children,
  strings = DEFAULT_STRINGS,
  ...props
}: LocalizedApiExampleProps) {
  const { sources, rest } = collectFences(children, isCodeType);
  return (
    <ApiExample
      {...props}
      kind="response"
      label={strings.responseExample}
      sources={sources}
    >
      {rest}
    </ApiExample>
  );
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

    // Code blocks, and inline code (marks long values, see InlineCode)
    pre: Pre,
    code: InlineCode,

    // Expose your custom components for MDX usage
    Badge,
    Code: CodeBlock,
    CodeTabs,
    Card,
    Accordion,
    Tabs,
    TabContent,
    Callout,
    Icon,
    Install,
    Kbd,
    Columns,
    Field,
    Frame,
    Preview,
    Prompt,
    RequestExample,
    ResponseExample,
    SidePanel,
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
    Tooltip,
    Tree,
    FileTree,
    Space,
    Visibility,
    View,
    GitHubCard,
    ...components,
  };
}
`;
