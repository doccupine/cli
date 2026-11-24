export const headerTemplate = `"use client";
import React from "react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChatLauncher,
  Icon,
  useOnClickOutside,
} from "cherry-styled-components";
import { Search, Sparkles } from "lucide-react";
import { Logo } from "@/components/layout/Pictograms";
import { ChatContext } from "@/components/Chat";
import { useStrings } from "@/components/useStrings";
import {
  SearchContext,
  SearchKbd,
  StyledSearchButton,
} from "@/components/SearchDocs";
import themeJson from "@/theme.json";
import {
  StyledHeader,
  StyledHeaderShell,
  StyledHeaderInner,
  StyledLeftWrapper,
} from "@/components/layout/Header.styles";

const customThemeJson = themeJson as typeof themeJson & {
  logo?: { dark: string; light: string };
};

interface HeaderProps {
  children?: React.ReactNode;
}

function Header({ children }: HeaderProps) {
  const [isOptionActive, setIsOptionActive] = useState(false);
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
  const closeMenu = useCallback(() => {
    setIsOptionActive(false);
  }, []);

  useOnClickOutside(
    [elmRef, wrapperRef],
    isOptionActive ? closeMenu : () => {},
  );
  const { isChatActive } = useContext(ChatContext);
  const { openSearch } = useContext(SearchContext);
  const t = useStrings();

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
            <StyledSearchButton
              onClick={openSearch}
              aria-label={t.searchButton}
            >
              <Search size={14} />
              <SearchKbd>&#8984;K</SearchKbd>
            </StyledSearchButton>
            {isChatActive && (
              <ChatLauncher $glow aria-label={t.askAiAssistant}>
                <Icon icon={Sparkles} />
                <span>{t.askAi}</span>
              </ChatLauncher>
            )}
          </StyledLeftWrapper>
        </StyledHeaderInner>
      </StyledHeader>
    </StyledHeaderShell>
  );
}

export { Header };
`;
