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
  StyledSidebarGroupButton,
  StyledSidebarGroupRow,
  StyledSidebarGroupLink,
  StyledSidebarGroupChevron,
  StyledSidebarGroupContent,
  StyledSidebarFooter,
  StyleMobileBar,
  StyledMobileBurger,
} from "@/components/layout/DocsComponents";
import { Icon } from "@/components/layout/Icon";
import { useLockBodyScroll } from "@/components/LockBodyScroll";

// A link can be a leaf (slug + title) or a group with nested children. Both the
// category icon and the per-link icon are optional Lucide names.
type NavItemLink = {
  slug?: string;
  title: string;
  icon?: string;
  links?: NavItemLink[];
};

type NavItem = {
  label: string;
  icon?: string;
  links: NavItemLink[];
};

interface SideBarProps {
  result: NavItem[];
}

function linkContainsActivePath(link: NavItemLink, pathname: string): boolean {
  if (link.slug !== undefined && pathname === \`/\${link.slug}\`) {
    return true;
  }
  return (link.links ?? []).some((child) =>
    linkContainsActivePath(child, pathname),
  );
}

function SidebarNavLink({
  link,
  depth,
  pathname,
  onNavigate,
}: {
  link: NavItemLink;
  depth: number;
  pathname: string;
  onNavigate: () => void;
}) {
  const children = link.links ?? [];
  const hasChildren = children.length > 0;
  const href = link.slug !== undefined ? \`/\${link.slug}\` : undefined;
  const isActive = href !== undefined && pathname === href;
  const indent = { paddingLeft: \`\${20 + depth * 14}px\` };

  // Open collapsible groups that contain the active page so deep links land
  // with their ancestors already expanded.
  const [isOpen, setIsOpen] = useState(
    hasChildren
      ? children.some((child) => linkContainsActivePath(child, pathname))
      : false,
  );

  if (!hasChildren) {
    return (
      <StyledSidebarListItem>
        <StyledSidebarListItemLink
          href={href ?? "#"}
          $isActive={isActive}
          onClick={onNavigate}
          style={indent}
        >
          {link.icon && <Icon name={link.icon} size={16} />}
          {link.title}
        </StyledSidebarListItemLink>
      </StyledSidebarListItem>
    );
  }

  const toggle = () => setIsOpen((prev) => !prev);
  const toggleLabel = isOpen
    ? \`Collapse \${link.title}\`
    : \`Expand \${link.title}\`;
  const groupActive = linkContainsActivePath(link, pathname);

  return (
    <li>
      {href !== undefined ? (
        <StyledSidebarGroupRow
          $isActive={groupActive}
          $isOpen={isOpen}
          style={indent}
        >
          <StyledSidebarGroupLink href={href} onClick={onNavigate}>
            {link.icon && <Icon name={link.icon} size={16} />}
            {link.title}
          </StyledSidebarGroupLink>
          <StyledSidebarGroupChevron
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-label={toggleLabel}
          >
            <Icon name="chevron-right" size={16} />
          </StyledSidebarGroupChevron>
        </StyledSidebarGroupRow>
      ) : (
        <StyledSidebarGroupButton
          type="button"
          onClick={toggle}
          $isActive={groupActive}
          $isOpen={isOpen}
          style={indent}
          aria-expanded={isOpen}
          aria-label={toggleLabel}
        >
          {link.icon && <Icon name={link.icon} size={16} />}
          {link.title}
          <Icon name="chevron-right" size={16} />
        </StyledSidebarGroupButton>
      )}
      <StyledSidebarGroupContent $isOpen={isOpen}>
        {children.map((child: NavItemLink, index: number) => (
          <SidebarNavLink
            key={index}
            link={child}
            depth={depth + 1}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </StyledSidebarGroupContent>
    </li>
  );
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
                  <StyledStrong>
                    {item.icon && <Icon name={item.icon} size={16} />}
                    {item.label}
                  </StyledStrong>{" "}
                </StyledSidebarListItem>
                <li>
                  <Space $size={20} />
                </li>
                {item.links &&
                  item.links.map((link: NavItemLink, indexChild: number) => (
                    <SidebarNavLink
                      key={indexChild}
                      link={link}
                      depth={0}
                      pathname={pathname}
                      onNavigate={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
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
