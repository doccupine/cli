export const docsNavigationTemplate = `"use client";
import { usePathname } from "next/navigation";
import { useStrings } from "@/components/useStrings";
import { useChat } from "cherry-styled-components";
import { Icon } from "@/components/layout/Icon";
import {
  StyledNavigationWrapper,
  StyledNavigationInner,
  StyledNavButton,
  StyledNavLabel,
  StyledNavTitle,
  StyledSpacer,
} from "@/components/layout/DocsNavigation.styles";

interface Page {
  // Optional: nested group nodes may act as headers without their own page.
  // collectPages() only pushes nodes that actually have a slug.
  slug?: string;
  title: string;
  category?: string;
  links?: Page[];
  items?: Page[];
  [key: string]: unknown;
}

interface NavigationItem {
  category?: string;
  slug?: string;
  title?: string;
  links?: Page[];
  items?: Page[];
  [key: string]: unknown;
}

interface DocsNavigationProps {
  result: NavigationItem[];
}

function DocsNavigation({ result }: DocsNavigationProps) {
  const { isOpen } = useChat();
  const pathname = usePathname();
  const t = useStrings();
  // Walk categories and any nested link groups depth-first so prev/next spans
  // every real page (a node with a slug), in reading order.
  const collectPages = (nodes: unknown): Page[] => {
    if (!Array.isArray(nodes)) return [];
    const pages: Page[] = [];
    for (const node of nodes as Page[]) {
      if (node && node.slug !== undefined) {
        pages.push(node);
      }
      const children = node && ((node.links ?? node.items) as unknown);
      if (Array.isArray(children)) {
        pages.push(...collectPages(children));
      }
    }
    return pages;
  };
  const allPages: Page[] = result.flatMap((item) =>
    collectPages(
      item.links ??
        item.items ??
        (item.slug !== undefined ? [item as Page] : []),
    ),
  );
  const currentSlug = pathname.replace(/^\\//, "").replace(/\\/$/, "");
  const currentIndex = allPages.findIndex((page) => page.slug === currentSlug);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;
  if (currentIndex === -1 || allPages.length === 0) {
    return null;
  }
  if (!prevPage && !nextPage) {
    return null;
  }
  return (
    <StyledNavigationWrapper $isChatOpen={isOpen}>
      <StyledNavigationInner>
        {prevPage ? (
          <StyledNavButton href={\`/\${prevPage.slug}\`} data-direction="prev">
            <StyledNavTitle>{prevPage.title}</StyledNavTitle>
            <StyledNavLabel>
              <Icon name="arrow-left" size={16} /> {t.previous}
            </StyledNavLabel>
          </StyledNavButton>
        ) : (
          <StyledSpacer />
        )}
        {nextPage && (
          <StyledNavButton href={\`/\${nextPage.slug}\`} data-direction="next">
            <StyledNavTitle>{nextPage.title}</StyledNavTitle>
            <StyledNavLabel>
              {t.next} <Icon name="arrow-right" size={16} />
            </StyledNavLabel>
          </StyledNavButton>
        )}
      </StyledNavigationInner>
    </StyledNavigationWrapper>
  );
}

export { DocsNavigation };
`;
