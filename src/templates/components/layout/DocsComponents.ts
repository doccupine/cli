export const docsComponentsTemplate = `"use client";
import { mq, Theme } from "@/app/theme";
import {
  resetButton,
  styledSmall,
  styledStrong,
  styledText,
} from "cherry-styled-components/src/lib";
import Link from "next/link";
import { rgba } from "polished";
import React from "react";
import styled, { css } from "styled-components";
import { interactiveStyles } from "./SharedStyled";

interface DocsProps {
  children: React.ReactNode;
}

const StyledDocsWrapper = styled.div<{ theme: Theme }>\`
  position: relative;
\`;

const StyledDocsSidebar = styled.div<{ theme: Theme }>\`
  clear: both;
\`;

const StyledDocsContainer = styled.div<{ theme: Theme }>\`
  position: relative;
  padding: 0;
  width: 100%;
  \${({ theme }) => styledText(theme)};

  \${mq("lg")} {
    padding-left: 320px;
    padding-right: 320px;
  }

  & p {
    color: \${({ theme }) => theme.colors.grayDark};
  }

  & pre {
    max-width: 100%;
  }

  & ul {
    list-style: none;
    padding: 0;
    margin: 0;

    & li {
      text-indent: 0;
      display: block;
      position: relative;
      padding: 0 0 0 15px;
      margin: 0;
      \${({ theme }) => styledText(theme)};
      min-height: 23px;

      $mq: "lg" {
        min-height: 27px;
      }

      &::before {
        content: "";
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: \${({ theme }) => theme.colors.primary};
        position: absolute;
        top: 8px;
        left: 2px;

        \${mq("lg")} {
          top: 10px;
        }
      }
    }
  }

  & ol {
    padding: 0;
    margin: 0;

    & > li {
      position: relative;
      padding: 0;
      counter-increment: item;
      margin: 0;
      \${({ theme }) => styledText(theme)};

      &::before {
        content: counter(item) ".";
        display: inline-block;
        margin: 0 4px 0 0;
        font-weight: 700;
        color: \${({ theme }) => theme.colors.primary};
        min-width: max-content;
      }
    }
  }
\`;

export const StyledMarkdownContainer = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-wrap: wrap;
  flex: 1;
  max-width: 640px;
  margin: auto;

  \${mq("lg")} {
    padding-bottom: 110px;
  }
\`;

interface Props {
  theme?: Theme;
  $isActive?: boolean;
}

export const StyledSidebar = styled.nav<Props>\`
  position: fixed;
  overflow-y: auto;
  max-height: calc(100svh - 70px);
  width: 100%;
  z-index: 99;
  top: 70px;
  height: 100%;
  padding: 20px;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  transform: translateY(30px);
  left: 0;
  background: \${({ theme }) => theme.colors.light};

  \${mq("lg")} {
    max-height: 100svh;
    width: 220px;
    background: transparent;
    padding: 90px 40px 40px;
    opacity: 1;
    pointer-events: all;
    transform: translateY(0);
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.1)};
    top: 0;
    width: 320px;
  }

  \${({ $isActive }) =>
    $isActive &&
    css\`
      transform: translateY(0);
      opacity: 1;
      pointer-events: all;
    \`}
\`;

export const StyledIndexSidebar = styled.ul<{ theme: Theme }>\`
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  overflow-y: auto;
  z-index: 1;
  padding: 40px;
  background: \${({ theme }) => theme.colors.light};
  border-left: solid 1px \${({ theme }) => theme.colors.grayLight};

  \${mq("lg")} {
    display: block;
  }

  & li {
    padding: 5px 0;
  }
\`;

export const StyledIndexSidebarLabel = styled.span<{ theme: Theme }>\`
  \${({ theme }) => styledSmall(theme)};
  color: \${({ theme }) => theme.colors.grayDark};
\`;

export const StyledIndexSidebarLink = styled.a<{
  theme: Theme;
  $isActive: boolean;
}>\`
  \${({ theme }) => styledText(theme)};
  color: \${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary : theme.colors.dark};
  font-weight: \${({ $isActive }) => ($isActive ? "600" : "400")};
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    color: \${({ theme }) => theme.colors.primaryDark};
  }
\`;

export const StyledSidebarList = styled.ul\`
  list-style: none;
  margin: 0;
  padding: 0;
\`;

export const StyledStrong = styled.strong<{ theme: Theme }>\`
  font-weight: 600;
  \${({ theme }) => styledStrong(theme)};
\`;

export const StyledSidebarListItem = styled.li\`
  display: flex;
  gap: 10px;
  clear: both;
\`;

export const StyledSidebarListItemLink = styled(Link)<Props>\`
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.strong.xs};
  line-height: 1.6;
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.grayDark : theme.colors.primary};
  padding: 5px 0 5px 20px;
  display: flex;
  transition: all 0.3s ease;
  border-left: solid 1px \${({ theme }) => theme.colors.grayLight};

  \${mq("lg")} {
    font-size: \${({ theme }) => theme.fontSizes.strong.lg};
  }

  @media (hover: hover) {
    &:hover {
      color: \${({ theme }) =>
        theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
      border-color: \${({ theme }) => theme.colors.info};
    }
  }

  \${({ $isActive, theme }) =>
    $isActive &&
    \`
			color: \${theme.colors.dark};
			border-color: \${theme.colors.info};
			font-weight: 600;
	\`};
\`;

export const StyleMobileBar = styled.button<Props>\`
  \${resetButton};
  position: fixed;
  z-index: 1000;
  bottom: 0;
  right: 20px;
  font-size: \${({ theme }) => theme.fontSizes.strong.lg};
  line-height: \${({ theme }) => theme.fontSizes.strong.lg};
  box-shadow: \${({ theme }) => theme.shadows.sm};
  background: \${({ theme }) =>
    theme.isDark
      ? rgba(theme.colors.grayLight, 0.7)
      : rgba(theme.colors.light, 0.7)};
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.dark : theme.colors.primary};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 30px;
  border-radius: 100px;
  margin: 0 0 20px 0;
  font-weight: 600;
  display: flex;
  justify-content: flex-start;
  width: auto;

  \${mq("lg")} {
    display: none;
  }

  \${({ $isActive }) => $isActive && \`position: fixed; \`};
\`;

export const StyledMobileBurger = styled.span<Props>\`
  display: block;
  margin: auto 0;
  width: 18px;
  height: 18px;
  position: relative;
  overflow: hidden;
  background: transparent;
  position: relative;

  &::before,
  &::after {
    content: "";
    display: block;
    position: absolute;
    width: 18px;
    height: 3px;
    border-radius: 3px;
    background: \${({ theme }) =>
      theme.isDark ? theme.colors.dark : theme.colors.primary};
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

export const StyledInlineButton = styled.button<{ theme: Theme }>\`
  \${resetButton};
  \${interactiveStyles};
  color: \${({ theme }) => theme.colors.primary};
  vertical-align: middle;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  margin: auto 0;
  transition: all 0.3s ease;

  @media (hover: hover) {
    &:hover {
      color: \${({ theme }) => theme.colors.light};
      background: \${({ theme }) => theme.colors.primary};
      border-color: \${({ theme }) => theme.colors.primary};
    }
  }

  & svg {
    vertical-align: middle;
    width: 12px;
    height: 12px;
    margin: auto;
  }
\`;

export const StyledPlusButton = styled.button<{ theme: Theme }>\`
  \${resetButton};
  color: \${({ theme }) => theme.colors.primary};
  vertical-align: middle;
  padding: 0;
  width: 100%;
  height: 18px;
  display: flex;
  margin: auto 0;
  transition: all 0.3s ease;
  position: relative;
  margin: 20px 0 0 0;

  &::before {
    content: "";
    display: block;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 100%;
    height: 1px;
    border-radius: 3px;
    background: \${({ theme }) => theme.colors.grayLight};
    transition: all 0.3s ease;
    z-index: -1;
  }

  &::after {
    content: "";
    display: block;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 18px;
    height: 18px;
    border: solid 1px \${({ theme }) => theme.colors.grayLight};
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    background: \${({ theme }) => theme.colors.light};
    transition: all 0.3s ease;
    z-index: -1;
  }

  box-shadow: 0 0 0 0px \${({ theme }) => theme.colors.primary};

  @media (hover: hover) {
    &:hover {
      &::after {
        border-color: \${({ theme }) => theme.colors.primary};
      }
    }
  }

  &:focus {
    &::after {
      border-color: \${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 4px \${({ theme }) => theme.colors.primaryLight};
    }
  }

  &:active {
    &::after {
      box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
    }
  }

  @media (hover: hover) {
    &:hover {
      color: \${({ theme }) => theme.colors.light};

      &::after {
        background: \${({ theme }) => theme.colors.primary};
        border-color: \${({ theme }) => theme.colors.primary};
      }
    }
  }

  & svg {
    vertical-align: middle;
    width: 14px;
    height: 14px;
    margin: auto;
  }
\`;

export const StyledFullHeightInput = styled.div\`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;

  & > span {
    height: 100%;
    width: 100%;
  }

  & textarea {
    height: 100%;
  }
\`;

export const StyledEditorWrapper = styled.div\`
  flex: 1;

  &:empty {
    display: none;
  }
\`;

function DocsWrapper({ children }: DocsProps) {
  return <StyledDocsWrapper>{children}</StyledDocsWrapper>;
}

function DocsSidebar({ children }: DocsProps) {
  return <StyledDocsSidebar>{children}</StyledDocsSidebar>;
}

function DocsContainer({ children }: DocsProps) {
  return <StyledDocsContainer>{children}</StyledDocsContainer>;
}

export { DocsWrapper, DocsSidebar, DocsContainer };
`;
