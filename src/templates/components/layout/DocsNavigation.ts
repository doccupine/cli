export const docsNavigationTemplate = `"use client";
import { useContext } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styled, { css } from "styled-components";
import { Icon } from "@/components/layout/Icon";
import { mq, Theme } from "@/app/theme";
import { interactiveStyles } from "@/components/layout/SharedStyled";
import { ChatContext } from "@/components/Chat";

const StyledNavigationWrapper = styled.div<{
  $isChatOpen?: boolean;
}>\`
  transition: all 0.3s ease;
  padding: 0 20px 100px 20px;
  \${mq("lg")} {
    padding: 0 340px 80px 340px;
    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 0 440px 80px 340px;
      \`}
  }
\`;

const StyledNavigationInner = styled.div\`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  max-width: 640px;
  margin: auto;
\`;

const StyledNavButton = styled(Link)<{ theme: Theme }>\`
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
    border-color: \${({ theme }) => theme.colors.primary};
  }

  &[data-direction="prev"] {
    align-items: flex-start;
  }

  &[data-direction="next"] {
    align-items: flex-end;
    margin-left: auto;
    text-align: right;
  }
\`;

const StyledNavLabel = styled.span<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.gray};
  display: flex;
  flex-direction: row;
  gap: 4px;

  & svg {
    margin: auto 0;
  }
\`;

const StyledNavTitle = styled.span<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.dark};
  font-weight: 600;
  margin: 0 0 4px 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
\`;

const StyledSpacer = styled.div\`
  flex: 1;
\`;

interface Page {
  slug: string;
  title: string;
  category?: string;
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
  const { isOpen } = useContext(ChatContext);
  const pathname = usePathname();
  const allPages: Page[] = result.flatMap((item) => {
    if (item.links && Array.isArray(item.links)) {
      return item.links;
    }
    if (item.items && Array.isArray(item.items)) {
      return item.items;
    }
    if (item.slug !== undefined) {
      return [item as Page];
    }
    return [];
  });
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
              <Icon name="arrow-left" size={16} /> Previous
            </StyledNavLabel>
          </StyledNavButton>
        ) : (
          <StyledSpacer />
        )}
        {nextPage && (
          <StyledNavButton href={\`/\${nextPage.slug}\`} data-direction="next">
            <StyledNavTitle>{nextPage.title}</StyledNavTitle>
            <StyledNavLabel>
              Next <Icon name="arrow-right" size={16} />
            </StyledNavLabel>
          </StyledNavButton>
        )}
      </StyledNavigationInner>
    </StyledNavigationWrapper>
  );
}

export { DocsNavigation };
`;
