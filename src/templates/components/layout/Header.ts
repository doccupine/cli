export const headerTemplate = `"use client";
import React from "react";
import { useContext, useEffect, useRef } from "react";
import Link from "next/link";
import { ChatLauncher } from "@/components/chat/ChatLauncher";
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

const customThemeJson = themeJson as typeof themeJson & {
  logo?: { dark: string; light: string };
};

interface HeaderProps {
  children?: React.ReactNode;
}

// The header sits in normal flow at the top of the page and turns fixed only
// once the page scrolls (data-pinned): iOS Safari refuses to color its
// toolbar from the theme-color meta while a sticky or fixed element touches
// the top edge. The shell around it keeps the header's measured height while
// it is pinned, so pinning never shifts the page. Styles: app/styles
// (.dcp-header).
//
// Pinning writes to the DOM inside the scroll handler instead of going
// through React state: scroll events run right before the frame paints,
// while a state update renders a frame or more later. On a fast scroll that
// gap let the in-flow header scroll off screen and snap back (a flash).
function Header({ children }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const header = headerRef.current;
      const shell = shellRef.current;
      if (!header || !shell) return;
      // Pinned once the header reaches the top: at once, or after a site
      // banner above it has scrolled away (the shell's offset).
      const pinned = window.scrollY > shell.offsetTop;
      if (pinned) {
        // Measure before pinning: fixed takes the header out of the flow.
        if (!header.hasAttribute("data-pinned")) {
          shell.style.setProperty(
            "--dcp-header-height",
            \`\${header.getBoundingClientRect().height}px\`,
          );
          header.setAttribute("data-pinned", "");
        }
      } else if (header.hasAttribute("data-pinned")) {
        header.removeAttribute("data-pinned");
        shell.style.removeProperty("--dcp-header-height");
      }
    };
    const onResize = () => {
      // The header's height can change with the width (wrapping, sections):
      // re-measure it in flow.
      headerRef.current?.removeAttribute("data-pinned");
      shellRef.current?.style.removeProperty("--dcp-header-height");
      onScroll();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const { isChatActive } = useContext(ChatContext);
  const { openSearch } = useContext(SearchContext);
  const t = useStrings();
  const hasSections = children ? true : undefined;

  return (
    <div className="dcp-header-shell" ref={shellRef}>
      <header
        className="dcp-header"
        data-sections={hasSections}
        id="header"
        ref={headerRef}
      >
        <div className="dcp-header__inner" data-sections={hasSections}>
          <Link href="/" className="logo" aria-label="Logo">
            {customThemeJson.logo ? (
              <>
                {/* Both logos render; the .light-only and .dark-only utility
                    classes hide the inactive one based on the "dark" class on
                    <html>. Avoids a JS-driven swap so no flash on first load. */}
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
          <div className="dcp-header__actions">
            <StyledSearchButton
              onClick={openSearch}
              aria-label={t.searchButton}
            >
              <Search size={14} />
              <SearchKbd>&#8984;K</SearchKbd>
            </StyledSearchButton>
            {isChatActive && (
              <ChatLauncher aria-label={t.askAiAssistant}>
                <Sparkles aria-hidden="true" />
                <span>{t.askAi}</span>
              </ChatLauncher>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export { Header };
`;
