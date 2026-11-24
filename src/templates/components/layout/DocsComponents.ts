export const docsComponentsTemplate = `"use client";
import React, { createContext } from "react";
import { useChat } from "cherry-styled-components";
import {
  StyledDocsContainer,
  StyledDocsSidebar,
  StyledDocsWrapper,
  StyledLlmsDirective,
} from "@/components/layout/DocsComponents.styles";
import { useVariant } from "@/components/useVariant";
import { joinVariantSlug } from "@/utils/variants";

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
  return (
    <StyledLlmsDirective data-markdown-ignore>
      <a href={indexHref}>Documentation index for AI agents (llms.txt)</a>.
      Markdown versions of every page are available by appending .md to the page
      URL. The full corpus is at <a href={fullHref}>{fullHref}</a>.
    </StyledLlmsDirective>
  );
}

interface DocsWrapperProps {
  children: React.ReactNode;
}

function DocsWrapper({ children }: DocsWrapperProps) {
  return <StyledDocsWrapper>{children}</StyledDocsWrapper>;
}

function DocsSidebar({ children }: DocsProps) {
  return <StyledDocsSidebar>{children}</StyledDocsSidebar>;
}

function DocsContainer({ children, lang }: DocsProps & { lang?: string }) {
  const { isOpen } = useChat();

  return (
    <StyledDocsContainer $isChatOpen={isOpen} lang={lang}>
      {children}
    </StyledDocsContainer>
  );
}

export {
  DocsWrapper,
  DocsSidebar,
  DocsContainer,
  LlmsDirective,
  SectionBarContext,
  SectionBarProvider,
};
`;
