export const modernDocsNavigationStylesTemplate = `"use client";
import Link from "next/link";
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

export const StyledNavigationWrapper = styled.div<{
  $isChatOpen?: boolean;
}>\`
  transition: all 0.3s ease;
  padding: 0 \${COLUMN_GUTTER}px 40px;

  \${mq("lg")} {
    padding: 0 \${TOC_WIDTH + COLUMN_GUTTER}px 40px
      \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 0 \${CHAT_WIDTH + COLUMN_GUTTER}px 40px
          \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;
      \`}
  }

  \${sidePanelOffset};
  \${({ $isChatOpen }) => !$isChatOpen && focusModeColumn};
\`;

// Previous and next as plain text links over a hairline: a small muted
// direction label above each page title.
export const StyledNavigationInner = styled.div<{ theme: Theme }>\`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  max-width: \${CONTENT_WIDTH}px;
  margin: auto;
  padding-top: 24px;
  border-top: solid 1px \${({ theme }) => theme.colors.grayLight};
\`;

export const StyledNavButton = styled(Link)<{ theme: Theme }>\`
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  min-width: 0;
  max-width: 50%;
  padding: 4px 0;
  text-decoration: none;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};

  &[data-direction="prev"] {
    align-items: flex-start;
  }

  &[data-direction="next"] {
    align-items: flex-end;
    margin-left: auto;
    text-align: right;
  }

  &:hover > span:first-child {
    color: \${({ theme }) => theme.colors.accent};
  }
\`;

export const StyledNavLabel = styled.span<{ theme: Theme }>\`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  line-height: 20px;
  color: \${({ theme }) => theme.colors.grayDark};

  & svg {
    width: 14px;
    height: 14px;
  }
\`;

export const StyledNavTitle = styled.span<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.dark};
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
  transition: color 0.2s ease;
\`;

export const StyledSpacer = styled.div\`
  flex: 1;
\`;
`;
