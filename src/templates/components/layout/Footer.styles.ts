// Look of the "Powered by" footer.
export const footerStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { styledSmall } from "cherry-styled-components";
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
  padding: 0 20px;
  transition: all 0.3s ease;

  \${({ $hasLinks }) =>
    $hasLinks &&
    css\`
      margin-top: 20px;
    \`}

  \${mq("lg")} {
    margin: 0;
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

export const StyledFooterInner = styled.div<{ theme: Theme }>\`
  border-top: solid 1px \${({ theme }) => theme.colors.grayLight};
  max-width: \${CONTENT_WIDTH}px;
  margin: 0 auto;
  padding: 28px 0;
  color: \${({ theme }) => theme.colors.grayDark};
  \${({ theme }) => styledSmall(theme)};

  \${mq("lg")} {
    padding: 20px 0;
  }

  & a {
    font-weight: 700;
    color: \${({ theme }) => theme.colors.accent};
    text-decoration: none;
    transition: all 0.3s ease;
    display: inline-flex;

    &:hover {
      color: \${({ theme }) => theme.colors.primary};
    }

    /* The GitHub logo is an icon-only link - round the global focus ring so it
       hugs the icon instead of drawing a rectangle. */
    &:has(svg):focus-visible {
      border-radius: 100%;
    }

    & svg {
      width: 18px;
      height: 18px;
    }
  }
\`;

export const StyledFooterFlex = styled.div\`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;

  \${mq("lg")} {
    justify-content: space-between;
  }
\`;
`;
