export const themeToggleTemplate = `"use client";
import React, { useContext, useEffect, useState } from "react";
import { Theme, resetButton } from "cherry-styled-components/src/lib";
import styled, { css, useTheme } from "styled-components";
import { useSearchParams } from "next/navigation";
import { rgba } from "polished";
import { ThemeContext } from "@/components/layout/CherryThemeProvider";
import { theme as themeLight, themeDark } from "@/app/theme";
import { Icon } from "@/components/layout/Icon";

const StyledThemeToggle = styled.button<{ theme: Theme; $hidden?: boolean }>\`
  \${resetButton}
  width: 56px;
  height: 30px;
  border-radius: 30px;
  display: flex;
  position: relative;
  margin: auto 0;
  transform: scale(1);
  background: \${({ theme }) => theme.colors.light};

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.3)};
    transition: all 0.3s ease;
    z-index: 1;
    \${({ theme }) =>
      theme.isDark &&
      css\`
        transform: translateX(27px);
      \`}
  }

  \${({ $hidden }) =>
    $hidden &&
    css\`
      display: none;
    \`}

  & svg {
    width: 16px;
    height: 16px;
    object-fit: contain;
    margin: auto;
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
  }

  & svg[stroke] {
    stroke: \${({ theme }) => theme.colors.primary};
  }

  @media (hover: hover) {
    &:hover {
      transform: scale(1.05);
      color: \${({ theme }) =>
        theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
      Toggle & svg[stroke] {
        stroke: \${({ theme }) =>
          theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
      }
    }
  }

  &:active {
    transform: scale(0.97);
  }
\`;

function ToggleTheme({ $hidden }: { $hidden?: boolean }) {
  const theme = useTheme() as Theme;
  const { setTheme } = useContext(ThemeContext);
  const [isMounted, setIsMounted] = useState(false);

  const searchParams = useSearchParams();
  const themeParam = searchParams.get("theme");

  useEffect(() => {
    setIsMounted(true);
    if (themeParam === "light") {
      setTheme(themeLight);
      localStorage.theme = "light";
    } else if (themeParam === "dark") {
      setTheme(themeDark);
      localStorage.theme = "dark";
    }
  }, [themeParam, setTheme]);

  if (!isMounted) return null;

  return (
    <StyledThemeToggle
      onClick={() => {
        if (theme.isDark) {
          setTheme(themeLight);
          localStorage.theme = "light";
        } else {
          setTheme(themeDark);
          localStorage.theme = "dark";
        }
      }}
      $hidden={$hidden}
      aria-label="Toggle Theme"
    >
      <Icon name="MoonStar" className="dark" />
      <Icon name="Sun" className="light" />
    </StyledThemeToggle>
  );
}

function ToggleThemeLoading() {
  return (
    <StyledThemeToggle $hidden aria-label="Toggle Theme">
      <Icon name="MoonStar" className="dark" />
      <Icon name="Sun" className="light" />
    </StyledThemeToggle>
  );
}

export { ToggleTheme, ToggleThemeLoading };
`;
