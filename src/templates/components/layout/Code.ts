export const codeTemplate = `"use client";
import { useState, useCallback, useMemo } from "react";
import styled, { css } from "styled-components";
import {
  interactiveStyles,
  resetButton,
  styledCode,
} from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { Icon } from "@/components/layout/Icon";
import { thinScrollbar } from "@/components/layout/SharedStyled";

interface CodeProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "theme"
> {
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
  border: solid 1px rgba(0, 0, 0, 0.1);

  :root.dark & {
    border-color: rgba(255, 255, 255, 0.2);
  }
\`;

/* Code block uses a fixed GitHub-style palette in both modes. Independent of
   theme.json so syntax highlighting stays legible regardless of brand colors.
   Dark variants live in :root.dark & blocks so the swap happens via the
   active <html> class with no re-render. */
const TopBar = styled.div<{ theme: Theme }>\`
  background: #f6f8fa;
  border-top-left-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-top-right-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom: solid 1px rgba(0, 0, 0, 0.1);
  height: 33px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  padding: 0 10px;

  :root.dark & {
    background: #0d1117;
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
\`;

const DotsContainer = styled.div\`
  display: flex;
  gap: 5px;
\`;

const Dot = styled.span<{ theme: Theme }>\`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);

  :root.dark & {
    background: rgba(255, 255, 255, 0.1);
  }
\`;

/* Icon-only copy button. interactiveStyles supplies the border highlight on
   hover plus the focus/active rings (no scale effect); the GitHub-style
   copied/base colors stay fixed like the rest of the code block. The dark
   block re-declares the hover border because its higher-specificity
   :root.dark & border-color would otherwise override the mixin's hover. */
const CopyButton = styled.button<{ theme: Theme; $copied: boolean }>\`
  \${resetButton}
  \${interactiveStyles}
  background: \${({ $copied }) =>
    $copied ? "rgba(45, 164, 78, 0.1)" : "transparent"};
  border-color: \${({ $copied }) => ($copied ? "#2da44e" : "rgba(0, 0, 0, 0.1)")};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -6px;

  & svg.lucide {
    color: \${({ $copied }) => ($copied ? "#2da44e" : "#57606a")};
  }

  :root.dark & {
    background: \${({ $copied }) =>
      $copied ? "rgba(126, 231, 135, 0.2)" : "transparent"};
    border-color: \${({ $copied }) =>
      $copied ? "#7ee787" : "rgba(255, 255, 255, 0.1)"};

    & svg.lucide {
      color: \${({ $copied }) => ($copied ? "#7ee787" : "#c9d1d9")};
    }

    &:hover {
      border-color: \${({ theme }) => theme.colors.primary};
    }
  }
\`;

/* GitHub Light syntax highlighting by default; GitHub Dark in :root.dark.
   Browser resolves which rule wins based on the active <html> class with no
   JS or React re-render involved. */
const lightSyntaxHighlight = css\`
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
\`;

const darkSyntaxHighlight = css\`
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

const Body = styled.div<{ theme: Theme }>\`
  background: #ffffff;
  border-bottom-left-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom-right-radius: \${({ theme }) => theme.spacing.radius.lg};
  color: #24292f;
  padding: 20px;
  font-family: \${({ theme }) => theme.fonts.mono};
  text-align: left;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100dvh - 400px);
  \${thinScrollbar};
  \${({ theme }) => styledCode(theme)};
  \${lightSyntaxHighlight};

  :root.dark & {
    background: #0d1117;
    color: #ffffff;
    \${darkSyntaxHighlight};
  }
\`;

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const sanitizeLanguage = (lang: string): string =>
  lang.replace(/[^a-zA-Z0-9_-]/g, "");

const highlightCode = (code: string, language: string): string => {
  const escapedCode = escapeHtml(code);
  const safeLang = sanitizeLanguage(language);
  const result = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeHighlight, {
      detect: true,
      ignoreMissing: true,
    })
    .use(rehypeStringify)
    .processSync(
      \`<pre><code class="language-\${safeLang}">\${escapedCode}</code></pre>\`,
    );

  return String(result);
};

function Code({ code, language = "javascript", theme, className }: CodeProps) {
  const [copied, setCopied] = useState(false);
  const highlightedCode = useMemo(
    () => highlightCode(code, language),
    [code, language],
  );

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
    <CodeWrapper
      className={\`\${className ?? ""} code-wrapper\`.trim()}
      theme={theme}
    >
      <TopBar theme={theme}>
        <DotsContainer>
          <Dot theme={theme} />
          <Dot theme={theme} />
          <Dot theme={theme} />
        </DotsContainer>
        <CopyButton
          onClick={handleCopy}
          $copied={copied}
          theme={theme}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          <Icon name={copied ? "check" : "copy"} size={12} />
        </CopyButton>
      </TopBar>
      <Body
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
        theme={theme}
        className="code-wrapper-body"
      />
    </CodeWrapper>
  );
}

export { Code };
`;
