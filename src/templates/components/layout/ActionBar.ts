export const actionBarTemplate = `"use client";
import { useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { useStrings } from "@/components/useStrings";
import { Icon } from "@/components/layout/Icon";
import { Textarea } from "cherry-styled-components";
import { SectionBarContext } from "@/components/layout/DocsComponents";
import {
  StyledActionBar,
  StyledActionBarContent,
  StyledCopyButton,
  StyledActionBarGroup,
  StyledActionLabel,
  StyledRssLink,
  StyledMarkdownLink,
  StyledToggle,
  StyledContent,
} from "@/components/layout/ActionBar.styles";

interface ActionBarProps {
  children: React.ReactNode;
  content: string;
  // When set, an RSS button linking to this page's feed renders next to the
  // copy pill.
  rssHref?: string;
}

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
      <StyledActionBar data-markdown-ignore data-rss={rssHref ? "" : undefined}>
        <StyledActionBarGroup>
          <StyledCopyButton onClick={handleCopyContent} $copied={copied}>
            {copied ? (
              <>
                <Icon name="check" size={16} />
                <StyledActionLabel>{t.copied}</StyledActionLabel>
              </>
            ) : (
              <>
                <Icon name="copy" size={16} />
                <StyledActionLabel>{t.copyContent}</StyledActionLabel>
              </>
            )}
          </StyledCopyButton>
          {rssHref && (
            <StyledRssLink as="a" href={rssHref} aria-label={t.rssFeed}>
              <Icon name="rss" size={16} />
              <StyledActionLabel>{t.rss}</StyledActionLabel>
            </StyledRssLink>
          )}
        </StyledActionBarGroup>
        <StyledActionBarContent>
          <StyledMarkdownLink
            href={toMarkdownHref(pathname)}
            aria-label={t.viewAsMarkdown}
            title={t.viewAsMarkdown}
          >
            <Icon name="FileText" />
          </StyledMarkdownLink>
          <StyledToggle
            onClick={() => setIsView(!isView)}
            aria-label={t.toggleView}
            $isActive={isView}
          >
            <Icon name="Eye" />
            <Icon name="CodeXml" />
          </StyledToggle>
        </StyledActionBarContent>
      </StyledActionBar>
      {isView && (
        <StyledContent $hasSectionBar={hasSectionBar}>{children}</StyledContent>
      )}
      {!isView && (
        <StyledContent $hasSectionBar={hasSectionBar} $raw>
          <Textarea defaultValue={content} $fullWidth />
        </StyledContent>
      )}
    </>
  );
}

export { ActionBar };
`;
