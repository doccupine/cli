export const codeTemplate = `"use client";
import { useState, useCallback, useMemo, useId } from "react";
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
  title?: string;
  theme?: Theme;
}

interface CodeTab {
  label: string;
  code: string;
  language?: string;
}

interface CodeTabsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "theme"
> {
  tabs: CodeTab[];
  theme?: Theme;
}

const CodeWrapper = styled.span<{ theme: Theme }>\`
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  background: \${({ theme }) => theme.colors.light};
\`;

/* Code block uses a fixed GitHub-style palette for the syntax tokens in both
   modes so highlighting stays legible regardless of brand colors. The dark-mode
   surface, however, matches the left sidebar's translucent brand tint
   (color-mix of theme.colors.primaryLight over the black page) instead of
   GitHub's #0d1117, so the window sits on the same background as the nav. Dark
   variants live in :root.dark & blocks so the swap happens via the active
   <html> class with no re-render. */
const TopBar = styled.div<{ theme: Theme }>\`
  position: relative;
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 5%, transparent)\`};
  border-top-left-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-top-right-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
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
  background: rgba(0, 0, 0, 0.1);

  :root.dark & {
    background: rgba(255, 255, 255, 0.1);
  }
\`;

/* Icon-only copy button. interactiveStyles supplies the border highlight on
   hover plus the focus/active rings (no scale effect). Colors come from theme
   tokens (grayLight border, success/grayDark icon) that swap for dark mode via
   the theme prop, so no :root.dark & override is needed and the copied state
   reads consistently in both modes. */
const CopyButton = styled.button<{ theme: Theme; $copied: boolean }>\`
  \${resetButton}
  \${interactiveStyles}
  background: \${({ theme }) => theme.colors.light};
  border-color: \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -6px;

  & svg.lucide {
    margin: 0;
    color: \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.grayDark};
  }
\`;

/* Centered file name in the TopBar. Sits absolutely over the flex row so the
   dots and copy button keep their edge alignment. Monospace + a muted grayDark
   token that swaps for dark mode via the theme prop. pointer-events off so
   clicks fall through to nothing and never steal focus from the buttons. */
const TopBarTitle = styled.span<{ theme: Theme }>\`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  font-family: \${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  line-height: 2;
  color: \${({ theme }) => theme.colors.grayDark};
\`;

/* Segmented control living in the TopBar for CodeTabs. Scrolls horizontally
   with the thin scrollbar when the labels overflow the 33px bar. */
const TabList = styled.div<{ theme: Theme }>\`
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
  \${thinScrollbar};
  margin-left: -6px;
\`;

/* Individual tab button. The active tab reads as part of the window: a
   theme.colors.light fill that echoes the code body, with a soft grayLight
   border. Inactive tabs are muted (grayDark) and transparent. resetButton
   strips native styling; focus-visible draws an inset brand primary ring on a
   pseudo-element so the scrolling TabList can't clip it. Colors come from theme
   tokens that swap for dark mode via the theme prop, so no :root.dark &
   override is needed. */
const CodeTab = styled.button<{ theme: Theme; $active: boolean }>\`
  \${resetButton}
  flex: 0 0 auto;
  position: relative;
  font-family: \${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  line-height: 1;
  padding: 5px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  cursor: pointer;
  white-space: nowrap;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
  border: solid 1px
    \${({ theme, $active }) =>
      $active ? theme.colors.grayLight : "transparent"};
  background: \${({ theme, $active }) =>
    $active ? theme.colors.light : "transparent"};
  color: \${({ theme, $active }) =>
    $active ? theme.colors.dark : theme.colors.grayDark};

  &:hover {
    color: \${({ theme }) => theme.colors.dark};
    background: \${({ theme, $active }) =>
      $active
        ? theme.colors.light
        : \`color-mix(in srgb, \${theme.colors.dark} 4%, transparent)\`};
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    content: "";
    position: absolute;
    inset: 2px;
    border: solid 2px \${({ theme }) => theme.colors.primary};
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    pointer-events: none;
  }
\`;

/* GitHub Light syntax highlighting by default; GitHub Dark in :root.dark.
   Browser resolves which rule wins based on the active <html> class with no
   JS or React re-render involved. */
const lightSyntaxHighlight = css\`
  & .hljs {
    color: #24292f;
    background: #ffffff;
    min-width: min-content;
    width: 100%;
    display: block;
    padding-right: 20px;
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
    background: transparent;
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

  /* Diff lines: highlight.js wraps each +/- line in a single span, so
     stretching it to the full row reads like a GitHub diff. inline-block keeps
     the trailing newline as the line break instead of adding an empty row. */
  & .hljs-addition,
  & .hljs-deletion {
    display: inline-table;
    width: 100%;
  }

  :root.dark & {
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 5%, transparent)\`};
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

function Code({
  code,
  language = "javascript",
  title,
  theme,
  className,
}: CodeProps) {
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
        {title ? <TopBarTitle theme={theme}>{title}</TopBarTitle> : null}
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

/* Multi-variant code block (npm / pnpm / yarn, etc). Tabs replace the macOS
   dots in the TopBar as a keyboard-accessible tablist; the copy button copies
   whichever tab is active and resets its copied state when the tab changes. */
function CodeTabs({ tabs, theme, className }: CodeTabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const safeActive = active < tabs.length ? active : 0;
  const activeTab = tabs[safeActive];

  const highlightedCode = useMemo(
    () =>
      activeTab
        ? highlightCode(activeTab.code, activeTab.language ?? "bash")
        : "",
    [activeTab],
  );

  const handleSelect = useCallback((index: number) => {
    setActive(index);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!activeTab) return;
    try {
      await navigator.clipboard.writeText(activeTab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, [activeTab]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      let next = safeActive;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        next = (safeActive + 1) % tabs.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = (safeActive - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = tabs.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      handleSelect(next);
      const target = document.getElementById(\`\${baseId}-tab-\${next}\`);
      if (target) target.focus();
    },
    [baseId, handleSelect, safeActive, tabs.length],
  );

  if (!tabs || tabs.length === 0) return null;

  return (
    <CodeWrapper
      className={\`\${className ?? ""} code-wrapper\`.trim()}
      theme={theme}
    >
      <TopBar theme={theme}>
        <TabList role="tablist" aria-label="Code variants">
          {tabs.map((tab, index) => (
            <CodeTab
              key={\`\${tab.label}-\${index}\`}
              type="button"
              role="tab"
              id={\`\${baseId}-tab-\${index}\`}
              aria-selected={index === safeActive}
              aria-controls={\`\${baseId}-panel\`}
              tabIndex={index === safeActive ? 0 : -1}
              onClick={() => handleSelect(index)}
              onKeyDown={handleKeyDown}
              $active={index === safeActive}
              theme={theme}
            >
              {tab.label}
            </CodeTab>
          ))}
        </TabList>
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
        id={\`\${baseId}-panel\`}
        role="tabpanel"
        aria-labelledby={\`\${baseId}-tab-\${safeActive}\`}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
        theme={theme}
        className="code-wrapper-body"
      />
    </CodeWrapper>
  );
}

export { Code, CodeTabs };
`;
