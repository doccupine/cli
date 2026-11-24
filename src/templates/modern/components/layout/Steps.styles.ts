export const modernStepsStylesTemplate = `"use client";
import styled from "styled-components";
import { Theme } from "@/app/theme";

// Small muted number circles joined by a thin rail.
const NUMBER_SIZE = 26;

export const StyledStepsContainer = styled.div<{ theme: Theme }>\`
  position: relative;
  width: 100%;
\`;

export const StyledStep = styled.div<{ theme: Theme }>\`
  padding: 0 0 28px \${NUMBER_SIZE + 16}px;
  margin: 0;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: \${NUMBER_SIZE / 2}px;
    top: \${NUMBER_SIZE + 6}px;
    bottom: 6px;
    width: 1px;
    background: \${({ theme }) => theme.colors.grayLight};
  }

  &:last-child {
    padding-bottom: 0;

    &::after {
      display: none;
    }
  }
\`;

export const StepNumber = styled.div<{ theme: Theme }>\`
  width: \${NUMBER_SIZE}px;
  height: \${NUMBER_SIZE}px;
  border-radius: 50%;
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.dark} 6%, transparent)\`};
  color: \${({ theme }) => theme.colors.grayDark};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: \${({ theme }) => theme.fontSizes.small.xs};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
\`;

export const StyledStepTitle = styled.div<{ theme: Theme }>\`
  margin: 0 0 6px;
  min-height: \${NUMBER_SIZE}px;
  color: \${({ theme }) => theme.colors.dark};
  font-size: 16px;
  line-height: \${NUMBER_SIZE}px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;

  /* See Card: lucide's color prop lands on an SVG presentation attribute,
     where a CSS custom property would not resolve. */
  & > svg.lucide {
    width: 16px;
    height: 16px;
    color: \${({ theme }) => theme.colors.grayDark};
  }
\`;

export const StepContent = styled.div<{ theme: Theme }>\`
  display: flex;
  flex-direction: column;
  gap: 12px;

  & > .code-wrapper {
    margin: 4px 0;
  }
\`;
`;
