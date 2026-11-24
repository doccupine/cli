// Look of the navigation rail (SideBar.tsx): the panel, its rows and nested
// groups, the sticky footer, and the mobile menu button.
export const sideBarStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { Button, resetButton, styledStrong } from "cherry-styled-components";
import Link from "next/link";
import { mq, Theme } from "@/app/theme";
import { focusModeHide } from "@/components/layout/SharedStyled";
import { Badge } from "@/components/layout/Badge";
import {
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

export const StyledSidebar = styled.nav<SidebarStyleProps>\`
  position: fixed;
  overflow-y: auto;
  max-height: calc(100dvh - \${headerOffset}px);
  width: 100%;
  z-index: 99;
  top: \${headerOffset}px;
  height: 100%;
  padding: 20px;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    visibility 0s linear 0.3s;
  transform: translateY(30px);
  left: 0;
  background: \${({ theme }) => theme.colors.light};
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    display: none;
  }

  \${mq("lg")} {
    border-right: solid 1px \${({ theme }) => theme.colors.grayLight};
    transition: none;
    max-height: 100dvh;
    padding: \${RAIL_TOP_OFFSET}px 20px 20px 20px;
    opacity: 1;
    pointer-events: all;
    visibility: visible;
    transform: translateY(0);
    /* Mixed over the page background rather than transparent so the panel
       reads as a filled surface in both modes. */
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 8%, \${theme.colors.light})\`};
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
// padding leaves its 30px plus a gap free at the left.
export const StyledSidebarFooter = styled.div\`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 22px 20px;
  position: sticky;
  border-top: 1px solid \${({ theme }) => theme.colors.grayLight};
  /* Same opaque mix as the sidebar panel so the sticky footer blends into it
     while still masking the list scrolling underneath. */
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 8%, \${theme.colors.light})\`};
  margin: 0 -20px -20px;
  bottom: -20px;

  \${mq("lg")} {
    padding: 16px 20px 16px 58px;
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

  /* On the rail the switchers claim the free width when both are configured,
     so the toggle keeps its own size and is pushed to the right end. */
  \${mq("lg")} {
    flex: 0 0 auto;
    margin-left: auto;
  }
\`;

export const StyledSidebarList = styled.ul\`
  list-style: none;
  margin: 0;
  padding: 0;

  &:last-of-type {
    margin-bottom: auto;
  }
\`;

export const StyledStrong = styled.strong<{ theme: Theme }>\`
  font-weight: 600;
  \${({ theme }) => styledStrong(theme)};
  color: \${({ theme }) => theme.colors.accentStrong};
  display: inline-flex;
  align-items: center;
  gap: 8px;

  & svg {
    flex-shrink: 0;
  }
\`;

export const StyledSidebarListItem = styled.li\`
  display: flex;
  gap: 10px;
  clear: both;
\`;

const sidebarRowLineHeight = 1.6;

// Shared appearance for every sidebar row - leaf links AND nested group
// headers - so hover, active state, and the left rail read identically.
const sidebarRowStyles = css<SidebarStyleProps>\`
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: \${sidebarRowLineHeight};
  color: \${({ theme }) => theme.colors.accentMuted};
  padding: 5px 0 5px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  transition: all 0.3s ease;
  border-left: solid 1px \${({ theme }) => theme.colors.grayLight};

  & svg {
    flex-shrink: 0;
  }

  &:hover {
    color: \${({ theme }) => theme.colors.accent};
    border-color: \${({ theme }) => theme.colors.primary};
  }

  \${({ $isActive, theme }) =>
    $isActive &&
    css\`
      color: \${theme.colors.accentStrong};
      border-color: \${theme.colors.primary};
      font-weight: 600;
    \`};
\`;

// The collapse chevron points right when closed and rotates to point down
// when the group is open.
const sidebarChevron = css<SidebarStyleProps>\`
  & .lucide-chevron-right {
    margin-left: auto;
    transition: transform 0.3s ease;

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
  width: 100%;
  height: auto;
  min-height: 0;
  text-align: left;

  /* Buttons aren't covered by the global a:focus-visible ring, so this
     nav-row toggle carries its own copy of it. */
  &:focus-visible {
    outline: none;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

export const StyledSidebarGroupRow = styled.div<SidebarStyleProps>\`
  \${sidebarRowStyles};
  \${sidebarChevron};

  /* The row is a plain div, so it never matches :focus-visible itself. Ring the
     whole row when its inner link or chevron takes keyboard focus instead, to
     match the leaf-row focus treatment. */
  &:has(:focus-visible) {
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
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
  width: auto;
  height: auto;
  min-height: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;

  /* Ring is drawn on the parent row via :has(:focus-visible). */
  &:focus-visible {
    outline: none;
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

export const StyleMobileBar = styled(Button)<SidebarStyleProps>\`
  \${resetButton};
  position: fixed;
  z-index: 999;
  bottom: 0;
  right: 20px;
  font-size: \${({ theme }) => theme.fontSizes.strong.lg};
  line-height: \${({ theme }) => theme.fontSizes.strong.lg};
  box-shadow: \${({ theme }) => theme.shadows.sm};
  background: \${({ theme }) => theme.colors.primary};
  color: \${({ theme }) => theme.colors.surface};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 10px;
  border-radius: 100px;
  margin: 0 0 20px 0;
  font-weight: 600;
  display: flex;
  justify-content: flex-start;
  width: auto;
  height: auto;
  min-height: 0;

  \${mq("lg")} {
    display: none;
  }

  \${({ $isActive }) => $isActive && \`position: fixed;\`};
\`;

export const StyledMobileBurger = styled.span<SidebarStyleProps>\`
  display: block;
  margin: auto 0;
  width: 18px;
  height: 18px;
  position: relative;
  overflow: hidden;
  background: transparent;
  position: relative;
  transform: scale(0.8);

  &::before,
  &::after {
    content: "";
    display: block;
    position: absolute;
    width: 18px;
    height: 3px;
    border-radius: 3px;
    background: \${({ theme }) => theme.colors.surface};
    transition: all 0.3s ease;
  }

  &::before {
    top: 3px;
  }

  &::after {
    bottom: 3px;
  }

  \${({ $isActive }) =>
    $isActive &&
    css\`
      &::before {
        transform: translateY(5px) rotate(45deg);
      }

      &::after {
        transform: translateY(-4px) rotate(-45deg);
      }
    \`};
\`;
`;
