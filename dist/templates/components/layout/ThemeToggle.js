export const themeToggleTemplate = `"use client";
import { Theme, resetButton } from "cherry-styled-components/src/lib";
import styled, { css, useTheme } from "styled-components";
import { rgba } from "polished";
import { Icon } from "@/components/layout/Icon";
import { theme as themeLight, themeDark } from "@/app/theme";
import { useThemeOverride } from "@/components/layout/ClientThemeProvider";

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
    background: \${({ theme }) => rgba(theme.colors.primaryLight, 0.2)};
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

  & .lucide-sun {
    transform: translateX(1px);
  }

  & svg[stroke] {
    stroke: \${({ theme }) => theme.colors.primary};
  }

  &:hover {
    transform: scale(1.05);
    color: \${({ theme }) =>
      theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};

   & svg[stroke] {
      stroke: \${({ theme }) =>
        theme.isDark ? theme.colors.primaryLight : theme.colors.primaryDark};
    }
  }

  &:active {
    transform: scale(0.97);
  }
\`;

function ToggleTheme({ $hidden }: { $hidden?: boolean }) {
  const { setTheme } = useThemeOverride();
  const theme = useTheme() as Theme;

  return (
    <StyledThemeToggle
      onClick={async () => {
        const nextTheme = theme.isDark ? "light" : "dark";
        setTheme(nextTheme === "light" ? themeLight : themeDark);
        await fetch("/api/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: nextTheme }),
        });
      }}
      $hidden={$hidden}
      aria-label="Toggle Theme"
    >
      <Icon name="Sun" className="light" />
      <Icon name="MoonStar" className="dark" />
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
