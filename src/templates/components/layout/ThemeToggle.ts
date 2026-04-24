export const themeToggleTemplate = `"use client";
import { resetButton } from "cherry-styled-components";
import styled, { css } from "styled-components";
import { Theme } from "@/app/theme";
import { Icon } from "@/components/layout/Icon";
import { useThemeOverride } from "@/components/layout/ClientThemeProvider";

const StyledThemeToggle = styled.button<{ theme: Theme; $hidden?: boolean }>\`
  \${resetButton}
  width: 59px;
  height: 32px;
  border-radius: 30px;
  display: flex;
  position: relative;
  margin: auto 0;
  transform: scale(1);
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: \${({ theme }) => \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
    transition: all 0.3s ease;
    z-index: 1;
  }

  /* Knob position depends on the active mode, signaled by the "dark" class
     on <html>. Pure CSS — no JS conditional needed for the visual swap. */
  :root.dark &::after {
    transform: translateX(27px);
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

  & .lucide-moon-star {
    transform: translateX(-1px);
  }

  & svg[stroke] {
    stroke: \${({ theme }) => theme.colors.primary};
  }

  &:hover {
    transform: scale(1.05);
    color: \${({ theme }) => theme.colors.accent};

    & svg[stroke] {
      stroke: \${({ theme }) => theme.colors.accent};
    }
  }

  &:active {
    transform: scale(0.97);
  }
\`;

function ToggleTheme({ $hidden }: { $hidden?: boolean }) {
  const { mode, setMode } = useThemeOverride();

  return (
    <StyledThemeToggle
      onClick={async () => {
        const next = mode === "dark" ? "light" : "dark";
        setMode(next);
        await fetch("/api/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: next }),
        }).catch((err) => console.error("Failed to persist theme:", err));
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
