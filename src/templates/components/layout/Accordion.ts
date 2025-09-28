export const accordionTemplate = `"use client";
import { useState } from "react";
import styled, { css } from "styled-components";
import { styledText, Theme } from "cherry-styled-components/src/lib";
import { Icon } from "@/components/layout/Icon";

const StyledAccordion = styled.div<{ theme: Theme }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  margin: 0;
  \${({ theme }) => styledText(theme)}

  &:root {
    interpolate-size: allow-keywords;
  }
\`;

const StyledAccordionTitle = styled.h3<{ theme: Theme; $isOpen: boolean }>\`
  cursor: pointer;
  margin: 0;
  padding: 0 40px 0 0;
  \${({ theme }) => styledText(theme)};
  color: \${({ theme }) => theme.colors.primary};
  transition: color 0.3s ease;
  position: relative;

  @media (hover: hover) {
    &:hover {
      color: \${({ theme }) => theme.colors.primaryDark};
    }
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

const StyledAccordionContent = styled.div<{ theme: Theme; $isOpen: boolean }>\`
  \${({ theme }) => styledText(theme)};
  color: \${({ theme }) => theme.colors.grayDark};
  height: 0;
  overflow: clip;
  transition: all 0.3s ease;

  \${({ $isOpen }) =>
    $isOpen &&
    css\`
      margin: 20px 0 0;
      height: auto;
    \`}
\`;

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
}

function Accordion({ children, title }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <StyledAccordion>
      <StyledAccordionTitle onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
        {title} <Icon name="ChevronDown" />
      </StyledAccordionTitle>
      <StyledAccordionContent $isOpen={isOpen}>
        {children}
      </StyledAccordionContent>
    </StyledAccordion>
  );
}

export { Accordion };
`;
