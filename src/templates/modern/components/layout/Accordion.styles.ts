export const modernAccordionStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { Theme } from "@/app/theme";

// Hairline rows: each accordion is a title row between two rules, and
// consecutive accordions share the rule between them (the article's 20px
// block gap is pulled back, plus the 1px rule).
export const StyledAccordion = styled.div<{ theme: Theme }>\`
  border-top: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  margin: 0;
  width: 100%;

  & + & {
    margin-top: -21px;
  }
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
  padding: 14px 32px 14px 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: \${({ theme }) => theme.colors.dark};
  transition: color 0.2s ease;
  position: relative;

  &:hover {
    color: \${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: none;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }

  & .lucide-chevron-down {
    position: absolute;
    top: 50%;
    right: 4px;
    width: 16px;
    height: 16px;
    color: \${({ theme }) => theme.colors.grayDark};
    transform: translateY(-50%);
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
  height: 0;
  overflow: clip;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-wrap: wrap;
  flex: 1;

  \${({ $isOpen }) =>
    $isOpen &&
    css\`
      padding: 0 0 16px;
      height: auto;
    \`}

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
\`;
`;
