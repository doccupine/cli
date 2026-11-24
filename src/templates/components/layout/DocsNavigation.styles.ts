// Look of the previous/next pager. Page ordering stays in DocsNavigation.tsx.
export const docsNavigationStylesTemplate = `"use client";
import Link from "next/link";
import styled, { css } from "styled-components";
import { mq, Theme } from "@/app/theme";
import {
  focusModeColumn,
  interactiveStyles,
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
  padding: 0 20px 100px 20px;
  \${mq("lg")} {
    padding: 0 \${TOC_WIDTH + COLUMN_GUTTER}px 80px
      \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;
    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 0 \${CHAT_WIDTH + COLUMN_GUTTER}px 80px
          \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;
      \`}
  }

  \${sidePanelOffset};
  \${({ $isChatOpen }) => !$isChatOpen && focusModeColumn};
\`;

export const StyledNavigationInner = styled.div\`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  max-width: \${CONTENT_WIDTH}px;
  margin: auto;
\`;

export const StyledNavButton = styled(Link)<{ theme: Theme }>\`
  \${interactiveStyles};
  display: flex;
  flex-direction: column;
  text-decoration: none;
  padding: 20px;
  flex: 50%;
  max-width: 50%;
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  color: \${({ theme }) => theme.colors.dark};

  &:hover {
    border-color: \${({ theme }) => theme.colors.primary};
  }

  &[data-direction="prev"] {
    align-items: flex-start;
  }

  &[data-direction="next"] {
    align-items: flex-end;
    margin-left: auto;
    text-align: right;
  }
\`;

export const StyledNavLabel = styled.span<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.grayDark};
  display: flex;
  flex-direction: row;
  gap: 4px;

  & svg {
    margin: auto 0;
  }
\`;

export const StyledNavTitle = styled.span<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.dark};
  font-weight: 600;
  margin: 0 0 4px 0;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
\`;

export const StyledSpacer = styled.div\`
  flex: 1;
\`;
`;
