export const cardTemplate = `"use client";
import Link from "next/link";
import styled, { css, useTheme } from "styled-components";
import { styledText } from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { Icon, IconProps } from "@/components/layout/Icon";
import { interactiveStyles } from "@/components/layout/SharedStyled";

const cardStyles = css<{ theme: Theme }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  margin: 0;
  \${({ theme }) => styledText(theme)}
  color: \${({ theme }) => theme.colors.grayDark};
\`;

const StyledCard = styled.div<{ theme: Theme }>\`
  \${cardStyles}
\`;

const StyledCardLink = styled(Link)<{ theme: Theme }>\`
  \${interactiveStyles};
  \${cardStyles}
  text-decoration: none;
\`;

const StyledCardTitle = styled.p<{ theme: Theme }>\`
  font-weight: bold;
  margin: 5px 0;
  color: \${({ theme }) => theme.colors.dark};
  \${({ theme }) => styledText(theme)};
\`;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
  icon?: IconProps;
  href?: string;
}

function Card({ children, title, icon, href }: CardProps) {
  const theme = useTheme() as Theme;

  const content = (
    <>
      {icon && <Icon name={icon} color={theme.colors.primary} />}
      <StyledCardTitle>{title}</StyledCardTitle>
      {children}
    </>
  );

  if (href) {
    return <StyledCardLink href={href}>{content}</StyledCardLink>;
  }

  return <StyledCard>{content}</StyledCard>;
}

export { Card };
`;
