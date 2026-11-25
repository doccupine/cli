export const codeTemplate = `"use client";
import { useState, useCallback, useMemo, useId } from "react";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { Icon } from "@/components/layout/Icon";
import { useStrings } from "@/components/useStrings";
import { useChoice } from "@/components/useChoice";

// Styles: app/styles/design.css (.dcp-code, see src/templates/styles/code.ts
// in the CLI).

interface CodeProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  title?: string;
}

interface CodeTab {
  label: string;
  code: string;
  language?: string;
}

interface CodeTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: CodeTab[];
  /**
   * Remember the picked tab by its label under this key, and follow picks
   * made in every other block with the same key (useChoice). <Install>
   * uses it so every install command shows the reader's package manager.
   */
  syncKey?: string;
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
    // tabindex: a long line scrolls the block sideways, and keyboard users
    // need to reach it to scroll it.
    .processSync(
      \`<pre tabindex="0"><code class="language-\${safeLang}">\${escapedCode}</code></pre>\`,
    );

  return String(result);
};

function Code({ code, language = "javascript", title, className }: CodeProps) {
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
    <span className={\`\${className ?? ""} dcp-code code-wrapper\`.trim()}>
      <div className="dcp-code__bar">
        <div className="dcp-code__dots">
          <span className="dcp-code__dot" />
          <span className="dcp-code__dot" />
          <span className="dcp-code__dot" />
        </div>
        {title ? <span className="dcp-code__title">{title}</span> : null}
        <button
          className="dcp-code__copy"
          onClick={handleCopy}
          data-copied={copied || undefined}
          aria-label={copied ? t.copied : t.copyCode}
        >
          <Icon name={copied ? "check" : "copy"} size={12} />
        </button>
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
        className="dcp-code__body code-wrapper-body"
      />
    </span>
  );
}

/* Multi-variant code block (npm / pnpm / yarn, etc). Tabs replace the macOS
   dots in the TopBar as a keyboard-accessible tablist; the copy button copies
   whichever tab is active and resets its copied state when the tab changes. */
function CodeTabs({ tabs, className, syncKey }: CodeTabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const t = useStrings();
  // Without a syncKey the choice store is read under an empty key nothing
  // ever writes, so it stays null and the local state decides.
  const [chosen, setChosen] = useChoice(syncKey ?? "");
  const chosenIndex = syncKey
    ? tabs.findIndex((tab) => tab.label === chosen)
    : -1;

  const current = chosenIndex >= 0 ? chosenIndex : active;
  const safeActive = current < tabs.length ? current : 0;
  const activeTab = tabs[safeActive];

  const highlightedCode = useMemo(
    () =>
      activeTab
        ? highlightCode(activeTab.code, activeTab.language ?? "bash")
        : "",
    [activeTab],
  );

  const handleSelect = useCallback(
    (index: number) => {
      setActive(index);
      setCopied(false);
      if (syncKey && tabs[index]) setChosen(tabs[index].label);
    },
    [setChosen, syncKey, tabs],
  );

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
    <span className={\`\${className ?? ""} dcp-code code-wrapper\`.trim()}>
      <div className="dcp-code__bar">
        <div
          className="dcp-code__tabs"
          role="tablist"
          aria-label={t.codeVariants}
        >
          {tabs.map((tab, index) => (
            <button
              className="dcp-code__tab"
              key={\`\${tab.label}-\${index}\`}
              type="button"
              role="tab"
              id={\`\${baseId}-tab-\${index}\`}
              aria-selected={index === safeActive}
              aria-controls={\`\${baseId}-panel\`}
              tabIndex={index === safeActive ? 0 : -1}
              onClick={() => handleSelect(index)}
              onKeyDown={handleKeyDown}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          className="dcp-code__copy"
          onClick={handleCopy}
          data-copied={copied || undefined}
          aria-label={copied ? t.copied : t.copyCode}
        >
          <Icon name={copied ? "check" : "copy"} size={12} />
        </button>
      </div>
      <div
        id={\`\${baseId}-panel\`}
        role="tabpanel"
        aria-labelledby={\`\${baseId}-tab-\${safeActive}\`}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
        className="dcp-code__body code-wrapper-body"
      />
    </span>
  );
}

export { Code, CodeTabs };
`;
