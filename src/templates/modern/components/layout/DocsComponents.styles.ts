export const modernDocsComponentsStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { mq, Theme } from "@/app/theme";
import {
  CHAT_WIDTH,
  COLUMN_GUTTER,
  CONTENT_WIDTH,
  SIDEBAR_WIDTH,
  TOC_WIDTH,
} from "@/components/layout/designTokens";
import {
  focusModeColumn,
  inkMix,
  sidePanelOffset,
  styledAnchor,
  styledTable,
  stylesLists,
} from "@/components/layout/SharedStyled";

// Below "lg" the wrapper stays unpositioned, so the sidebar's menu button
// (absolute) is placed against the page and lands in the header's top row.
export const StyledDocsWrapper = styled.div<{ theme: Theme }>\`
  \${mq("lg")} {
    position: relative;
  }
\`;

export const StyledDocsSidebar = styled.div<{ theme: Theme }>\`
  clear: both;
\`;

const headingBase = css<{ theme: Theme }>\`
  color: \${({ theme }) => theme.colors.dark};
  font-weight: 600;
  scroll-margin-top: 24px;
\`;

// The <main> landmark wraps only the article content: the sidebar, footer,
// and nav render outside it so content extractors and assistive tech start at
// the article.
export const StyledDocsContainer = styled.main<{
  theme: Theme;
  $isChatOpen?: boolean;
}>\`
  position: relative;
  padding: 24px \${COLUMN_GUTTER}px 72px;
  width: 100%;
  font-size: 16px;
  line-height: 1.75;
  color: \${({ theme }) => inkMix(theme, 82)};
  transition: all 0.3s ease;

  \${mq("lg")} {
    padding: 32px \${TOC_WIDTH + COLUMN_GUTTER}px 72px
      \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;

    \${({ $isChatOpen }) =>
      $isChatOpen &&
      css\`
        padding: 32px \${CHAT_WIDTH + COLUMN_GUTTER}px 72px
          \${SIDEBAR_WIDTH + COLUMN_GUTTER}px;
      \`}
  }

  \${sidePanelOffset};
  \${({ $isChatOpen }) => !$isChatOpen && focusModeColumn};

  /* GlobalStyles paints every p and li in the full ink color; body copy in
     the article is a step softer. Blocks that tint their own text (callouts,
     cards) restate it on their own p rules. */
  & p,
  & li {
    color: \${({ theme }) => inkMix(theme, 82)};
  }

  & h1 {
    \${headingBase};
    font-size: 30px;
    line-height: 1.2;
    letter-spacing: -0.02em;

    \${mq("lg")} {
      font-size: 36px;
    }
  }

  /* The paragraph right under the page title reads as its lead. */
  & h1:first-child + p {
    font-size: 18px;
    line-height: 28px;
    color: \${({ theme }) => inkMix(theme, 64)};
    margin-top: -8px;
  }

  & h2 {
    \${headingBase};
    font-size: 24px;
    line-height: 1.35;
    letter-spacing: -0.015em;
    margin-top: 20px;
  }

  & h3 {
    \${headingBase};
    font-size: 20px;
    line-height: 1.4;
    letter-spacing: -0.01em;
    margin-top: 8px;
  }

  & h4 {
    \${headingBase};
    font-size: 18px;
    line-height: 1.5;
  }

  & h5,
  & h6 {
    \${headingBase};
    font-size: 16px;
    line-height: 1.5;
  }

  & strong,
  & b {
    color: \${({ theme }) => theme.colors.dark};
    font-weight: 600;
  }

  /* A fenced block without a language renders as a plain <pre>: let a long
     line scroll inside it instead of widening the page. */
  & pre {
    max-width: 100%;
    overflow-x: auto;
  }

  \${styledAnchor};
  \${stylesLists};
  \${styledTable};

  & img,
  & video,
  & iframe {
    max-width: 100%;
    border-radius: \${({ theme }) => theme.spacing.radius.lg};
  }

  & code:not([class]),
  & kbd {
    max-width: max-content;
    font-size: 0.875em;
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 5%, transparent)\`};
    border: solid 1px
      \${({ theme }) =>
        \`color-mix(in srgb, \${theme.colors.dark} 8%, transparent)\`};
    color: \${({ theme }) => theme.colors.dark};
    padding: 1px 5px;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    /* Short values stay whole (break-word never narrows a table column);
       long ones, marked data-long by InlineCode, may break anywhere. Code
       is never hyphenated, even where the prose around it is. */
    overflow-wrap: break-word;
    hyphens: none;
  }

  & code:not([class])[data-long] {
    overflow-wrap: anywhere;
  }

  & .lucide {
    color: \${({ theme }) => theme.colors.grayDark};
  }

  & .aspect-video {
    aspect-ratio: 16 / 9;
    border-radius: \${({ theme }) => theme.spacing.radius.lg};
  }
\`;

export const StyledMarkdownContainer = styled.div\`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  max-width: \${CONTENT_WIDTH}px;
  margin: auto;
\`;

// Visually hidden but present for crawlers and agents: points at llms.txt and
// the .md mirrors. Rendered as the first element of the site layout.
export const StyledLlmsDirective = styled.div\`
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
`;
