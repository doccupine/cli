// Look of the page action bar (copy, RSS, markdown link, view toggle) and
// of the content area under it. The copy and view logic stays in
// ActionBar.tsx.
export const actionBarStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { mq, Theme } from "@/app/theme";
import { interactiveStyles, resetButton } from "cherry-styled-components";
import { StyledSmallButton } from "@/components/layout/SharedStyled";
import { CONTENT_WIDTH } from "@/components/layout/designTokens";

export const StyledActionBar = styled.div<{
  theme: Theme;
  $isChatOpen?: boolean;
}>\`
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  left: 0;
  padding: 12px 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: \${CONTENT_WIDTH}px;
  margin: auto;
  transition: all 0.3s ease;

  \${mq("lg")} {
    padding: 12px 0;
  }
\`;

export const StyledActionBarContent = styled.div\`
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  margin: auto 0;
\`;

/** Narrowest viewports where the copy (and RSS) labels fit on the row, with
    and without the RSS link; below them the labels are visually hidden and
    the buttons go icon-only, so the row never wraps or squeezes. */
const LABELS_MIN_WIDTH = 280;
const LABELS_WITH_RSS_MIN_WIDTH = 344;

const visuallyHidden = css\`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
\`;

// A button label. Visually hidden (still the button's accessible name) when
// the row is too narrow for it.
export const StyledActionLabel = styled.span\`
  white-space: nowrap;

  @media screen and (max-width: \${LABELS_MIN_WIDTH - 1}px) {
    \${visuallyHidden};
  }

  @media screen and (max-width: \${LABELS_WITH_RSS_MIN_WIDTH - 1}px) {
    [data-rss] & {
      \${visuallyHidden};
    }
  }
\`;

export const StyledCopyButton = styled(StyledSmallButton)<{
  theme: Theme;
  $copied: boolean;
}>\`
  border: solid 1px
    \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.grayLight};
  color: \${({ theme, $copied }) =>
    $copied ? theme.colors.success : theme.colors.primary};

  & svg.lucide {
    color: \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.primary};
  }

  white-space: nowrap;
  flex-shrink: 0;
\`;

// StyledSmallButton carries a -6px right margin for edge alignment; inside
// the pill group that would eat into the gap, so it is neutralized here.
export const StyledActionBarGroup = styled.div\`
  display: flex;
  flex-shrink: 0;
  gap: 12px;

  & > * {
    margin-right: 0;
  }
\`;

export const StyledRssLink = styled(StyledSmallButton)<{ theme: Theme }>\`
  text-decoration: none;
  color: \${({ theme }) => theme.colors.primary};
  padding: 2px 8px;
  white-space: nowrap;
  flex-shrink: 0;

  & svg.lucide {
    color: \${({ theme }) => theme.colors.primary};
  }
\`;

// Mirrors the geometry and interaction of Cherry's ThemeToggle so every pill
// on this side of the bar looks identical: interactiveStyles supplies the
// border highlight + focus/active rings (no scale effect), and the 30px
// height with a fully rounded radius matches the toggle's knob track.
export const actionPillStyles = (theme: Theme) => css\`
  height: 30px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  margin: auto 0;
  background: \${theme.colors.light};
  border-color: \${theme.colors.grayLight};

  & svg {
    width: 16px;
    height: 16px;
    object-fit: contain;
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
  }

  & svg[stroke] {
    stroke: \${theme.colors.primary};
  }

  &:hover svg[stroke] {
    stroke: \${theme.colors.accent};
  }
\`;

export const StyledMarkdownLink = styled.a<{ theme: Theme }>\`
  \${resetButton}
  \${interactiveStyles}
  \${({ theme }) => actionPillStyles(theme)}
  width: 30px;
  justify-content: center;
  text-decoration: none;
\`;

// The space-between layout with 6px padding puts each 16px icon's center
// exactly where the 24px knob's center sits in its resting (left: 2px) and
// active (translateX(26px)) positions.
export const StyledToggle = styled.button<{
  theme: Theme;
  $isActive?: boolean;
}>\`
  \${resetButton}
  \${interactiveStyles}
  \${({ theme }) => actionPillStyles(theme)}
  width: 56px;
  justify-content: space-between;
  padding: 0 6px;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
    transition: all 0.3s ease;
    z-index: 1;
    \${({ $isActive }) =>
      !$isActive &&
      css\`
        transform: translateX(26px);
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
  padding-top: 20px;
  transition: all 0.3s ease;

  \${({ $raw, $hasSectionBar }) =>
    $raw &&
    css\`
      & textarea {
        max-width: \${CONTENT_WIDTH}px;
        margin: auto;
        width: 100%;
        height: 100%;
        min-height: calc(100vh - \${$hasSectionBar ? 202 : 160}px);

        \${mq("lg")} {
          min-height: calc(100vh - 159px);
        }
      }
    \`}
\`;
`;
