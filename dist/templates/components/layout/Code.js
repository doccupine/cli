export const codeTemplate = `"use client";
"use client";
import styled from "styled-components";
import { Theme, styledCode } from "cherry-styled-components/src/lib";
import { rgba } from "polished";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { editableContent } from "@/components/layout/SharedStyled";

interface CodeProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  theme?: Theme;
}

const CodeWrapper = styled.span<{ theme: Theme }>\`
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  border: solid 1px
    \${({ theme }) =>
      theme.isDark ? rgba(theme.colors.dark, 0.2) : rgba(theme.colors.dark, 0)};
\`;

const TopBar = styled.div<{ theme: Theme }>\`
  background: #0d1117;
  border-top-left-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-top-right-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom: solid 1px \${rgba("#ffffff", 0.1)};
  height: 33px;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  gap: 5px;
  padding: 10px;
\`;

const Dot = styled.span<{ theme: Theme }>\`
  margin: auto 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: \${rgba("#ffffff", 0.1)};
\`;

const Body = styled.div<{ theme: Theme }>\`
  background: #0d1117;
  border-bottom-left-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom-right-radius: \${({ theme }) => theme.spacing.radius.lg};
  color: #ffffff;
  padding: 20px;
  font-family: \${({ theme }) => theme.fonts.mono};
  text-align: left;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100svh - 400px);
  \${({ theme }) => styledCode(theme)};

  &[contenteditable="true"] {
    \${editableContent};
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  & .hljs {
    color: #c9d1d9;
    background: #0d1117;
  }

  & .hljs-doctag,
  & .hljs-keyword,
  & .hljs-meta .hljs-keyword,
  & .hljs-template-tag,
  & .hljs-template-variable,
  & .hljs-type,
  & .hljs-variable.language_ {
    color: #ff7b72;
  }

  & .hljs-title,
  & .hljs-title.class_,
  & .hljs-title.class_.inherited__,
  & .hljs-title.function_ {
    color: #d2a8ff;
  }

  & .hljs-attr,
  & .hljs-attribute,
  & .hljs-literal,
  & .hljs-meta,
  & .hljs-number,
  & .hljs-operator,
  & .hljs-selector-attr,
  & .hljs-selector-class,
  & .hljs-selector-id,
  & .hljs-variable {
    color: #79c0ff;
  }

  & .hljs-meta .hljs-string,
  & .hljs-regexp,
  & .hljs-string {
    color: #a5d6ff;
  }

  & .hljs-built_in,
  & .hljs-symbol {
    color: #ffa657;
  }

  & .hljs-code,
  & .hljs-comment,
  & .hljs-formula {
    color: #8b949e;
  }

  & .hljs-name,
  & .hljs-quote,
  & .hljs-selector-pseudo,
  & .hljs-selector-tag {
    color: #7ee787;
  }

  & .hljs-subst {
    color: #c9d1d9;
  }

  & .hljs-section {
    color: #1f6feb;
    font-weight: 700;
  }

  & .hljs-bullet {
    color: #f2cc60;
  }

  & .hljs-emphasis {
    color: #c9d1d9;
    font-style: italic;
  }

  & .hljs-strong {
    color: #c9d1d9;
    font-weight: 700;
  }

  & .hljs-addition {
    color: #aff5b4;
    background-color: #033a16;
  }

  & .hljs-deletion {
    color: #ffdcd7;
    background-color: #67060c;
  }
\`;

const highlightCode = (code: string, language: string): string => {
  const result = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
    })
    .use(rehypeStringify)
    .processSync(
      \`<pre><code class="language-\${language}">\${code}</code></pre>\`,
    );

  return String(result);
};

function Code({ code, language = "javascript", ...props }: CodeProps) {
  const highlightedCode = highlightCode(code, language);
  return (
    <CodeWrapper>
      <TopBar>
        <Dot />
        <Dot />
        <Dot />
      </TopBar>
      <Body dangerouslySetInnerHTML={{ __html: highlightedCode }} {...props} language={language} />
    </CodeWrapper>
  );
}

export { Code };
`;
