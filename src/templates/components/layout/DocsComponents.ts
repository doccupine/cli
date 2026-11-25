export const docsComponentsTemplate = `"use client";
import React, { createContext } from "react";
import { useChat } from "@/components/chat/ChatProvider";
import { useVariant } from "@/components/useVariant";
import { joinVariantSlug } from "@/utils/variants";
import { useStrings } from "@/components/useStrings";

const SectionBarContext = createContext(false);

function SectionBarProvider({
  hasSectionBar,
  children,
}: {
  hasSectionBar: boolean;
  children: React.ReactNode;
}) {
  return (
    <SectionBarContext.Provider value={hasSectionBar}>
      {children}
    </SectionBarContext.Provider>
  );
}

interface DocsProps {
  children: React.ReactNode;
}

function LlmsDirective() {
  // Every language and version has its own llms.txt under its URL prefix.
  const { prefix } = useVariant();
  const indexHref = "/" + joinVariantSlug(prefix, "llms.txt");
  const fullHref = "/" + joinVariantSlug(prefix, "llms-full.txt");
  // For AI agents reading the HTML, not for people: hidden from assistive
  // tech and out of the tab order, so keyboard users start at the skip link.
  return (
    <div
      className="dcp-visually-hidden"
      data-markdown-ignore
      aria-hidden="true"
    >
      <a href={indexHref} tabIndex={-1}>
        Documentation index for AI agents (llms.txt)
      </a>
      . Markdown versions of every page are available by appending .md to the
      page URL. The full corpus is at{" "}
      <a href={fullHref} tabIndex={-1}>
        {fullHref}
      </a>
      .
    </div>
  );
}

// The first stop for keyboard users: hidden until focused, it jumps past the
// header and the navigation to the article (<main id="content">).
function SkipLink() {
  const t = useStrings();
  return (
    <a className="dcp-skip-link" href="#content">
      {t.skipToContent}
    </a>
  );
}

interface DocsWrapperProps {
  children: React.ReactNode;
}

function DocsWrapper({ children }: DocsWrapperProps) {
  return <div className="dcp-docs-wrapper">{children}</div>;
}

function DocsSidebar({ children }: DocsProps) {
  return <div className="dcp-docs-sidebar">{children}</div>;
}

// The <main> landmark wraps only the article content: the sidebar, footer,
// and nav render outside it so content extractors and assistive tech start at
// the article. Styles: app/styles (.dcp-docs).
function DocsContainer({ children, lang }: DocsProps & { lang?: string }) {
  const { isOpen } = useChat();

  return (
    <main
      className="dcp-docs"
      id="content"
      tabIndex={-1}
      data-chat-open={isOpen || undefined}
      lang={lang}
    >
      {children}
    </main>
  );
}

export {
  DocsWrapper,
  DocsSidebar,
  DocsContainer,
  LlmsDirective,
  SkipLink,
  SectionBarContext,
  SectionBarProvider,
};
`;
