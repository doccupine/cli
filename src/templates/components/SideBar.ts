export const sideBarTemplate = `"use client";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useStrings } from "@/components/useStrings";
import { Space, ThemeToggle } from "cherry-styled-components";
import { httpMethodBadgeColor } from "@/components/layout/Badge";
import {
  DocsSidebar,
  SectionBarContext,
  StyledSidebar,
  StyledSidebarList,
  StyledSidebarListItem,
  StyledStrong,
  StyledSidebarListItemLink,
  StyledSidebarMethodTag,
  StyledSidebarGroupButton,
  StyledSidebarGroupRow,
  StyledSidebarGroupLink,
  StyledSidebarGroupChevron,
  StyledSidebarGroupContent,
  StyledSidebarFooter,
  StyledSidebarFooterToggle,
  StyleMobileBar,
  StyledMobileBurger,
} from "@/components/layout/DocsComponents";
import { FocusModeToggle } from "@/components/layout/FocusModeToggle";
import { Icon } from "@/components/layout/Icon";
import { VariantSwitchers } from "@/components/layout/VariantSwitchers";
import { useLockBodyScroll } from "@/components/LockBodyScroll";
import type { PagesProps } from "@/utils/orderNavItems";

// A link can be a leaf (slug + title) or a group with nested children. Both the
// category icon and the per-link icon are optional Lucide names.
type NavItemLink = {
  slug?: string;
  title: string;
  icon?: string;
  httpMethod?: string;
  links?: NavItemLink[];
};

type NavItem = {
  label: string;
  icon?: string;
  links: NavItemLink[];
};

interface SideBarProps {
  result: NavItem[];
  /** Every page of the site. The language and version switchers in the footer
      resolve the current page's counterpart from it; sites without
      languages.json or versions.json never render them. */
  pages?: PagesProps[];
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
  const groupContentId = useId();
  const t = useStrings();

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
          aria-current={isActive ? "page" : undefined}
          onClick={onNavigate}
          style={indent}
        >
          {link.httpMethod && (
            <StyledSidebarMethodTag
              mono
              solid={isActive}
              size="xs"
              color={httpMethodBadgeColor(link.httpMethod)}
            >
              {link.httpMethod}
            </StyledSidebarMethodTag>
          )}
          {link.icon && <Icon name={link.icon} size={16} />}
          {link.title}
        </StyledSidebarListItemLink>
      </StyledSidebarListItem>
    );
  }

  const toggle = () => setIsOpen((prev) => !prev);
  const toggleLabel = (isOpen ? t.collapseGroup : t.expandGroup).replace(
    "{title}",
    link.title,
  );
  const groupActive = linkContainsActivePath(link, pathname);

  return (
    <li>
      {href !== undefined ? (
        <StyledSidebarGroupRow
          $isActive={groupActive}
          $isOpen={isOpen}
          style={indent}
        >
          <StyledSidebarGroupLink
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            onClick={onNavigate}
          >
            {link.icon && <Icon name={link.icon} size={16} />}
            {link.title}
          </StyledSidebarGroupLink>
          <StyledSidebarGroupChevron
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-controls={groupContentId}
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
          aria-controls={groupContentId}
          aria-label={toggleLabel}
        >
          {link.icon && <Icon name={link.icon} size={16} />}
          {link.title}
          <Icon name="chevron-right" size={16} />
        </StyledSidebarGroupButton>
      )}
      <StyledSidebarGroupContent id={groupContentId} $isOpen={isOpen}>
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

function SideBar({ result, pages = [] }: SideBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hasSectionBar = useContext(SectionBarContext);
  const pathname = usePathname();
  const t = useStrings();
  const sidebarId = useId();
  const navRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(isMobileMenuOpen);

  // Bring the current page's link into view within the sidebar's own scroll
  // area when it starts off-screen (deep pages, in-content links, search).
  // Scoped to the nav via scrollTo so the main document never jumps.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;

    const navRect = nav.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    // The sidebar footer - theme toggle plus the language and version
    // switchers - is sticky over the bottom of the scroll area, so links
    // underneath it are covered rather than visible.
    // Clamp the visible bottom to the footer's top edge when it's pinned.
    const footerRect = footerRef.current?.getBoundingClientRect();
    const visibleBottom = footerRect
      ? Math.min(navRect.bottom, footerRect.top)
      : navRect.bottom;

    const isOutOfView =
      activeRect.top < navRect.top || activeRect.bottom > visibleBottom;
    if (!isOutOfView) return;

    // Center within the visible band (nav top .. footer top), not the full
    // nav height, so the link never settles behind the footer.
    const visibleHeight = visibleBottom - navRect.top;
    const target =
      nav.scrollTop +
      (activeRect.top - navRect.top) -
      (visibleHeight - active.clientHeight) / 2;

    // Animate the scroll, but honor users who opt out of motion.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    nav.scrollTo({
      top: Math.max(0, target),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [pathname]);

  return (
    <DocsSidebar>
      <StyleMobileBar
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        $isActive={isMobileMenuOpen}
        aria-label={isMobileMenuOpen ? t.closeNavigation : t.openNavigation}
        aria-expanded={isMobileMenuOpen}
        aria-controls={sidebarId}
      >
        <StyledMobileBurger $isActive={isMobileMenuOpen} />
      </StyleMobileBar>

      <StyledSidebar
        id={sidebarId}
        ref={navRef}
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
        {/* One row of 30px controls. The focus-mode toggle is fixed over its
            left end, the switchers follow, and the theme toggle holds the
            right end of the rail. */}
        <StyledSidebarFooter ref={footerRef}>
          <VariantSwitchers pages={pages} />
          <StyledSidebarFooterToggle>
            <ThemeToggle $shortcut />
          </StyledSidebarFooterToggle>
        </StyledSidebarFooter>
      </StyledSidebar>

      {/* Outside StyledSidebar on purpose: focus mode slides that whole
          column away, and the toggle has to survive it. */}
      <FocusModeToggle />
    </DocsSidebar>
  );
}

export { SideBar };
`;
