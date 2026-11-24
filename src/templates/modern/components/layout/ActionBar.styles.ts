export const modernActionBarStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { mq, Theme } from "@/app/theme";
import { resetButton } from "cherry-styled-components";
import {
  StyledSmallButton,
  pillControlStyles,
} from "@/components/layout/SharedStyled";
import { CONTENT_WIDTH } from "@/components/layout/designTokens";

// The page header's top row: the page's category as an eyebrow on the left,
// quiet page actions on the right. The title follows in the content.
export const StyledActionBar = styled.div<{
  theme: Theme;
  $isChatOpen?: boolean;
}>\`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  max-width: \${CONTENT_WIDTH}px;
  margin: auto;
\`;

export const StyledActionBarEyebrow = styled.p<{ theme: Theme }>\`
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  color: \${({ theme }) => theme.colors.accent};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
\`;

export const StyledActionBarContent = styled.div\`
  display: flex;
  flex-shrink: 0;
  gap: 8px;
\`;

/** Narrowest viewports where the copy (and RSS) labels fit beside the
    eyebrow, with and without the RSS link; below them the labels are
    visually hidden and the pills go icon-only, so the row never wraps or
    squeezes its controls (only the eyebrow truncates). */
const LABELS_MIN_WIDTH = 390;
const LABELS_WITH_RSS_MIN_WIDTH = 450;

const narrow = (rules: ReturnType<typeof css>) => css\`
  @media screen and (max-width: \${LABELS_MIN_WIDTH - 1}px) {
    \${rules};
  }

  @media screen and (max-width: \${LABELS_WITH_RSS_MIN_WIDTH - 1}px) {
    [data-rss] & {
      \${rules};
    }
  }
\`;

// A pill label. Visually hidden (still the button's accessible name) when the
// row is too narrow for it.
export const StyledActionLabel = styled.span\`
  white-space: nowrap;

  \${narrow(css\`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    border: 0;
  \`)}
\`;

// An icon-only pill keeps the search pill's width.
const iconOnlyWhenNarrow = narrow(css\`
  padding: 0 9px;
\`);

// The page actions share the header's pill controls.
export const actionPillStyles = pillControlStyles;

export const StyledCopyButton = styled(StyledSmallButton)<{
  theme: Theme;
  $copied: boolean;
}>\`
  \${actionPillStyles};
  margin: 0;
  flex-shrink: 0;
  \${iconOnlyWhenNarrow};

  \${({ theme, $copied }) =>
    $copied &&
    css\`
      &,
      &:hover {
        color: \${theme.colors.success};
      }
    \`}
\`;

export const StyledActionBarGroup = styled.div\`
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  margin-left: auto;

  & > * {
    margin-right: 0;
  }
\`;

export const StyledRssLink = styled(StyledSmallButton)<{ theme: Theme }>\`
  \${actionPillStyles};
  margin: 0;
  flex-shrink: 0;
  \${iconOnlyWhenNarrow};
\`;

export const StyledMarkdownLink = styled.a<{ theme: Theme }>\`
  \${resetButton}
  \${actionPillStyles};
  width: 32px;
  padding: 0;
  justify-content: center;
\`;

// Two-icon switch between the rendered page and its MDX source. The current
// view's icon sits on a soft knob.
export const StyledToggle = styled.button<{
  theme: Theme;
  $isActive?: boolean;
}>\`
  \${resetButton}
  \${actionPillStyles};
  width: 60px;
  justify-content: space-between;
  padding: 0 8px;
  position: relative;

  & svg {
    position: relative;
    z-index: 1;
  }

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 7%, transparent)\`};
    transition: transform 0.2s ease;
    \${({ $isActive }) =>
      !$isActive &&
      css\`
        transform: translateX(28px);
      \`}
  }
\`;

// The raw-content view renders a full-viewport textarea. That rule is scoped to
// the raw view (\`$raw\`) so it never leaks into textareas rendered inside page
// content - e.g. the API playground's request-body editor, which sits inside
// this same ActionBar in the normal (view) mode.
export const StyledContent = styled.div<{
  theme: Theme;
  $hasSectionBar?: boolean;
  $raw?: boolean;
}>\`
  padding-top: 8px;

  \${({ $raw, $hasSectionBar }) =>
    $raw &&
    css\`
      padding-top: 16px;

      & textarea {
        max-width: \${CONTENT_WIDTH}px;
        margin: auto;
        width: 100%;
        height: 100%;
        min-height: calc(100vh - \${$hasSectionBar ? 220 : 180}px);

        \${mq("lg")} {
          min-height: calc(100vh - 180px);
        }
      }
    \`}
\`;
`;
