export const accordionTemplate = `"use client";
import { useId, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import {
  StyledAccordion,
  StyledAccordionTitle,
  StyledAccordionContent,
} from "@/components/layout/Accordion.styles";

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
}

function Accordion({ children, title, defaultOpen = false }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();
  const titleId = useId();

  return (
    <StyledAccordion>
      <StyledAccordionTitle
        id={titleId}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        $isOpen={isOpen}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        {title} <Icon name="ChevronDown" />
      </StyledAccordionTitle>
      <StyledAccordionContent
        id={contentId}
        role="region"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        inert={!isOpen}
        $isOpen={isOpen}
      >
        {children}
      </StyledAccordionContent>
    </StyledAccordion>
  );
}

export { Accordion };
`;
