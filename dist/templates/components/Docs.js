export const docsTemplate = `"use client";
import { useEffect, useState, useCallback } from "react";
import { Flex, Space } from "cherry-styled-components/src/lib";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Code } from "@/components/layout/Code";
import { 
  DocsContainer,
  StyledMarkdownContainer,
  StyledIndexSidebar,
  StyledIndexSidebarLink,
  StyledIndexSidebarLabel,
} from "@/components/layout/DocsComponents";

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

function useActiveHeading(headings: Heading[]): string {
  const [activeId, setActiveId] = useState<string>("");

  const handleScroll = useCallback(() => {
    if (headings.length === 0) return;

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean);

    if (headingElements.length === 0) return;

    const windowHeight = window.innerHeight;

    const visibleHeadings = headingElements.filter((element) => {
      if (!element) return false;

      const rect = element.getBoundingClientRect();
      const elementTop = rect.top;
      const elementBottom = rect.bottom;

      return elementTop < windowHeight && elementBottom > -50;
    });

    if (visibleHeadings.length > 0) {
      let closestHeading = visibleHeadings[0];
      let closestDistance = Math.abs(
        closestHeading!.getBoundingClientRect().top,
      );

      for (const heading of visibleHeadings) {
        if (!heading) continue;
        const distance = Math.abs(heading.getBoundingClientRect().top);
        if (
          distance < closestDistance &&
          heading.getBoundingClientRect().top <= windowHeight * 0.3
        ) {
          closestDistance = distance;
          closestHeading = heading;
        }
      }

      setActiveId(closestHeading!.id);
      return;
    }

    let currentActiveId = headings[0].id;

    for (const element of headingElements) {
      if (!element) continue;

      const rect = element.getBoundingClientRect();
      if (rect.top <= 0) {
        currentActiveId = element.id;
      } else {
        break;
      }
    }

    setActiveId(currentActiveId);
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;

    handleScroll();

    let timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 50);
    };

    window.addEventListener("scroll", throttledHandleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
      window.removeEventListener("resize", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll, headings]);

  return activeId;
}
  
function Docs({ content }: DocsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const activeHeadingId = useActiveHeading(headings);

  useEffect(() => {
    if (content) {
      const extractedHeadings = extractHeadings(content);
      setHeadings(extractedHeadings);
    }
  }, [content]);

  const handleHeadingClick = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

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
            <StyledIndexSidebarLabel>On this page</StyledIndexSidebarLabel>
            <Space $size={20} />
          </>
        )}
        {headings.map((heading, index) => (
          <li
            key={index}
            style={{
              paddingLeft: \`\${(heading.level - 1) * 16}px\`,
            }}
          >
            <StyledIndexSidebarLink
              href={\`#\${heading.id}\`}
              onClick={(e) => {
                e.preventDefault();
                handleHeadingClick(heading.id);
              }}
              $isActive={activeHeadingId === heading.id}
            >
              {heading.text}
            </StyledIndexSidebarLink>
          </li>
        ))}
      </StyledIndexSidebar>
    </>
  );
}

export { Docs };
`;
