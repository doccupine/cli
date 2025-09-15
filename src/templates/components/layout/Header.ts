export const headerTemplate = `"use client";
import { Flex, MaxWidth, resetButton } from "cherry-styled-components/src/lib";
import React, { useCallback, useRef, useState, Suspense } from "react";
import styled, { css } from "styled-components";
import Link from "next/link";
import { rgba } from "polished";
import { mq, Theme } from "@/app/theme";
import { 
  ToggleTheme,
  ToggleThemeLoading
} from "@/components/layout/ThemeToggle";
import {
  StyledTinyDesktopOnly,
  StyledTinyMobileOnly,
} from "@/components/layout/SharedStyled";
import { useOnClickOutside } from "@/components/ClickOutside";
import { Logo } from "@/components/layout/Pictograms";

const StyledHeader = styled.header<{ theme: Theme }>\`
  position: sticky;
  top: 0;
  padding: 20px;
  margin: 0;
  z-index: 1000;

  \${mq("lg")} {
    width: 320px;
  }

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
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.1)};
    z-index: -1;
  }

  & .logo {
    display: flex;

    & svg {
      margin: auto;
    }
  }
\`;

function Header() {
  const [isOptionActive, setIsOptionActive] = useState(false);
  const [isLangActive, setIsLangActive] = useState(false);
  const [isMobileMenuActive, setIsMobileMenuActive] = useState(false);

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

  return (
    <>
      <StyledHeader>
        <MaxWidth $size={1000}>
          <Flex $justifyContent="space-between" $wrap="nowrap">
            <Link href="/" className="logo" aria-label="Logo">
              <StyledTinyDesktopOnly>
                <Logo />
              </StyledTinyDesktopOnly>
              <StyledTinyMobileOnly>
                <Logo />
              </StyledTinyMobileOnly>
            </Link>
            <Suspense fallback={<ToggleThemeLoading />}>
              <ToggleTheme />
            </Suspense>
          </Flex>
        </MaxWidth>
      </StyledHeader>
    </>
  );
}

export { Header };
`;
