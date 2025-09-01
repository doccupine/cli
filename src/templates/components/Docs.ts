export const docsTemplate = `"use client";
import { Flex } from "cherry-styled-components/src/lib";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Code } from "@/components/layout/Code";
import { 
  DocsContainer,
  StyledMarkdownContainer,
} from "@/components/layout/DocsComponents";

interface DocsProps {
  content: string;
}
  
function Docs({ content }: DocsProps) {
  return (
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
            }}
          >
            {content}
          </Markdown>
         )}
        </StyledMarkdownContainer>
      </Flex>
    </DocsContainer>
  );
}

export { Docs };
`;
