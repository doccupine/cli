export const modernCardStylesTemplate = `"use client";
import Link from "next/link";
import styled, { css } from "styled-components";
import { Theme } from "@/app/theme";

// Hairline cards with a generous radius. Linked cards answer hover with a
// soft fill and a firmer border.
export const cardStyles = css<{ theme: Theme }>\`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => \`calc(\${theme.spacing.radius.lg} + 4px)\`};
  padding: 20px;
  margin: 0;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 1.7;
  color: \${({ theme }) => theme.colors.grayDark};

  /* Tints the optional leading icon. Set here rather than through lucide's
     color prop, because that becomes an SVG presentation attribute and CSS
     custom properties do not resolve in those. */
  & > svg.lucide {
    width: 20px;
    height: 20px;
    margin-bottom: 4px;
    color: \${({ theme }) => theme.colors.accent};
  }

  /* Doubled to outrank the article's own paragraph color. */
  && p {
    color: \${({ theme }) => theme.colors.grayDark};
  }
\`;

export const StyledCard = styled.div<{ theme: Theme }>\`
  \${cardStyles}
\`;

export const StyledCardLink = styled(Link)<{ theme: Theme }>\`
  \${cardStyles}
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    border-color: \${({ theme }) => theme.colors.gray};
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 3%, transparent)\`};
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

export const StyledCardTitle = styled.p<{ theme: Theme }>\`
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 600;

  /* Outranks the card's own paragraph rule above. */
  &&& {
    color: \${({ theme }) => theme.colors.dark};
  }
\`;
`;
