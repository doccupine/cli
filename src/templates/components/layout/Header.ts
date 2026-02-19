export const headerTemplate = `"use client";
import React from "react";
import { useCallback, useRef, useState, Suspense } from "react";
import styled, { useTheme } from "styled-components";
import Link from "next/link";
import { rgba } from "polished";
import { mq, Theme } from "@/app/theme";
import {
  ToggleTheme,
  ToggleThemeLoading,
} from "@/components/layout/ThemeToggle";
import { useOnClickOutside } from "@/components/ClickOutside";
import { Logo } from "@/components/layout/Pictograms";
import themeJson from "@/theme.json";

const customThemeJson = themeJson as typeof themeJson & {
  logo?: { dark: string; light: string };
};

const StyledHeader = styled.header<{ theme: Theme }>\`
  position: sticky;
  top: 0;
  margin: 0;
  z-index: 1000;
  width: 100%;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};

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
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.05)};
    z-index: -1;
  }

  & .logo {
    display: flex;

    & svg,
    & img {
      margin: auto;
      width: fit-content;
      height: auto;
      max-width: 182px;
      max-height: 30px;

      & path[fill] {
        fill: \${({ theme }) => theme.colors.primary};
      }
    }
  }
\`;

const StyledHeaderInner = styled.div\`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 20px 0 0 20px;

  \${mq("md")} {
    flex-wrap: nowrap;
    padding: 0 20px;
  }
\`;

const StyledThemeWrapper = styled.div\`
  display: block;
  min-width: fit-content;
  padding-right: 20px;

  \${mq("md")} {
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
  const theme = useTheme() as Theme;

  return (
    <StyledHeader>
      <StyledHeaderInner>
        <Link href="/" className="logo" aria-label="Logo">
          {customThemeJson.logo ? (
            theme.isDark ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customThemeJson.logo.dark}
                alt="Logo"
                width="100"
                height="100"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customThemeJson.logo.light}
                alt="Logo"
                width="100"
                height="100"
              />
            )
          ) : (
            <Logo />
          )}
        </Link>
        {children}
        <StyledThemeWrapper>
          <Suspense fallback={<ToggleThemeLoading />}>
            <ToggleTheme />
          </Suspense>
        </StyledThemeWrapper>
      </StyledHeaderInner>
    </StyledHeader>
  );
}

export { Header };
`;
