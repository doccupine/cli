export const headerTemplate = `"use client";
import { Flex, MaxWidth } from "cherry-styled-components";
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
  position: fixed;
  top: 0;
  padding: 20px;
  margin: 0;
  z-index: 1000;
  width: 100%;

  \${mq("lg")} {
    width: 320px;
    border-right: solid 1px \${({ theme }) => theme.colors.grayLight};
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
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.05)};
    z-index: -1;
  }

  & .logo {
    display: flex;

    & svg,
    & img {
      margin: auto;
      width: 100%;
      max-width: max-content;
      height: auto;

      & path[fill] {
        fill: \${({ theme }) => theme.colors.primary};
      }
    }
  }
\`;

function Header() {
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
    <>
      <StyledHeader>
        <MaxWidth $size={1000}>
          <Flex $justifyContent="space-between" $wrap="nowrap">
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
