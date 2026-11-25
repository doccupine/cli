export const modernStaticLinksStylesTemplate = `"use client";
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

export const StyledStaticLinks = styled.div<{
  theme: Theme;
  $isChatOpen: boolean;
}>\`
  display: flex;
  transition: all 0.3s ease;
  padding: 0 \${COLUMN_GUTTER}px;

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

  &:has(a) {
    padding-bottom: 8px;
  }
\`;

export const StyledStaticLinksContent = styled.div\`
  max-width: \${CONTENT_WIDTH}px;
  display: flex;
  gap: 4px 20px;
  flex-wrap: wrap;
  width: 100%;
  margin: 0 auto;
\`;

// Plain muted text links with an optional leading icon.
export const StyledLink = styled.a<{ theme: Theme; $hasIcon?: boolean }>\`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  white-space: nowrap;
  min-width: fit-content;
  text-decoration: none;
  color: \${({ theme }) => theme.colors.grayDark};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  transition: color 0.2s ease;

  & svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  &:hover {
    color: \${({ theme }) => theme.colors.dark};
  }
\`;
`;
