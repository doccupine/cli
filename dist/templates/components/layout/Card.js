export const cardTemplate = `"use client";
import styled, { useTheme } from "styled-components";
import { styledText, Theme } from "cherry-styled-components/src/lib";
import { Icon, IconProps } from "@/components/layout/Icon";

const StyledCard = styled.div<{ theme: Theme }>\`
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  margin: 20px 0;
  \${({ theme }) => styledText(theme)}
\`;

const StyledCardTitle = styled.h3<{ theme: Theme }>\`
  margin: 5px 0;
  \${({ theme }) => styledText(theme)};
\`;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title: string;
  icon?: IconProps;
}

function Card({ children, title, icon }: CardProps) {
  const theme = useTheme() as Theme;

  return (
    <StyledCard>
      {icon && <Icon name={icon} color={theme.colors.primary} />}
      <StyledCardTitle>{title}</StyledCardTitle>
      {children}
    </StyledCard>
  );
}

export { Card };
`;
