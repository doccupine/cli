export const sectionNavProviderTemplate = `"use client";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { SideBar } from "@/components/SideBar";
import { DocsNavigation } from "@/components/layout/DocsNavigation";
import { Footer } from "@/components/layout/Footer";
import { StaticLinks } from "@/components/layout/StaticLinks";
import {
  transformPagesToGroupedStructure,
  type PagesProps,
} from "@/utils/orderNavItems";
import rawNavigation from "@/navigation.json";

// navigation.json can be an array (root section only) or an object keyed by section slug
type NavItem = { label: string; links: { slug: string; title: string }[] };
type NavigationConfig = NavItem[] | Record<string, NavItem[]>;

const navigation = rawNavigation as NavigationConfig;

function getNavigationForSection(
  nav: NavigationConfig,
  sectionSlug: string,
): NavItem[] | null {
  if (Array.isArray(nav)) {
    return sectionSlug === "" && nav.length ? nav : null;
  }
  const sectionNav = nav[sectionSlug];
  return sectionNav && sectionNav.length ? sectionNav : null;
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
  children: React.ReactNode;
}

function SectionNavProvider({
  sections,
  allPages,
  hideBranding,
  children,
}: SectionNavProviderProps) {
  const pathname = usePathname();
  const currentPath = pathname.replace(/^\\//, "").replace(/\\/$/, "");

  const activeSectionSlug = useMemo(() => {
    const match = sections.find((section) => {
      if (section.slug === "") return false;
      return (
        currentPath === section.slug ||
        currentPath.startsWith(section.slug + "/")
      );
    });
    return match ? match.slug : "";
  }, [sections, currentPath]);

  const result = useMemo(() => {
    const sectionNav = getNavigationForSection(navigation, activeSectionSlug);
    if (sectionNav) return sectionNav;
    const filtered = allPages.filter(
      (page) => (page.section || "") === activeSectionSlug,
    );
    return transformPagesToGroupedStructure(filtered);
  }, [allPages, activeSectionSlug]);

  // Fallback when no pages exist yet (also defined in layout.tsx for the non-sections path)
  const defaultPages = [
    {
      slug: "",
      title: "Getting Started",
      description:
        "Doccupine is a free and open-source document management system that allows you to store, organize, and share your documentation with ease. AI-ready.",
      date: "2025-01-15",
      category: "Introduction",
      categoryOrder: 0,
      order: 0,
    },
  ];

  const defaultResults = transformPagesToGroupedStructure(defaultPages);

  return (
    <>
      <SideBar result={result.length ? result : defaultResults} />
      {children}
      <DocsNavigation result={result.length ? result : defaultResults} />
      <StaticLinks />
      <Footer hideBranding={hideBranding} />
    </>
  );
}

export { SectionNavProvider };
`;
