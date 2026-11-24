// Look of <Accordion>. Open state and ARIA wiring stay in Accordion.tsx.
export const accordionStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { styledText } from "cherry-styled-components";
import { Theme } from "@/app/theme";

export const StyledAccordion = styled.div<{ theme: Theme }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  margin: 0;
  \${({ theme }) => styledText(theme)};
  width: 100%;
\`;

export const StyledAccordionTitle = styled.button<{
  theme: Theme;
  $isOpen: boolean;
}>\`
  appearance: none;
  display: block;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  font: inherit;
  cursor: pointer;
  margin: 0;
  padding: 0 40px 0 0;
  \${({ theme }) => styledText(theme)};
  font-weight: 700;
  color: \${({ theme }) => theme.colors.primary};
  transition: color 0.3s ease;
  position: relative;

  &:hover {
    color: \${({ theme }) => theme.colors.primaryDark};
  }

  &:focus-visible {
    outline: none;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }

  & .lucide-chevron-down {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 0;
    transition: transform 0.3s ease;

    \${({ $isOpen }) =>
      $isOpen &&
      css\`
        transform: translateY(-50%) rotate(180deg);
      \`}
  }
\`;

export const StyledAccordionContent = styled.div<{
  theme: Theme;
  $isOpen: boolean;
}>\`
  \${({ theme }) => styledText(theme)};
  color: \${({ theme }) => theme.colors.grayDark};
  height: 0;
  overflow: clip;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-wrap: wrap;
  flex: 1;

  \${({ $isOpen }) =>
    $isOpen &&
    css\`
      margin: 20px 0 0;
      height: auto;
    \`}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
\`;
`;
