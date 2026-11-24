// Look of the links.json row under the content.
export const staticLinksStylesTemplate = `"use client";
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

export const StyledStaticLinks = styled.div<{
  theme: Theme;
  $isChatOpen: boolean;
}>\`
  display: flex;
  margin: 0 auto;
  transition: all 0.3s ease;
  padding: 0 20px;
  margin-bottom: 20px;

  \${mq("lg")} {
    margin: 0;
    padding: 0 \${TOC_WIDTH + COLUMN_GUTTER}px 20px
      \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 0 \${CHAT_WIDTH + COLUMN_GUTTER}px 20px
          \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;
      \`}
  }

  \${sidePanelOffset};
  \${({ $isChatOpen }) => !$isChatOpen && focusModeColumn};
\`;

export const StyledStaticLinksContent = styled.div\`
  max-width: \${CONTENT_WIDTH}px;
  margin: auto 0;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
  margin: 0 auto;
\`;

export const StyledLink = styled.a<{ theme: Theme; $hasIcon?: boolean }>\`
  position: relative;
  text-decoration: none;
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 1;
  color: \${({ theme }) => theme.colors.accent};
  padding: 0;
  display: flex;
  gap: 6px;
  transition: all 0.3s ease;
  font-weight: 600;
  white-space: nowrap;
  min-width: fit-content;
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 10%, transparent)\`};
  padding: 6px 8px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  \${interactiveStyles};

  \${({ $hasIcon }) =>
    $hasIcon &&
    css\`
      padding-left: 30px;
    \`}

  & * {
    margin: auto 0;
  }

  & svg {
    position: absolute;
    top: 50%;
    left: 8px;
    transform: translateY(-50%);
  }

  &:hover {
    color: \${({ theme }) => theme.colors.accent};
  }
\`;
`;
