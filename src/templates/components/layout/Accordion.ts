export const accordionTemplate = `"use client";
import { useId, useState } from "react";
import styled, { css } from "styled-components";
import { styledText } from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { Icon } from "@/components/layout/Icon";

const StyledAccordion = styled.div<{ theme: Theme }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  margin: 0;
  \${({ theme }) => styledText(theme)};
  width: 100%;
\`;

const StyledAccordionTitle = styled.button<{ theme: Theme; $isOpen: boolean }>\`
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
\`;

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
}

function Accordion({ children, title }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <StyledAccordion>
      <StyledAccordionTitle
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        $isOpen={isOpen}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        {title} <Icon name="ChevronDown" />
      </StyledAccordionTitle>
      <StyledAccordionContent id={contentId} role="region" $isOpen={isOpen}>
        {children}
      </StyledAccordionContent>
    </StyledAccordion>
  );
}

export { Accordion };
`;
