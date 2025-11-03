export const docsNavigationTemplate = `"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { Icon } from "@/components/layout/Icon";
import { mq, Theme } from "@/app/theme";
import { interactiveStyles } from "@/components/layout/SharedStyled";

const NavigationWrapper = styled.div\`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 0 0 100px 0;

  \${mq("lg")} {
    padding: 0 320px 80px 320px;
  }
\`;

const NavButton = styled(Link)<{ theme: Theme }>\`
\${interactiveStyles};
  display: flex;
  flex-direction: column;
  text-decoration: none;
  padding: 20px;
  flex: 50%;
  max-width: 50%;
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  color: \${({ theme }) => theme.colors.dark};

  &:hover {
    border-color: \${({ theme }) => theme.colors.primary || "#3b82f6"};
  }

  &[data-direction="prev"] {
    align-items: flex-start;
  }

  &[data-direction="next"] {
    align-items: flex-end;
    margin-left: auto;
  }
\`;

const NavLabel = styled.span<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.gray};
  display: flex;
  flex-direction: row;
  gap: 4px;

  & svg {
    margin: auto 0;
  }
\`;

const NavTitle = styled.span<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.dark};
  font-weight: 600;
  margin: 0 0 4px 0;
\`;

const Spacer = styled.div\`
  flex: 1;
\`;

interface Page {
  slug: string;
  title: string;
  category?: string;
  [key: string]: any;
}

interface NavigationItem {
  category?: string;
  slug?: string;
  title?: string;
  links?: Page[];
  items?: Page[];
  [key: string]: any;
}

interface DocsNavigationProps {
  result: NavigationItem[];
}

function DocsNavigation({ result }: DocsNavigationProps) {
  const pathname = usePathname();

  // Flatten all pages from all categories into a single sorted array
  // Handle categories with links array, items array, or direct page objects
  const allPages: Page[] = result.flatMap((item) => {
    // If item has links array (it's a category), return those links
    if (item.links && Array.isArray(item.links)) {
      return item.links;
    }
    // If item has items array (alternative structure), return those items
    if (item.items && Array.isArray(item.items)) {
      return item.items;
    }
    // If item has a slug (it's a page itself), return it
    if (item.slug !== undefined) {
      return [item as Page];
    }
    // Otherwise, skip it
    return [];
  });

  // Get current slug from pathname (remove leading slash and trailing slash)
  const currentSlug = pathname.replace(/^\\//, "").replace(/\\/$/, "");

  // Find current page index
  const currentIndex = allPages.findIndex((page) => page.slug === currentSlug);

  // Get previous and next pages
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  // If current page not found or no pages available, don't render navigation
  if (currentIndex === -1 || allPages.length === 0) {
    return null;
  }

  // If no prev or next, still render empty wrapper for consistency
  if (!prevPage && !nextPage) {
    return null;
  }

  return (
    <NavigationWrapper>
      {prevPage ? (
        <NavButton href={\`/\${prevPage.slug}\`} data-direction="prev">
          <NavTitle>{prevPage.title}</NavTitle>
          <NavLabel>
            <Icon name="arrow-left" size={16} /> Previous
          </NavLabel>
        </NavButton>
      ) : (
        <Spacer />
      )}

      {nextPage && (
        <NavButton href={\`/\${nextPage.slug}\`} data-direction="next">
          <NavTitle>{nextPage.title}</NavTitle>
          <NavLabel>
            Next <Icon name="arrow-right" size={16} />
          </NavLabel>
        </NavButton>
      )}
    </NavigationWrapper>
  );
}

export { DocsNavigation };`;
