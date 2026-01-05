export const codeTemplate = `"use client";
import { useState, useCallback } from "react";
import styled from "styled-components";
import { Theme, styledCode } from "cherry-styled-components/src/lib";
import { rgba } from "polished";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { editableContent } from "@/components/layout/SharedStyled";
import { Icon } from "@/components/layout/Icon";

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
      theme.isDark
        ? rgba(theme.colors.dark, 0.2)
        : rgba(theme.colors.dark, 0.1)};
\`;

const TopBar = styled.div<{ theme: Theme }>\`
  background: \${({ theme }) => (theme.isDark ? "#0d1117" : "#f6f8fa")};
  border-top-left-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-top-right-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom: solid 1px
    \${({ theme }) =>
      theme.isDark ? rgba("#ffffff", 0.1) : rgba("#000000", 0.1)};
  height: 33px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
\`;

const DotsContainer = styled.div\`
  display: flex;
  gap: 5px;
\`;

const Dot = styled.span<{ theme: Theme }>\`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: \${({ theme }) =>
    theme.isDark ? rgba("#ffffff", 0.1) : rgba("#000000", 0.1)};
\`;

const CopyButton = styled.button<{ theme: Theme; $copied: boolean }>\`
  background: \${({ theme, $copied }) =>
    $copied
      ? theme.isDark
        ? rgba("#7ee787", 0.2)
        : rgba("#2da44e", 0.1)
      : "transparent"};
  border: solid 1px
    \${({ theme, $copied }) =>
      $copied
        ? theme.isDark
          ? "#7ee787"
          : "#2da44e"
        : theme.isDark
          ? rgba("#ffffff", 0.1)
          : rgba("#000000", 0.1)};
  color: \${({ theme, $copied }) =>
    $copied
      ? theme.isDark
        ? "#7ee787"
        : "#2da44e"
      : theme.isDark
        ? "#c9d1d9"
        : "#57606a"};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 4px 8px;
  font-size: 12px;
  font-family: \${({ theme }) => theme.fonts.mono};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: -6px;

  & svg.lucide {
    color: \${({ theme, $copied }) =>
      $copied
        ? theme.isDark
          ? "#7ee787"
          : "#2da44e"
        : theme.isDark
          ? "#c9d1d9"
          : "#57606a"};
  }

  &:hover {
    background: \${({ theme, $copied }) =>
      $copied
        ? theme.isDark
          ? rgba("#7ee787", 0.3)
          : rgba("#2da44e", 0.2)
        : theme.isDark
          ? rgba("#ffffff", 0.1)
          : rgba("#000000", 0.05)};
    border-color: \${({ theme, $copied }) =>
      $copied
        ? theme.isDark
          ? "#7ee787"
          : "#2da44e"
        : theme.isDark
          ? rgba("#ffffff", 0.2)
          : rgba("#000000", 0.2)};
  }

  &:active {
    transform: scale(0.95);
  }
\`;

const Body = styled.div<{ theme: Theme }>\`
  background: \${({ theme }) => (theme.isDark ? "#0d1117" : "#ffffff")};
  border-bottom-left-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom-right-radius: \${({ theme }) => theme.spacing.radius.lg};
  color: \${({ theme }) => (theme.isDark ? "#ffffff" : "#24292f")};
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

  /* Dark mode syntax highlighting (GitHub Dark) */
  \${({ theme }) =>
    theme.isDark &&
    \`
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
  \`}

  /* Light mode syntax highlighting (GitHub Light) */
  \${({ theme }) =>
    !theme.isDark &&
    \`
    & .hljs {
      color: #24292f;
      background: #ffffff;
    }

    & .hljs-doctag,
    & .hljs-keyword,
    & .hljs-meta .hljs-keyword,
    & .hljs-template-tag,
    & .hljs-template-variable,
    & .hljs-type,
    & .hljs-variable.language_ {
      color: #cf222e;
    }

    & .hljs-title,
    & .hljs-title.class_,
    & .hljs-title.class_.inherited__,
    & .hljs-title.function_ {
      color: #8250df;
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
      color: #0550ae;
    }

    & .hljs-meta .hljs-string,
    & .hljs-regexp,
    & .hljs-string {
      color: #0a3069;
    }

    & .hljs-built_in,
    & .hljs-symbol {
      color: #953800;
    }

    & .hljs-code,
    & .hljs-comment,
    & .hljs-formula {
      color: #6e7781;
    }

    & .hljs-name,
    & .hljs-quote,
    & .hljs-selector-pseudo,
    & .hljs-selector-tag {
      color: #116329;
    }

    & .hljs-subst {
      color: #24292f;
    }

    & .hljs-section {
      color: #0550ae;
      font-weight: 700;
    }

    & .hljs-bullet {
      color: #953800;
    }

    & .hljs-emphasis {
      color: #24292f;
      font-style: italic;
    }

    & .hljs-strong {
      color: #24292f;
      font-weight: 700;
    }

    & .hljs-addition {
      color: #116329;
      background-color: #dafbe1;
    }

    & .hljs-deletion {
      color: #82071e;
      background-color: #ffebe9;
    }
  \`}
\`;

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const highlightCode = (code: string, language: string): string => {
  const escapedCode = escapeHtml(code);
  const result = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
    })
    .use(rehypeStringify)
    .processSync(
      \`<pre><code class="language-\${language}">\${escapedCode}</code></pre>\`,
    );

  return String(result);
};

function Code({ code, language = "javascript", ...props }: CodeProps) {
  const [copied, setCopied] = useState(false);
  const highlightedCode = highlightCode(code, language);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, [code]);

  return (
    <CodeWrapper className="code-wrapper">
      <TopBar>
        <DotsContainer>
          <Dot />
          <Dot />
          <Dot />
        </DotsContainer>
        <CopyButton onClick={handleCopy} $copied={copied}>
          {copied ? (
            <>
              <Icon name="check" size={12} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Icon name="copy" size={12} />
              <span>Copy</span>
            </>
          )}
        </CopyButton>
      </TopBar>
      <Body dangerouslySetInnerHTML={{ __html: highlightedCode }} {...props} />
    </CodeWrapper>
  );
}

export { Code };
`;
