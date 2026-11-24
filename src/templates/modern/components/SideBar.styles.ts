export const modernSideBarStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { Button, resetButton } from "cherry-styled-components";
import Link from "next/link";
import { mq, Theme } from "@/app/theme";
import { focusModeHide } from "@/components/layout/SharedStyled";
import { Badge } from "@/components/layout/Badge";
import {
  COLUMN_GUTTER,
  HEADER_HEIGHT,
  HEADER_HEIGHT_WITH_SECTIONS,
  RAIL_TOP_OFFSET,
  SIDEBAR_WIDTH,
} from "@/components/layout/designTokens";

export interface SidebarStyleProps {
  theme?: Theme;
  $isActive?: boolean;
  $isOpen?: boolean;
  $hasSectionBar?: boolean;
}

// Below "lg" the rail opens as a sheet under the header, whose height
// depends on whether the section bar is showing.
const headerOffset = ({ $hasSectionBar }: SidebarStyleProps) =>
  $hasSectionBar ? HEADER_HEIGHT_WITH_SECTIONS : HEADER_HEIGHT;

// Rows get their left padding inline from SideBar.tsx (14px per nesting level
// on top of --sidebar-row-inset, set on the groups below). The rail keeps a
// real margin from the viewport edge, so the current page's highlight never
// runs up to it; rows pad their text a little inside that.
const ROW_INSET = 10;
const railInset = 16;

