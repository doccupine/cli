export const docsTemplate = `"use client";
import { useEffect, useState } from "react";
import { Flex, Space } from "cherry-styled-components/src/lib";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Code } from "@/components/layout/Code";
import { 
  DocsContainer,
  StyledMarkdownContainer,
  StyledIndexSidebar,
} from "@/components/layout/DocsComponents";
import { StyledText } from "@/components/layout/Typography";

interface DocsProps {
  content: string;
}


interface Heading {
  id: string;
  text: string;
  level: number;
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\\w\\s-]/g, "")
    .replace(/\\s+/g, "-")
    .trim();
}

function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{1,6})\\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = generateId(text);
    headings.push({ id, text, level });
  }

  return headings;
}
  
function Docs({ content }: DocsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    if (content) {
      const extractedHeadings = extractHeadings(content);
      setHeadings(extractedHeadings);
    }
  }, [content]);

  return (
    <>
      <DocsContainer>
        <Flex $gap={20}>
          <StyledMarkdownContainer>
          {content && (
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { children, className, node, ...rest } = props;
                  const match = /language-(\\w+)/.exec(className || "");
                  return match ? (
                  <Code
                      {...rest}
                      className={className}
                      code={String(children).replace(/\\n\$/, "")}
                      language={match[1]}
                    />
                  ) : (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  );
                },
                h1: ({ children, ...props }) => {
                  const id = generateId(String(children));
                  return (
                    <h1 id={id} {...props}>
                      {children}
                    </h1>
                  );
                },
                h2: ({ children, ...props }) => {
                  const id = generateId(String(children));
                  return (
                    <h2 id={id} {...props}>
                      {children}
                    </h2>
                  );
                },
                h3: ({ children, ...props }) => {
                  const id = generateId(String(children));
                  return (
                    <h3 id={id} {...props}>
                      {children}
                    </h3>
                  );
                },
                h4: ({ children, ...props }) => {
                  const id = generateId(String(children));
                  return (
                    <h4 id={id} {...props}>
                      {children}
                    </h4>
                  );
                },
                h5: ({ children, ...props }) => {
                  const id = generateId(String(children));
                  return (
                    <h5 id={id} {...props}>
                      {children}
                    </h5>
                  );
                },
                h6: ({ children, ...props }) => {
                  const id = generateId(String(children));
                  return (
                    <h6 id={id} {...props}>
                      {children}
                    </h6>
                  );
                },
              }}
            >
              {content}
            </Markdown>
           )}
          </StyledMarkdownContainer>
        </Flex>
      </DocsContainer>
      <StyledIndexSidebar>
        {headings?.length > 0 && (
          <>
            <StyledText>On this page</StyledText>
            <Space $size={20} />
          </>
        )}
        {headings.map((heading, index) => (
          <li
            key={index}
            style={
              {
                // paddingLeft: \`\${(heading.level - 1) * 16}px\`,
              }
            }
          >
            <a href={\`#\${heading.id}\`}>{heading.text}</a>
          </li>
        ))}
      </StyledIndexSidebar>
    </>
  );
}

export { Docs };
`;
