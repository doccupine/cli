export const modernDocsSideBarStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { mq, Theme } from "@/app/theme";
import { focusModeHide } from "@/components/layout/SharedStyled";
import { RAIL_TOP_OFFSET, TOC_WIDTH } from "@/components/layout/designTokens";

// Lucide's "text-align-start" glyph, drawn through a mask so it takes the
// label's color in both modes.
const listIcon = \`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 5H3'/%3E%3Cpath d='M15 12H3'/%3E%3Cpath d='M17 19H3'/%3E%3C/svg%3E")\`;

// Where the entries' text starts: the active dot and the label's icon sit
// in the column before it.
const DOT_GUTTER = 20;
const LABEL_ICON = 13;

export const StyledIndexSidebar = styled.ul<{ theme: Theme }>\`
  display: none;
  list-style: none;
  margin: 0;
  position: fixed;
  top: 0;
  right: 0;
  width: \${TOC_WIDTH}px;
  height: 100dvh;
  overflow-y: auto;
  z-index: 1;
  padding: \${RAIL_TOP_OFFSET}px 24px 24px 12px;
  background: transparent;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  \${mq("lg")} {
    display: block;
  }

  & li {
    position: relative;
    padding: 4px 0;
  }

  \${focusModeHide("right")};

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

export const StyledIndexSidebarLabel = styled.span<{ theme: Theme }>\`
  display: inline-flex;
  align-items: center;
  gap: \${DOT_GUTTER - LABEL_ICON}px;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 20px;
  font-weight: 500;
  color: \${({ theme }) => theme.colors.dark};

  &::before {
    content: "";
    width: \${LABEL_ICON}px;
    height: \${LABEL_ICON}px;
    background: currentColor;
    -webkit-mask: \${listIcon} center / contain no-repeat;
    mask: \${listIcon} center / contain no-repeat;
  }
\`;

export const StyledIndexSidebarLi = styled.li<{
  theme: Theme;
  $isActive: boolean;
}>\`
  &::before {
    content: "";
    display: block;
    position: absolute;
    /* Centered under the label icon and on the entry's first line. */
    left: \${(LABEL_ICON - 5) / 2}px;
    top: 13.5px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: transparent;
    transition: background-color 0.2s ease;
  }

  \${({ $isActive, theme }) =>
    $isActive &&
    css\`
      &::before {
        background: \${theme.colors.accent};
      }
    \`}
\`;

export const StyledIndexSidebarLink = styled.a<{
  theme: Theme;
  $isActive: boolean;
}>\`
  display: block;
  margin-left: \${DOT_GUTTER}px;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 24px;
  color: \${({ theme, $isActive }) =>
    $isActive ? theme.colors.accent : theme.colors.grayDark};
  font-weight: \${({ $isActive }) => ($isActive ? "500" : "400")};
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: \${({ theme, $isActive }) =>
      $isActive ? theme.colors.accent : theme.colors.dark};
  }
\`;
`;
