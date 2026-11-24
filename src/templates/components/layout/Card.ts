export const cardTemplate = `"use client";
import { Icon, IconProps } from "@/components/layout/Icon";
import {
  StyledCard,
  StyledCardLink,
  StyledCardTitle,
} from "@/components/layout/Card.styles";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  icon?: IconProps;
  href?: string;
}

function Card({ children, title, icon, href }: CardProps) {
  const content = (
    <>
      {icon && <Icon name={icon} />}
      {title && <StyledCardTitle>{title}</StyledCardTitle>}
      {children}
    </>
  );

  if (href) {
    const isExternal = /^(https?:)?\\/\\//i.test(href);
    return (
      <StyledCardLink
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {content}
      </StyledCardLink>
    );
  }

  return <StyledCard>{content}</StyledCard>;
}

export { Card };
`;
