import { DEFAULT_DESCRIPTION } from "../../lib/constants.js";

export const sectionNavProviderTemplate = `"use client";
import { useMemo } from "react";
import { SideBar } from "@/components/SideBar";
import { useVariant } from "@/components/useVariant";
import { DocsNavigation } from "@/components/layout/DocsNavigation";
import { SectionBarProvider } from "@/components/layout/DocsComponents";
import { Footer } from "@/components/layout/Footer";
import { StaticLinks } from "@/components/layout/StaticLinks";
import {
  transformPagesToGroupedStructure,
  type PagesProps,
} from "@/utils/orderNavItems";
import { navigationScopeKey, pageVariantPrefix } from "@/utils/variants";
import rawNavigation from "@/navigation.json";

// navigation.json can be an array (root scope only) or an object keyed by the
// URL prefix of each scope: a section slug ("api"), a language or version
// prefix ("de", "v1", "de/v1"), or both ("de/api").
type NavLink = {
  slug?: string;
  title: string;
  icon?: string;
  links?: NavLink[];
};
type NavItem = { label: string; icon?: string; links: NavLink[] };
type NavigationConfig = NavItem[] | Record<string, NavItem[]>;

const navigation = rawNavigation as NavigationConfig;

function getNavigationForScope(
  nav: NavigationConfig,
  scopeKey: string,
): NavItem[] | null {
  if (Array.isArray(nav)) {
    return scopeKey === "" && nav.length ? nav : null;
  }
  const scopeNav = nav[scopeKey];
  return scopeNav && scopeNav.length ? scopeNav : null;
}

interface SectionConfig {
  label: string;
  slug: string;
  directory?: string;
}

interface SectionNavProviderProps {
  sections: SectionConfig[];
  allPages: PagesProps[];
  hideBranding: boolean;
  /** False when the site has no section bar (languages or versions only). */
  hasSectionBar?: boolean;
  children: React.ReactNode;
}

function SectionNavProvider({
  sections,
  allPages,
  hideBranding,
  hasSectionBar = true,
  children,
}: SectionNavProviderProps) {
  // Sections and pages are matched inside the current language/version, so
  // the sidebar of /de/api lists the German API pages only.
  const { prefix, rest } = useVariant();

  const activeSectionSlug = useMemo(() => {
    const match = sections.find((section) => {
      if (section.slug === "") return false;
      return rest === section.slug || rest.startsWith(section.slug + "/");
    });
    return match ? match.slug : "";
  }, [sections, rest]);

  const result = useMemo(() => {
    const scopeNav = getNavigationForScope(
      navigation,
      navigationScopeKey(prefix, activeSectionSlug),
    );
    if (scopeNav) return scopeNav;
    const filtered = allPages.filter(
      (page) =>
        pageVariantPrefix(page) === prefix &&
        (page.section || "") === activeSectionSlug,
    );
    return transformPagesToGroupedStructure(filtered);
  }, [allPages, activeSectionSlug, prefix]);

  // Fallback when no pages exist yet (also defined in layout.tsx for the non-sections path)
  const defaultPages = [
    {
      slug: "",
      title: "Getting Started",
      description:
        "${DEFAULT_DESCRIPTION}",
      date: "2025-01-15",
      category: "Introduction",
      categoryOrder: 0,
      categoryIcon: "rocket",
      order: 0,
    },
  ];

  const defaultResults = transformPagesToGroupedStructure(defaultPages);

  return (
    <SectionBarProvider hasSectionBar={hasSectionBar}>
      <SideBar
        result={result.length ? result : defaultResults}
        pages={allPages}
      />
      {children}
      <DocsNavigation result={result.length ? result : defaultResults} />
      <StaticLinks />
      <Footer hideBranding={hideBranding} />
    </SectionBarProvider>
  );
}

export { SectionNavProvider };
`;
