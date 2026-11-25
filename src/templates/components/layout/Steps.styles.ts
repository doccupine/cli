// Look of <Steps>.
export const stepsStylesTemplate = `"use client";
import styled from "styled-components";
import { styledText } from "cherry-styled-components";
import { Theme } from "@/app/theme";

export const StyledStepsContainer = styled.div<{ theme: Theme }>\`
  position: relative;
  width: 100%;
\`;

export const StyledStep = styled.div<{ theme: Theme }>\`
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 0 0 20px 52px;
  margin: 0;
  position: relative;
  \${({ theme }) => styledText(theme)}
  color: \${({ theme }) => theme.colors.grayDark};

  &::after {
    content: "";
    position: absolute;
    left: 16px;
    top: 0;
    width: 1px;
    height: 100%;
    background: \${({ theme }) => theme.colors.primary};
    background: linear-gradient(
      180deg,
      \${({ theme }) => theme.colors.primary},
      transparent
    );
    border-radius: 4px;
  }
\`;

export const StepNumber = styled.div<{ theme: Theme }>\`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: \${({ theme }) => theme.colors.primary};
  color: \${({ theme }) => theme.colors.light};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 12px;
  \${({ theme }) => styledText(theme)};
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
\`;

export const StyledStepTitle = styled.div<{ theme: Theme }>\`
  margin: 0 0 10px 0;
  padding: 2px 0 0 0;
  color: \${({ theme }) => theme.colors.dark};
  \${({ theme }) => styledText(theme)};
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;

  /* See Card: lucide's color prop lands on an SVG presentation attribute,
     where a CSS custom property would not resolve. */
  & > svg.lucide {
    color: \${({ theme }) => theme.colors.primary};
  }
\`;

export const StepContent = styled.div<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.grayDark};
  \${({ theme }) => styledText(theme)};

  & > .code-wrapper {
    margin: 10px 0;
  }
\`;
`;
