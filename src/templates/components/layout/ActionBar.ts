export const actionBarTemplate = `"use client";
import { useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { useStrings } from "@/components/useStrings";
import { Icon } from "@/components/layout/Icon";
import { SectionBarContext } from "@/components/layout/DocsComponents";

interface ActionBarProps {
  children: React.ReactNode;
  content: string;
  // When set, an RSS button linking to this page's feed renders next to the
  // copy pill.
  rssHref?: string;
}

// Styles: app/styles (.dcp-action-bar). The modern design draws the buttons
// with the shared pill classes; the classic design does not style those.

// Every page ships a static markdown mirror under public/: "/" serves
// "/index.md" and "/{slug}" serves "/{slug}.md".
function toMarkdownHref(pathname: string) {
  const base = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return \`\${base === "" ? "/index" : base}.md\`;
}

function ActionBar({ children, content, rssHref }: ActionBarProps) {
  const [isView, setIsView] = useState(true);
  const [copied, setCopied] = useState(false);
  const hasSectionBar = useContext(SectionBarContext);
  const pathname = usePathname();
  const t = useStrings();

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      <div
        className="dcp-action-bar"
        data-markdown-ignore
        data-rss={rssHref ? "" : undefined}
      >
        <div className="dcp-action-bar__group">
          <button
            type="button"
            className="dcp-action-button dcp-pill dcp-action-bar__copy"
            onClick={handleCopyContent}
            data-copied={copied || undefined}
          >
            {copied ? (
              <>
                <Icon name="check" size={16} />
                <span className="dcp-action-bar__label">{t.copied}</span>
              </>
            ) : (
              <>
                <Icon name="copy" size={16} />
                <span className="dcp-action-bar__label">{t.copyContent}</span>
              </>
            )}
          </button>
          {rssHref && (
            <a
              className="dcp-action-button dcp-pill dcp-action-bar__rss"
              href={rssHref}
              aria-label={t.rssFeed}
            >
              <Icon name="rss" size={16} />
              <span className="dcp-action-bar__label">{t.rss}</span>
            </a>
          )}
        </div>
        <div className="dcp-action-bar__actions">
          <a
            className="dcp-reset-button dcp-pill dcp-pill-round dcp-action-bar__markdown"
            href={toMarkdownHref(pathname)}
            aria-label={t.viewAsMarkdown}
            title={t.viewAsMarkdown}
          >
            <Icon name="FileText" />
          </a>
          <button
            type="button"
            className="dcp-reset-button dcp-pill dcp-pill-switch dcp-action-bar__toggle"
            onClick={() => setIsView(!isView)}
            aria-label={t.toggleView}
            data-knob={isView ? undefined : "end"}
          >
            <Icon name="Eye" />
            <Icon name="CodeXml" />
          </button>
        </div>
      </div>
      {isView && (
        <div
          className="dcp-action-bar__content"
          data-section-bar={hasSectionBar || undefined}
        >
          {children}
        </div>
      )}
      {!isView && (
        <div
          className="dcp-action-bar__content"
          data-section-bar={hasSectionBar || undefined}
          data-raw
        >
          <span className="dcp-raw-source">
            <textarea
              className="dcp-raw-source__textarea"
              defaultValue={content}
            />
          </span>
        </div>
      )}
    </>
  );
}

export { ActionBar };
`;
