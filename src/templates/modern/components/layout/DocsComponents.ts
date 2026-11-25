import { deriveTemplate } from "../../../../lib/derive-template.js";
import { docsComponentsTemplate } from "../../../components/layout/DocsComponents.js";

// The classic DocsComponents.tsx with the modern design's edits.
export const modernDocsComponentsTemplate = deriveTemplate(
  "modern components/layout/DocsComponents.tsx",
  docsComponentsTemplate,
  [
    [
      `"use client";
import React, { createContext } from "react";
import { useChat } from "cherry-styled-components";
import {`,
      `"use client";
import React, { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "cherry-styled-components";
import {`,
    ],
    [
      `import { useVariant } from "@/components/useVariant";
import { joinVariantSlug } from "@/utils/variants";

const SectionBarContext = createContext(false);`,
      `import { useVariant } from "@/components/useVariant";
import { joinVariantSlug } from "@/utils/variants";
import type { PagesProps } from "@/utils/orderNavItems";

const SectionBarContext = createContext(false);`,
    ],
    [
      `}

interface DocsWrapperProps {
  children: React.ReactNode;
}

function DocsWrapper({ children }: DocsWrapperProps) {
  return <StyledDocsWrapper>{children}</StyledDocsWrapper>;
}
`,
      `}

// Every page of the site, for chrome that describes the current page (the
// page header shows its category).
const PagesContext = createContext<PagesProps[]>([]);

/** The current page's entry, matched by URL, or undefined off the list. */
function useCurrentPage(): PagesProps | undefined {
  const pages = useContext(PagesContext);
  const pathname = usePathname();
  const path = pathname.length > 1 ? pathname.replace(/\\/$/, "") : pathname;
  return pages.find((page) => "/" + page.slug === path);
}

interface DocsWrapperProps {
  children: React.ReactNode;
  pages?: PagesProps[];
}

function DocsWrapper({ children, pages = [] }: DocsWrapperProps) {
  return (
    <PagesContext.Provider value={pages}>
      <StyledDocsWrapper>{children}</StyledDocsWrapper>
    </PagesContext.Provider>
  );
}
`,
    ],
    [
      `  SectionBarContext,
  SectionBarProvider,
};`,
      `  SectionBarContext,
  SectionBarProvider,
  useCurrentPage,
};`,
    ],
  ],
);
