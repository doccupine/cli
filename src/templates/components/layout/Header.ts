export const headerTemplate = `"use client";
import React from "react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import Link from "next/link";
import { mq, Theme } from "@/app/theme";
import { ChatLauncher, useOnClickOutside } from "cherry-styled-components";
import { Search } from "lucide-react";
import { Logo } from "@/components/layout/Pictograms";
import { ChatContext } from "@/components/Chat";
import {
  SearchContext,
  SearchKbd,
  StyledSearchButton,
} from "@/components/SearchDocs";
import themeJson from "@/theme.json";

const customThemeJson = themeJson as typeof themeJson & {
  logo?: { dark: string; light: string };
};

const StyledHeader = styled.header<{
  theme: Theme;
  $hasChildren: boolean;
  $pinned: boolean;
}>\`
  /* In normal flow at the top of the page, fixed only once the page scrolls.
     iOS Safari refuses to color its toolbar from the theme-color meta while
     a sticky or fixed element touches the top edge - whatever that element's
     background (transparent, frosted, or opaque; the Doccupine platform
     site's header is position: relative on its app pages for the same
     reason). At scroll position zero an in-flow header occupies exactly the
     place a sticky one would, so the swap is invisible; while scrolled, the
     toolbar is collapsed anyway. StyledHeaderShell holds the header's
     measured height while it is fixed, so pinning never shifts the page. */
  position: relative;
  top: 0;
  margin: 0;
  z-index: 1000;
  width: 100%;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};

  \${({ $pinned }) =>
    $pinned &&
    css\`
      position: fixed;
      left: 0;
    \`}

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
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 5%, transparent)\`};
    z-index: -1;
  }

  & .logo {
    display: flex;
    min-width: max-content;

    & svg,
    & img {
      margin: auto;
      height: auto;
      width: fit-content;
      min-width: fit-content;
      max-width: 182px;
      max-height: 30px;

      & [fill]:not(.ignore-fill) {
        fill: \${({ theme }) => theme.colors.primary};
      }
    }
  }
\`;

/**
 * In-flow placeholder that owns the header's space. While the header is
 * pinned (position: fixed, out of flow), the shell keeps the header's
 * measured height so pinning never shifts the page; at the top of the page
 * it collapses to its content.
 */
const StyledHeaderShell = styled.div<{ $pinned: boolean; $height: number }>\`
  \${({ $pinned, $height }) =>
    $pinned &&
    $height > 0 &&
    css\`
      height: \${$height}px;
    \`}
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
  const [isPinned, setIsPinned] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height);
      }
      setIsPinned(window.scrollY > 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

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
    <StyledHeaderShell $pinned={isPinned} $height={headerHeight}>
      <StyledHeader
        $hasChildren={children ? true : false}
        $pinned={isPinned}
        id="header"
        ref={headerRef}
      >
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
            {isChatActive && <ChatLauncher $glow />}
          </StyledLeftWrapper>
        </StyledHeaderInner>
      </StyledHeader>
    </StyledHeaderShell>
  );
}

export { Header };
`;