export const StyledSidebar = styled.nav<SidebarStyleProps>\`
  position: fixed;
  overflow-y: auto;
  max-height: calc(100dvh - \${headerOffset}px);
  width: 100%;
  z-index: 99;
  top: \${headerOffset}px;
  height: 100%;
  padding: 16px \${COLUMN_GUTTER}px 24px \${railInset}px;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    visibility 0s linear 0.3s;
  transform: translateY(16px);
  left: 0;
  background: \${({ theme }) => theme.colors.light};
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    display: none;
  }

  \${mq("lg")} {
    transition: none;
    max-height: 100dvh;
    padding: \${RAIL_TOP_OFFSET}px 16px 24px \${railInset}px;
    opacity: 1;
    pointer-events: all;
    visibility: visible;
    transform: translateY(0);
    background: transparent;
    top: 0;
    width: \${SIDEBAR_WIDTH}px;
  }

  \${({ $isActive }) =>
    $isActive &&
    css\`
      transform: translateY(0);
      opacity: 1;
      pointer-events: all;
      visibility: visible;
      transition-delay: 0s;
    \`}

  \${focusModeHide("left")};

  \${mq("lg")} {
    html[data-focus-mode] & {
      visibility: hidden;
      transition:
        transform 0.3s ease,
        opacity 0.3s ease,
        visibility 0s linear 0.3s;
    }
  }
\`;

// One row of 30px controls: the focus-mode toggle, the language and version
// switchers, then the theme toggle. The focus toggle is fixed rather than a
// child (it outlives the sidebar in focus mode), so on the rail the row's own
// padding leaves its 30px plus a gap free at the left. No rule above it: a
// short fade masks the list scrolling underneath instead.
export const StyledSidebarFooter = styled.div\`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px \${COLUMN_GUTTER}px 24px;
  position: sticky;
  background: \${({ theme }) => theme.colors.light};
  margin: 24px -\${COLUMN_GUTTER}px -24px -\${railInset}px;
  bottom: -24px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 100%;
    height: 24px;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      transparent,
      \${({ theme }) => theme.colors.light}
    );
  }

  \${mq("lg")} {
    margin-right: -16px;
    padding: 16px 16px 16px 58px;
  }
\`;

// The theme toggle's slot takes whatever the switchers leave, so the toggle
// stays beside them in the mobile menu and holds the right end of the rail.
// A plain flex row rather than Cherry's Flex: the slot has to grow, which is a
// property of the child, and styled(Flex) would swallow Flex's own $-prefixed
// props on the way through.
export const StyledSidebarFooterToggle = styled.div\`
  display: flex;
  flex: 1;
  justify-content: flex-start;

  \${mq("lg")} {
    flex: 0 0 auto;
    margin-left: auto;
  }
\`;

// A group: its label, then its rows. SideBar.tsx puts a 20px spacer under
// the label and another after the rows; this design keeps the one between
// groups and tightens the label's own.
export const StyledSidebarList = styled.ul\`
  list-style: none;
  margin: 0;
  padding: 0;

  /* Rows take their base inset from this variable (SideBar.tsx adds 14px per
     nesting level). When the group label has an icon, rows start where the
     label's text does (the 14px icon plus the 8px gap), so the links line up
     under it. */
  --sidebar-row-inset: \${ROW_INSET}px;

  &:has(> li > strong svg) {
    --sidebar-row-inset: \${ROW_INSET + 22}px;
  }

  & > li:nth-child(2) {
    display: none;
  }

  &:last-of-type {
    margin-bottom: auto;
  }
\`;

export const StyledStrong = styled.strong<{ theme: Theme }>\`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  padding-left: \${ROW_INSET}px;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: \${({ theme }) => theme.colors.dark};

  & svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    color: \${({ theme }) => theme.colors.grayDark};
  }
\`;

export const StyledSidebarListItem = styled.li\`
  display: flex;
  gap: 10px;
  clear: both;
\`;

const sidebarRowLineHeight = 1.45;

// Shared appearance for every sidebar row - leaf links AND nested group
// headers. Quiet text, a soft fill on hover, and the accent color with a
// heavier weight for the current page; no rails or borders.
const sidebarRowStyles = css<SidebarStyleProps>\`
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: \${sidebarRowLineHeight};
  color: \${({ theme }) => theme.colors.grayDark};
  padding: 6px 8px 6px var(--sidebar-row-inset, \${ROW_INSET}px);
  margin: 1px 0;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;

  & svg {
    flex-shrink: 0;
  }

  &:hover {
    color: \${({ theme }) => theme.colors.dark};
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 4%, transparent)\`};
  }

  \${({ $isActive, theme }) =>
    $isActive &&
    css\`
      color: \${theme.colors.accent};
      font-weight: 500;
      /* A faint accent wash keeps the current page findable when the
         palette's accent sits close to the body text (the default grays). */
      background: color-mix(in srgb, \${theme.colors.accent} 7%, transparent);

      &:hover {
        color: \${theme.colors.accent};
        background: color-mix(in srgb, \${theme.colors.accent} 9%, transparent);
      }
    \`};
\`;

// The collapse chevron sits right after the label, points right when closed
// and turns to point down when the group is open.
const sidebarChevron = css<SidebarStyleProps>\`
  & .lucide-chevron-right {
    width: 14px;
    height: 14px;
    color: \${({ theme }) => theme?.colors.gray};
    transition: transform 0.2s ease;

    \${({ $isOpen }) =>
      $isOpen &&
      css\`
        transform: rotate(90deg);
      \`}
  }
\`;

export const StyledSidebarListItemLink = styled(Link)<SidebarStyleProps>\`
  \${sidebarRowStyles};
\`;

// Compact HTTP-method label shown before a generated API endpoint link, colored
// by verb so endpoints are scannable in the sidebar. Only rendered when a link
// carries an \`httpMethod\` (endpoint pages do; hand-written pages do not).
// The look is Badge's mono variation (tinted, solid when active); only
// sidebar metrics are adjusted here. The tag stays on the title's first line
// when the title wraps, so its top offset centers it within one line box. The
// min-width fits the longest verb (OPTIONS), so every title starts on one edge.
const sidebarMethodTagHeight = 18;

const sidebarMethodTagOffset = ({ theme }: { theme: Theme }) =>
  \`calc((\${theme.fontSizes.small.lg} * \${sidebarRowLineHeight} - \${sidebarMethodTagHeight}px) / 2)\`;

export const StyledSidebarMethodTag = styled(Badge)<{ theme: Theme }>\`
  flex-shrink: 0;
  align-self: flex-start;
  justify-content: center;
  min-width: 48px;
  height: \${sidebarMethodTagHeight}px;
  margin-top: \${sidebarMethodTagOffset};
  font-size: 9px;
  letter-spacing: 0.02em;
  padding: 1px 4px;
  border: none;
\`;

// Nested navigation group. The header shares the link appearance/hover; a
// non-navigable group is a single toggle button, while a group that is also a
// page pairs a link with a chevron toggle. Children live in
// StyledSidebarGroupContent, which animates open/closed via height 0 <-> auto
// (enabled by interpolate-size in GlobalStyles, same as the Accordion).
export const StyledSidebarGroupButton = styled(Button)<SidebarStyleProps>\`
  \${resetButton};
  \${sidebarRowStyles};
  \${sidebarChevron};

  /* A group is "active" while it holds the current page; that page's own
     row carries the wash, so the group header keeps only the accent text. */
  \${({ $isActive }) =>
    $isActive &&
    css\`
      background: transparent;
    \`}
  width: 100%;
  height: auto;
  min-height: 0;
  text-align: left;
  font-family: inherit;

  & .lucide-chevron-right {
    margin-left: auto;
  }

  /* Doubled to outrank Cherry Button's fill and rings on hover, focus and
     press, so the toggle behaves like the link rows. */
  &&:focus,
  &&:active {
    background: transparent;
    box-shadow: none;
  }

  &&:hover {
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 4%, transparent)\`};
    box-shadow: none;
  }

  /* Buttons aren't covered by the global a:focus-visible ring, so this
     nav-row toggle carries its own copy of it. */
  &&:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

export const StyledSidebarGroupRow = styled.div<SidebarStyleProps>\`
  \${sidebarRowStyles};
  \${sidebarChevron};

  /* A group is "active" while it holds the current page; that page's own
     row carries the wash, so the group header keeps only the accent text. */
  \${({ $isActive }) =>
    $isActive &&
    css\`
      background: transparent;
    \`}

  /* The row is a plain div, so it never matches :focus-visible itself. Ring the
     whole row when its inner link or chevron takes keyboard focus instead, to
     match the leaf-row focus treatment. */
  &:has(:focus-visible) {
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

export const StyledSidebarGroupLink = styled(Link)\`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  color: inherit;
  text-decoration: none;

  & svg {
    flex-shrink: 0;
  }

  /* Ring is drawn on the parent row via :has(:focus-visible); suppress the
     global a:focus-visible glow so it isn't drawn twice. */
  &:focus-visible {
    outline: none;
    box-shadow: none;
  }
\`;

export const StyledSidebarGroupChevron = styled(Button)\`
  \${resetButton};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  min-height: 0;
  padding: 0;
  margin-left: auto;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;

  /* No fill or rings of its own (Cherry Button paints both): the parent
     row draws the hover fill and, via :has(:focus-visible), the ring. */
  &&:hover,
  &&:focus,
  &&:active,
  &&:focus-visible {
    outline: none;
    background: none;
    box-shadow: none;
  }
\`;

// Collapsed groups are hidden from assistive tech and focus by SideBar.tsx
// (aria-hidden and inert); this only animates them.
export const StyledSidebarGroupContent = styled.ul<SidebarStyleProps>\`
  list-style: none;
  margin: 0;
  padding: 0;
  height: 0;
  overflow: clip;
  visibility: hidden;
  transition:
    height 0.3s ease,
    visibility 0s linear 0.3s;

  \${({ $isOpen }) =>
    $isOpen &&
    css\`
      height: auto;
      visibility: visible;
      transition-delay: 0s;
    \`}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
\`;

// The menu button sits at the right end of the header's top row. It is not
// part of the header (the sidebar owns the menu state), so it is placed over
// it: absolute against the page while the header is in normal flow, fixed
// only once the header pins (Header.tsx marks it data-pinned). Nothing fixed
// touches the top edge at scroll position zero, which iPad Safari needs to
// color its toolbar.
const MENU_BUTTON_SIZE = 32;

export const StyleMobileBar = styled(Button)<SidebarStyleProps>\`
  \${resetButton};
  position: absolute;
  z-index: 1001;
  top: \${(HEADER_HEIGHT - MENU_BUTTON_SIZE) / 2}px;
  right: \${COLUMN_GUTTER}px;
  width: \${MENU_BUTTON_SIZE}px;
  height: \${MENU_BUTTON_SIZE}px;
  min-height: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  background: \${({ theme }) => theme.colors.light};
  color: \${({ theme }) => theme.colors.dark};
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  /* Doubled to outrank Cherry Button's own fill and rings on hover, focus
     and press: this control stays a quiet outlined circle. */
  &&:hover,
  &&:focus,
  &&:active {
    background: \${({ theme }) => theme.colors.light};
    box-shadow: none;
  }

  &&:hover {
    border-color: \${({ theme }) => theme.colors.gray};
  }

  &&:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }

  html:has(#header[data-pinned]) & {
    position: fixed;
  }

  /* The chat panel opens fullscreen below "lg" and its own header holds the
     close button where this one sits, so the menu button steps aside. */
  html:has([data-chat-panel][aria-hidden="false"]) & {
    visibility: hidden;
  }

  \${mq("lg")} {
    display: none;
  }
\`;

export const StyledMobileBurger = styled.span<SidebarStyleProps>\`
  display: block;
  width: 14px;
  height: 10px;
  position: relative;

  &::before,
  &::after {
    content: "";
    display: block;
    position: absolute;
    left: 0;
    width: 14px;
    height: 1.5px;
    border-radius: 2px;
    background: \${({ theme }) => theme.colors.dark};
    transition: transform 0.3s ease;
  }

  &::before {
    top: 1px;
  }

  &::after {
    bottom: 1px;
  }

  \${({ $isActive }) =>
    $isActive &&
    css\`
      &::before {
        transform: translateY(3.25px) rotate(45deg);
      }

      &::after {
        transform: translateY(-3.25px) rotate(-45deg);
      }
    \`};

  @media (prefers-reduced-motion: reduce) {
    &::before,
    &::after {
      transition: none;
    }
  }
\`;
`;
