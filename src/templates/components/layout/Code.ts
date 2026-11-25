export const codeTemplate = `"use client";
import { useState, useCallback, useMemo, useId } from "react";
import { Theme } from "@/app/theme";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { Icon } from "@/components/layout/Icon";
import { useStrings } from "@/components/useStrings";
import {
  CodeWrapper,
  TopBar,
  DotsContainer,
  Dot,
  CopyButton,
  TopBarTitle,
  TabList,
  CodeTabButton,
  Body,
} from "@/components/layout/Code.styles";

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
  const t = useStrings();
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
          aria-label={copied ? t.copied : t.copyCode}
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
  const t = useStrings();

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
        <TabList role="tablist" aria-label={t.codeVariants}>
          {tabs.map((tab, index) => (
            <CodeTabButton
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
            </CodeTabButton>
          ))}
        </TabList>
        <CopyButton
          onClick={handleCopy}
          $copied={copied}
          theme={theme}
          aria-label={copied ? t.copied : t.copyCode}
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
