export const docsComponentsTemplate = `"use client";
import { darken, lighten, rgba } from "polished";
import React, { createContext, useContext } from "react";
import styled, { css } from "styled-components";
import {
  resetButton,
  styledSmall,
  styledStrong,
  styledText,
} from "cherry-styled-components";
import Link from "next/link";
import { mq, Theme } from "@/app/theme";
import { styledTable, stylesLists } from "@/components/layout/SharedStyled";
import { ChatContext } from "@/components/Chat";

export const SectionBarContext = createContext(false);

export function SectionBarProvider({
  hasSectionBar,
  children,
}: {
  hasSectionBar: boolean;
  children: React.ReactNode;
}) {
  return (
    <SectionBarContext.Provider value={hasSectionBar}>
      {children}
    </SectionBarContext.Provider>
  );
}

interface DocsProps {
  children: React.ReactNode;
}

const StyledDocsWrapper = styled.div<{ theme: Theme }>\`
  position: relative;
\`;

const StyledDocsSidebar = styled.div<{ theme: Theme }>\`
  clear: both;
\`;

const StyledDocsContainer = styled.div<{ theme: Theme; $isChatOpen?: boolean }>\`
  position: relative;
  padding: 20px 20px 100px 20px;
  width: 100%;
  \${({ theme }) => styledText(theme)};
  transition: all 0.3s ease;

  \${mq("lg")} {
    padding: 20px 340px 80px 340px;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 20px 440px 80px 340px;
      \`}
  }

  & p {
    color: \${({ theme }) => theme.colors.grayDark};
  }

  & pre {
    max-width: 100%;
  }

  \${stylesLists};
  \${styledTable};

  & img,
  & video,
  & iframe {
    max-width: 100%;
    border-radius: \${({ theme }) => theme.spacing.radius.lg};
  }

  & code:not([class]) {
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.2)};
    color: \${({ theme }) => theme.colors.dark};
    padding: 2px 4px;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    white-space: pre;
  }

  & .lucide {
    color: \${({ theme }) => theme.colors.primary};
  }

  & .aspect-video {
    aspect-ratio: 16 / 9;
    border-radius: \${({ theme }) => theme.spacing.radius.lg};
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
\`;

interface Props {
  theme?: Theme;
  $isActive?: boolean;
  $hasSectionBar?: boolean;
}

export const StyledSidebar = styled.nav<Props>\`
  position: fixed;
  overflow-y: auto;
  max-height: calc(
    100svh - \${({ $hasSectionBar }) => ($hasSectionBar ? 105 : 63)}px
  );
  width: 100%;
  z-index: 99;
  top: \${({ $hasSectionBar }) => ($hasSectionBar ? 105 : 63)}px;
  height: 100%;
  padding: 20px 20px 80px 20px;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  transform: translateY(30px);
  left: 0;
  background: \${({ theme }) => theme.colors.light};
  border-right: solid 1px \${({ theme }) => theme.colors.grayLight};
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  \${mq("lg")} {
    transition: none;
    max-height: calc(100svh - 62px);
    width: 220px;
    background: transparent;
    padding: 25px 40px 40px;
    opacity: 1;
    pointer-events: all;
    transform: translateY(0);
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.05)};
    top: 62px;
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
  top: 61px;
  right: 0;
  width: 320px;
  height: calc(100vh - 61px);
  overflow-y: auto;
  z-index: 1;
  padding: 27px 40px 40px;
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
\`;

export const StyledIndexSidebarLabel = styled.span<{ theme: Theme }>\`
  \${({ theme }) => styledSmall(theme)};
  color: \${({ theme }) => theme.colors.grayDark};
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
  color: \${({ theme }) =>
    theme.isDark
      ? lighten(0.1, theme.colors.primaryLight)
      : darken(0.1, theme.colors.primaryDark)};
\`;

export const StyledSidebarListItem = styled.li\`
  display: flex;
  gap: 10px;
  clear: both;
\`;

export const StyledSidebarListItemLink = styled(Link)<Props>\`
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 1.6;
  color: \${({ theme }) =>
    theme.isDark ? theme.colors.grayDark : theme.colors.primary};
  padding: 5px 0 5px 20px;
  display: flex;
  transition: all 0.3s ease;
  border-left: solid 1px \${({ theme }) => theme.colors.grayLight};

  &:hover {
    color: \${({ theme }) =>
      theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
    border-color: \${({ theme }) => theme.colors.primary};
  }

  \${({ $isActive, theme }) =>
    $isActive &&
    \`
			color: \${theme.isDark ? lighten(0.1, theme.colors.primaryLight) : darken(0.1, theme.colors.primaryDark)};
			border-color: \${theme.colors.primary};
			font-weight: 600;
	\`};
\`;

export const StyleMobileBar = styled.button<Props>\`
  \${resetButton};
  position: fixed;
  z-index: 999;
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
  padding: 20px;
  border-radius: 100px;
  margin: 0 0 20px 0;
  font-weight: 600;
  display: flex;
  justify-content: flex-start;
  width: auto;

  \${mq("lg")} {
    display: none;
  }

  \${({ $isActive }) => $isActive && \`position: fixed;\`};
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

interface DocsWrapperProps {
  children: React.ReactNode;
}

function DocsWrapper({ children }: DocsWrapperProps) {
  return <StyledDocsWrapper>{children}</StyledDocsWrapper>;
}

function DocsSidebar({ children }: DocsProps) {
  return <StyledDocsSidebar>{children}</StyledDocsSidebar>;
}

function DocsContainer({ children }: DocsProps) {
  const { isOpen } = useContext(ChatContext);

  return (
    <StyledDocsContainer $isChatOpen={isOpen}>{children}</StyledDocsContainer>
  );
}

export { DocsWrapper, DocsSidebar, DocsContainer, SectionBarContext, SectionBarProvider };
`;
