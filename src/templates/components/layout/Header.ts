export const headerTemplate = `"use client";
import React from "react";
import { useCallback, useContext, useRef, useState } from "react";
import styled, { css } from "styled-components";
import Link from "next/link";
import { mq, Theme } from "@/app/theme";
import { useOnClickOutside } from "@/components/ClickOutside";
import { Search } from "lucide-react";
import { Logo } from "@/components/layout/Pictograms";
import { ChatContext, ChatButtonCTA } from "@/components/Chat";
import {
  SearchContext,
  SearchKbd,
  StyledSearchButton,
} from "@/components/SearchDocs";
import themeJson from "@/theme.json";

const customThemeJson = themeJson as typeof themeJson & {
  logo?: { dark: string; light: string };
};

const StyledHeader = styled.header<{ theme: Theme; $hasChildren: boolean }>\`
  position: sticky;
  top: 0;
  margin: 0;
  z-index: 1000;
  width: 100%;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};

  \${({ $hasChildren }) =>
    !$hasChildren &&
    css\`
      \${mq("lg")} {
        padding-bottom: 16px;
        padding-top: 16px;
      }
    \`}

  &::before,
  &::after {
    display: block;
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: \${({ theme }) => theme.colors.light};
    z-index: -2;
  }

  &::after {
    background: \${({ theme }) => \`color-mix(in srgb, \${theme.colors.primaryLight} 5%, transparent)\`};
    z-index: -1;
  }

  & .logo {
    display: flex;

    & svg,
    & img {
      margin: auto;
      height: auto;
      width: fit-content;
      min-width: fit-content;
      max-width: 182px;
      max-height: 30px;

      & path[fill] {
        fill: \${({ theme }) => theme.colors.primary};
      }
    }
  }
\`;

const StyledHeaderInner = styled.div<{ $hasChildren: boolean }>\`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 16px 0 0 20px;

  \${({ $hasChildren }) =>
    !$hasChildren &&
    css\`
      padding-bottom: 16px;
    \`}

  \${mq("lg")} {
    flex-wrap: nowrap;
    padding: 0 20px;
  }
\`;

const StyledLeftWrapper = styled.div\`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: fit-content;
  padding-right: 20px;

  \${mq("lg")} {
    padding-right: 0;
  }
\`;

interface HeaderProps {
  children?: React.ReactNode;
}

function Header({ children }: HeaderProps) {
  const [isOptionActive, setIsOptionActive] = useState(false);
  const [isLangActive, setIsLangActive] = useState(false);

  const wrapperRef = useRef<HTMLSpanElement>(null);
  const elmRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLSpanElement>(null);
  const closeMenu = useCallback(() => {
    setIsOptionActive(false);
    setIsLangActive(false);
  }, []);

  useOnClickOutside(
    [elmRef, wrapperRef],
    isOptionActive ? closeMenu : () => {},
  );
  useOnClickOutside([langRef, wrapperRef], isLangActive ? closeMenu : () => {});
  const { isChatActive } = useContext(ChatContext);
  const { openSearch } = useContext(SearchContext);

  return (
    <StyledHeader $hasChildren={children ? true : false} id="header">
      <StyledHeaderInner $hasChildren={children ? true : false}>
        <Link href="/" className="logo" aria-label="Logo">
          {customThemeJson.logo ? (
            <>
              {/* Both logos render; .light-only and .dark-only classes in
                  GlobalStyles hide the inactive one based on the "dark" class
                  on <html>. Avoids a JS-driven swap so no flash on first load. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="light-only"
                src={customThemeJson.logo.light}
                alt="Logo"
                width="100"
                height="100"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="dark-only"
                src={customThemeJson.logo.dark}
                alt="Logo"
                width="100"
                height="100"
              />
            </>
          ) : (
            <Logo />
          )}
        </Link>
        {children}
        <StyledLeftWrapper>
          <StyledSearchButton onClick={openSearch} aria-label="Search docs">
            <Search size={14} />
            <SearchKbd>&#8984;K</SearchKbd>
          </StyledSearchButton>
          {isChatActive && <ChatButtonCTA />}
        </StyledLeftWrapper>
      </StyledHeaderInner>
    </StyledHeader>
  );
}

export { Header };
`;
