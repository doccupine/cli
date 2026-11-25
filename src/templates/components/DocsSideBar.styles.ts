// Look of the "On this page" rail (DocsSideBar.tsx). The scroll-spy and
// smooth scrolling stay in DocsSideBar.tsx.
export const docsSideBarStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { styledSmall } from "cherry-styled-components";
import { mq, Theme } from "@/app/theme";
import { focusModeHide } from "@/components/layout/SharedStyled";
import { RAIL_TOP_OFFSET, TOC_WIDTH } from "@/components/layout/designTokens";

export const StyledIndexSidebar = styled.ul<{ theme: Theme }>\`
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
  position: fixed;
  top: 0;
  right: 0;
  width: \${TOC_WIDTH}px;
  height: 100dvh;
  overflow-y: auto;
  z-index: 1;
  padding: \${RAIL_TOP_OFFSET}px 20px 20px 20px;
  background: \${({ theme }) => theme.colors.light};
  border-left: solid 1px \${({ theme }) => theme.colors.grayLight};
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  \${mq("lg")} {
    display: block;
  }

  & li {
    padding: 5px 0;
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
  \${({ theme }) => styledSmall(theme)};
  color: \${({ theme }) => theme.colors.grayDark};
\`;

export const StyledIndexSidebarLi = styled.li<{
  theme: Theme;
  $isActive: boolean;
}>\`
  &::before {
    content: "";
    display: block;
    position: absolute;
    left: 0;
    height: 20px;
    width: 1px;
    background: transparent;
    transition: all 0.3s ease;
  }

  \${({ $isActive, theme }) =>
    $isActive &&
    css\`
      &::before {
        background: \${theme.colors.primary};
      }
    \`}
\`;

export const StyledIndexSidebarLink = styled.a<{
  theme: Theme;
  $isActive: boolean;
}>\`
  \${({ theme }) => styledSmall(theme)};
  color: \${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary : theme.colors.dark};
  font-weight: \${({ $isActive }) => ($isActive ? "600" : "400")};
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    color: \${({ theme }) => theme.colors.primary};
  }
\`;
`;
