export const modernFooterStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { mq, Theme } from "@/app/theme";
import {
  focusModeColumn,
  sidePanelOffset,
} from "@/components/layout/SharedStyled";
import {
  CHAT_WIDTH,
  COLUMN_GUTTER,
  CONTENT_WIDTH,
  SIDEBAR_WIDTH,
  TOC_WIDTH,
} from "@/components/layout/designTokens";

export const StyledFooter = styled.footer<{
  theme: Theme;
  $isChatOpen?: boolean;
  $hasLinks?: boolean;
}>\`
  padding: 0 \${COLUMN_GUTTER}px;
  transition: all 0.3s ease;

  \${mq("lg")} {
    padding: 0 \${TOC_WIDTH + COLUMN_GUTTER}px 0
      \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 0 \${CHAT_WIDTH + COLUMN_GUTTER}px 0
          \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;
      \`}
  }

  \${sidePanelOffset};
  \${({ $isChatOpen }) => !$isChatOpen && focusModeColumn};
\`;

// One quiet row: the credit on the left, the GitHub mark on the right.
export const StyledFooterInner = styled.div<{ theme: Theme }>\`
  max-width: \${CONTENT_WIDTH}px;
  margin: 0 auto;
  padding: 16px 0 40px;
  color: \${({ theme }) => theme.colors.grayDark};
  font-size: 13px;
  line-height: 20px;

  & a {
    font-weight: 500;
    color: \${({ theme }) => theme.colors.dark};
    text-decoration: none;
    transition: color 0.2s ease;
    display: inline-flex;

    &:hover {
      color: \${({ theme }) => theme.colors.accent};
    }

    /* The GitHub logo is an icon-only link - round the global focus ring so it
       hugs the icon instead of drawing a rectangle. */
    &:has(svg):focus-visible {
      border-radius: 100%;
    }

    & svg {
      width: 16px;
      height: 16px;
    }

    & svg [fill] {
      fill: \${({ theme }) => theme.colors.grayDark};
    }

    &:hover svg [fill] {
      fill: \${({ theme }) => theme.colors.dark};
    }
  }
\`;

export const StyledFooterFlex = styled.div\`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
\`;
`;
