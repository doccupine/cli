export const sideBarTemplate = `"use client";
import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoonStar, Sun } from "lucide-react";
import { useStrings } from "@/components/useStrings";
import { useColorMode } from "@/components/useColorMode";
import { Badge, httpMethodBadgeColor } from "@/components/layout/Badge";
import {
  DocsSidebar,
  SectionBarContext,
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
  // The row's inset grows 14px per nesting level (app/styles reads it).
  const indent = { "--dcp-sidebar-depth": depth } as CSSProperties;
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
      <li className="dcp-sidebar__item">
        <Link
          className="dcp-sidebar__link"
          href={href ?? "#"}
          aria-current={isActive ? "page" : undefined}
          onClick={onNavigate}
          style={indent}
        >
          {link.httpMethod && (
            <Badge
              className="dcp-sidebar__method"
              mono
              solid={isActive}
              size="xs"
              color={httpMethodBadgeColor(link.httpMethod)}
            >
              {link.httpMethod}
            </Badge>
          )}
          {link.icon && <Icon name={link.icon} size={16} />}
          {link.title}
        </Link>
      </li>
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
        <div
          className="dcp-sidebar__group-row"
          data-active={groupActive || undefined}
          data-open={isOpen || undefined}
          style={indent}
        >
          <Link
            className="dcp-sidebar__group-link"
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            onClick={onNavigate}
          >
            {link.icon && <Icon name={link.icon} size={16} />}
            {link.title}
          </Link>
          <button
            type="button"
            className="dcp-sidebar__group-chevron"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-controls={groupContentId}
            aria-label={toggleLabel}
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="dcp-sidebar__group-button"
          onClick={toggle}
          data-active={groupActive || undefined}
          data-open={isOpen || undefined}
          style={indent}
          aria-expanded={isOpen}
          aria-controls={groupContentId}
          aria-label={toggleLabel}
        >
          {link.icon && <Icon name={link.icon} size={16} />}
          {link.title}
          <Icon name="chevron-right" size={16} />
        </button>
      )}
      <ul
        className="dcp-sidebar__group-content"
        id={groupContentId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        data-open={isOpen || undefined}
      >
        {children.map((child: NavItemLink, index: number) => (
          <SidebarNavLink
            key={index}
            link={child}
            depth={depth + 1}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </li>
  );
}

// Light/dark switch, drawn as a pill (sun, then moon) in both designs. The
// knob follows the "dark" class on <html> in CSS, so it is right from the
// first paint; useColorMode only reports the state to assistive tech.
// Cmd/Ctrl+Shift+L flips the mode too.
function ThemeSwitch() {
  const { mode, toggleTheme } = useColorMode();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd on macOS, Ctrl elsewhere. Shift steps out of Cmd/Ctrl+L, which
      // focuses the address bar.
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey || e.altKey) return;
      if (e.key.toLowerCase() !== "l") return;
      e.preventDefault();
      toggleTheme();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  return (
    <button
      type="button"
      className="dcp-reset-button dcp-pill dcp-pill-switch dcp-theme-switch"
      role="switch"
      aria-checked={mode === "dark"}
      aria-label="Dark mode"
      title="Dark mode (⌘⇧L)"
      onClick={toggleTheme}
    >
      <Sun aria-hidden="true" />
      <MoonStar aria-hidden="true" />
    </button>
  );
}

// The navigation sidebar. Styles: app/styles (.dcp-sidebar).
function SideBar({ result, pages = [] }: SideBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hasSectionBar = useContext(SectionBarContext);
  const pathname = usePathname();
  const t = useStrings();
  const sidebarId = useId();
  const navRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useLockBodyScroll(isMobileMenuOpen);

  // Escape closes the open drawer and returns focus to the menu button.
  // Left alone when a dialog (search, chat) handles it first.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (e.target instanceof Element && e.target.closest("dialog[open]")) {
        return;
      }
      setIsMobileMenuOpen(false);
      toggleRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

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
      <button
        type="button"
        className="dcp-sidebar-toggle"
        ref={toggleRef}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? t.closeNavigation : t.openNavigation}
        aria-expanded={isMobileMenuOpen}
        aria-controls={sidebarId}
      >
        <span className="dcp-sidebar-toggle__burger" />
      </button>

      <nav
        aria-label={t.navigation}
        className="dcp-sidebar"
        id={sidebarId}
        ref={navRef}
        data-open={isMobileMenuOpen || undefined}
        data-sections={hasSectionBar || undefined}
      >
        {result &&
          result.map((item: NavItem, index: number) => {
            return (
              <ul className="dcp-sidebar__list" key={index}>
                <li className="dcp-sidebar__item">
                  <strong className="dcp-sidebar__label">
                    {item.icon && <Icon name={item.icon} size={16} />}
                    {item.label}
                  </strong>{" "}
                </li>
                <li>
                  <span className="dcp-sidebar__space" />
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
                  <span className="dcp-sidebar__space" />
                </li>
              </ul>
            );
          })}
        {/* One row of 30px controls. The focus-mode toggle is fixed over its
            left end, the switchers follow, and the theme toggle holds the
            right end of the rail. */}
        <div className="dcp-sidebar__footer" ref={footerRef}>
          <VariantSwitchers pages={pages} />
          <div className="dcp-sidebar__footer-toggle">
            <ThemeSwitch />
          </div>
        </div>
      </nav>

      {/* Outside the nav on purpose: focus mode slides that whole
          column away, and the toggle has to survive it. */}
      <FocusModeToggle />
    </DocsSidebar>
  );
}

export { SideBar };
`;
