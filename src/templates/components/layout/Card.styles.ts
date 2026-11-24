// Look of <Card>, plain and linked.
export const cardStylesTemplate = `"use client";
import Link from "next/link";
import styled, { css } from "styled-components";
import { styledText } from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { interactiveStyles } from "@/components/layout/SharedStyled";

export const cardStyles = css<{ theme: Theme }>\`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: \${({ theme }) => theme.colors.light};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  padding: 20px;
  margin: 0;
  \${({ theme }) => styledText(theme)}
  color: \${({ theme }) => theme.colors.grayDark};

  /* Tints the optional leading icon. Set here rather than through lucide's
     color prop, because that becomes an SVG presentation attribute and CSS
     custom properties do not resolve in those. */
  & > svg.lucide {
    color: \${({ theme }) => theme.colors.primary};
  }
\`;

export const StyledCard = styled.div<{ theme: Theme }>\`
  \${cardStyles}
\`;

export const StyledCardLink = styled(Link)<{ theme: Theme }>\`
  \${interactiveStyles};
  \${cardStyles}
  text-decoration: none;
\`;

export const StyledCardTitle = styled.p<{ theme: Theme }>\`
  font-weight: bold;
  margin: 0;
  color: \${({ theme }) => theme.colors.dark};
  \${({ theme }) => styledText(theme)};
\`;
`;
