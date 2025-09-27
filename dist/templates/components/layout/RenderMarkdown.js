export const renderMarkdownTemplate = `import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Code } from "@/components/layout/Code";
import { Card, CardProps } from "@/components/layout/Card";
import { Accordion, AccordionProps } from "@/components/layout/Accordion";
import {
  Tabs,
  TabsProps,
  TabContent,
  TabContentProps,
} from "@/components/layout/Tabs";
import { Callout, CalloutProps } from "@/components/layout/Callout";
import { StyledMarkdownContainer } from "@/components/layout/DocsComponents";

const defaultComponents = {
  Card: ({ title, icon, children }: CardProps) => (
    <Card title={title} icon={icon}>
      {children}
    </Card>
  ),
  Accordion: ({ title, children }: AccordionProps) => (
    <Accordion title={title}>{children}</Accordion>
  ),
  Tabs: ({ children }: TabsProps) => <Tabs>{children}</Tabs>,
  TabContent: ({ children, title }: TabContentProps) => (
    <TabContent title={title}>{children}</TabContent>
  ),
  Callout: ({ children, type }: CalloutProps) => (
    <Callout type={type}>{children}</Callout>
  ),
};

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

function RenderMarkdown({ children }: { children: React.ReactNode }) {
  const childrenAsString = extractAllTextFromChildren(children);
  console.log(childrenAsString);

  return (
    <StyledMarkdownContainer>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\\w+)/.exec(className || "");
            return match ? (
              <Code
                {...rest}
                className={className}
                code={String(children).replace(/\\n$/, "")}
                language={match[1]}
              />
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
          ...Object.fromEntries(
            Object.entries(defaultComponents).map(([name, Component]) => [
              name.toLowerCase(),
              Component,
            ]),
          ),
        }}
      >
        {childrenAsString}
      </Markdown>
    </StyledMarkdownContainer>
  );
}

export { RenderMarkdown };
`;
