export const headerTemplate = `"use client";
import {
  Flex,
  MaxWidth,
  resetButton,
  styledText,
} from "cherry-styled-components/src/lib";
import React, { 
  useCallback,
  useContext,
  useRef,
  useState,
  Suspense
} from "react";
import styled, { css } from "styled-components";
import Link from "next/link";
import { rgba } from "polished";
import { mq, Theme } from "@/app/theme";
import { ToggleTheme, ToggleThemeLoading } from "@/components/layout/ThemeToggle";
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

const StyledLink = styled(Link)<{ theme: Theme }>\`
  text-decoration: none;
  margin: auto 0;
  color: \${({ theme }) => theme.colors.primary};
  font-weight: 500;

  @media (hover: hover) {
    &:hover {
      color: \${({ theme }) => theme.colors.primaryDark};
    }
  }
\`;

export const StyledMobileBurger = styled.button<{
  theme: Theme;
  $isActive: boolean;
}>\`
  \${resetButton};
  display: block;
  margin: auto 0;
  width: 18px;
  height: 18px;
  position: relative;
  overflow: hidden;
  background: transparent;
  position: relative;

  \${mq("lg")} {
    display: none;
  }

  &::before,
  &::after {
    content: "";
    display: block;
    position: absolute;
    width: 18px;
    height: 2px;
    border-radius: 3px;
    background: \${({ theme }) => theme.colors.primary};
    transition: all 0.3s ease;
  }

  &::before {
    top: 4px;
  }

  &::after {
    bottom: 4px;
  }

  \${({ $isActive }) =>
    $isActive &&
    css\`
      &::before {
        transform: translateY(4px) rotate(45deg);
      }

      &::after {
        transform: translateY(-4px) rotate(-45deg);
      }
    \`};
\`;

const StyledMobileMenu = styled.ul<{ theme: Theme; $isActive: boolean }>\`
  list-style: none;
  padding: 70px 0 0 0;
  margin: 0;
  position: fixed;
  top: 0;
  left: 0;
  background: \${({ theme }) => theme.colors.light};
  pointer-events: none;
  opacity: 0;
  width: 100%;
  height: 100dvh;
  transition: all 0.3s ease;
  z-index: 800;
  transform: translateY(40px) scale(1.2);
  display: block;

  \${({ $isActive }) =>
    $isActive &&
    css\`
      pointer-events: all;
      opacity: 1;
      transform: translateY(0) scale(1);
    \`};

  & li {
    display: block;
    width: 100%;
    padding: 0;
    margin: 0;
    border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};

    &.languages {
      display: flex;
      justify-content: center;
      gap: 10px;
    }

    & a,
    & button {
      \${({ theme }) => styledText(theme)};
      font-family: \${({ theme }) => theme.fonts.text};
      font-weight: 500;
      appearance: none;
      background: transparent;
      border: none;
      color: \${({ theme }) => theme.colors.dark};
      display: flex;
      margin: 0;
      padding: 20px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
    }

    & button {
      flex: 1;
      border-right: solid 1px \${({ theme }) => theme.colors.grayLight};
      text-align: center;
      justify-content: center;

      &:last-of-type {
        border-right: none;
      }
    }
  }
\`;

const StyledMenu = styled.div<{ theme: Theme }>\`
  display: none;

  \${mq("lg")} {
    display: flex;
    gap: 20px;
  }
\`;

const StyledDivider = styled.div<{ theme: Theme }>\`
  width: 1px;
  height: calc(100% - 10px);
  margin: auto 0;
  background: \${({ theme }) => theme.colors.grayLight};
\`;

const StyledWrapper = styled.div<{ theme: Theme }>\`
  margin: auto 0;
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
            <StyledWrapper>
              <span ref={wrapperRef}>
                <Flex $gap={20} $wrap="wrap">
                  <StyledMenu>
                  <StyledLink href="https://doccupine.com" target="_blank">
                    Doccupine
                  </StyledLink>
                  </StyledMenu>
                  <Suspense fallback={<ToggleThemeLoading />}>
                    <ToggleTheme />
                  </Suspense>
                  <StyledMobileBurger
                    $isActive={isMobileMenuActive}
                    onClick={() => setIsMobileMenuActive(!isMobileMenuActive)}
                    aria-label="Burger Menu"
                  />
                </Flex>
              </span>
            </StyledWrapper>
          </Flex>
        </MaxWidth>
      </StyledHeader>
      <StyledMobileMenu $isActive={isMobileMenuActive}>
        <li onClick={() => setIsMobileMenuActive(false)}>
          <a href="https://doccupine.com" target="_blank">
            Doccupine
          </a>
        </li>
      </StyledMobileMenu>
    </>
  );
}

export { Header };
`;
