export const sideBarTemplate = `"use client";
import { useContext, useState } from "react";
import { usePathname } from "next/navigation";
import { Flex, Space, ThemeToggle } from "cherry-styled-components";
import {
  DocsSidebar,
  SectionBarContext,
  StyledSidebar,
  StyledSidebarList,
  StyledSidebarListItem,
  StyledStrong,
  StyledSidebarListItemLink,
  StyledSidebarFooter,
  StyleMobileBar,
  StyledMobileBurger,
} from "@/components/layout/DocsComponents";
import { useLockBodyScroll } from "@/components/LockBodyScroll";

type NavItem = {
  label: string;
  links: NavItemLink[];
};

type NavItemLink = {
  slug: string;
  title: string;
};

interface SideBarProps {
  result: NavItem[];
}

function SideBar({ result }: SideBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hasSectionBar = useContext(SectionBarContext);
  const pathname = usePathname();

  useLockBodyScroll(isMobileMenuOpen);

  return (
    <DocsSidebar>
      <StyleMobileBar
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        $isActive={isMobileMenuOpen}
        aria-label={
          isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
        }
        aria-expanded={isMobileMenuOpen}
      >
        <StyledMobileBurger $isActive={isMobileMenuOpen} />
      </StyleMobileBar>

      <StyledSidebar
        $isActive={isMobileMenuOpen}
        $hasSectionBar={hasSectionBar}
      >
        {result &&
          result.map((item: NavItem, index: number) => {
            return (
              <StyledSidebarList key={index}>
                <StyledSidebarListItem>
                  <StyledStrong>{item.label}</StyledStrong>{" "}
                </StyledSidebarListItem>
                <li>
                  <Space $size={20} />
                </li>
                {item.links &&
                  item.links.map((link: NavItemLink, indexChild: number) => {
                    return (
                      <StyledSidebarListItem key={indexChild}>
                        <StyledSidebarListItemLink
                          href={\`/\${link.slug}\`}
                          $isActive={pathname === \`/\${link.slug}\`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.title}
                        </StyledSidebarListItemLink>
                      </StyledSidebarListItem>
                    );
                  })}
                <li aria-hidden="true">
                  <Space $size={20} />
                </li>
              </StyledSidebarList>
            );
          })}
        <StyledSidebarFooter>
          <Flex $xsJustifyContent="flex-start" $lgJustifyContent="flex-end">
            <ThemeToggle />
          </Flex>
        </StyledSidebarFooter>
      </StyledSidebar>
    </DocsSidebar>
  );
}

export { SideBar };
`;
