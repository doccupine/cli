export const modernTabsStylesTemplate = `"use client";
import { Theme } from "@/app/theme";
import { Button, resetButton } from "cherry-styled-components";
import styled, { css } from "styled-components";
import { thinScrollbar } from "@/components/layout/SharedStyled";

export const TabsContainer = styled.div\`
  width: 100%;
  margin: 0 auto;
\`;

// Underline tabs: text labels over a hairline, the active one underlined in
// the ink color. Scrolls sideways when the labels overflow.
export const TabsList = styled.div<{ theme: Theme }>\`
  display: flex;
  gap: 24px;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  overflow-x: auto;
  \${thinScrollbar};
\`;

export const TabButton = styled(Button)<{ theme: Theme; $isActive?: boolean }>\`
  \${resetButton};
  appearance: none;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 0;
  margin-bottom: -1px;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
  height: auto;
  min-height: 0;
  font-family: inherit;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 20px;
  font-weight: 500;
  color: \${({ theme }) => theme.colors.grayDark};
  position: relative;

  & svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }

  \${({ theme, $isActive }) =>
    $isActive &&
    css\`
      color: \${theme.colors.dark};
      border-bottom-color: \${theme.colors.dark};
    \`}

  /* Doubled to outrank Cherry Button's fill and rings on hover, focus and
     press; these tabs only change their text and underline. */
  &&:hover,
  &&:focus,
  &&:active {
    background: transparent;
    box-shadow: none;
  }

  &&:hover {
    color: \${({ theme }) => theme.colors.dark};
  }

  &&:focus-visible {
    outline: none;
    z-index: 1;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
\`;

export const TabPanel = styled.div<{ theme: Theme }>\`
  padding: 20px 0 0;
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
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;
`;
