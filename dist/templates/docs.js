export const docsTemplate = `"use client";
import { useState } from "react";
import { Flex } from "cherry-styled-components/src/lib";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Code } from "@/app/components/layout/Code";
import { 
  DocsContainer,
  StyledMarkdownContainer,
} from "@/app/components/layout/DocsComponents";
  
function Docs({content, result}) {
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
