// Look of <Tabs>. Tab selection and keyboard handling stay in Tabs.tsx.
export const tabsStylesTemplate = `"use client";
import { Theme } from "@/app/theme";
import { Button, resetButton, styledText } from "cherry-styled-components";
import styled, { css } from "styled-components";
import { thinScrollbar } from "@/components/layout/SharedStyled";

export const TabsContainer = styled.div\`
  width: 100%;
  margin: 0 auto;
\`;

export const TabsList = styled.div<{ theme: Theme }>\`
  display: flex;
  overflow: hidden;
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background-color: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  overflow-x: auto;
  \${thinScrollbar};
\`;

export const TabButton = styled(Button)<{ theme: Theme; $isActive?: boolean }>\`
  \${resetButton};
  appearance: none;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 0;
  background: \${({ theme }) => theme.colors.light};
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
  min-width: fit-content;
  height: auto;
  min-height: 0;
  \${({ theme }) => styledText(theme)};
  color: \${({ theme }) => theme.colors.dark};
  font-weight: 600;
  position: relative;

  & svg {
    flex-shrink: 0;
  }

  \${({ theme, $isActive }) =>
    $isActive &&
    css\`
      color: \${theme.colors.primary};
      border-bottom-color: \${theme.colors.primary};
    \`}

  &:hover {
    \${({ theme, $isActive }) =>
      !$isActive &&
      css\`
        color: \${theme.colors.primary};
        background-color: color-mix(
          in srgb,
          \${theme.colors.primaryLight} 10%,
          transparent
        );
      \`}
  }

  &:focus-visible {
    outline: none;
    z-index: 1;
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }

  &:not(:last-child) {
    border-right: 1px solid \${({ theme }) => theme.colors.grayLight};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
\`;

export const TabPanel = styled.div<{ theme: Theme }>\`
  background-color: \${({ theme }) => theme.colors.light};
  padding: 20px;
  border-radius: 0 0 \${({ theme }) => theme.spacing.radius.lg}
    \${({ theme }) => theme.spacing.radius.lg};
  color: \${({ theme }) => theme.colors.grayDark};
  \${({ theme }) => styledText(theme)}
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-top: none;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-wrap: wrap;
  flex: 1;

  &[hidden] {
    display: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;
`;
