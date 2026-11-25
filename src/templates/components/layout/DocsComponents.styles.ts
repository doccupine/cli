// Look of the docs frame: the page wrapper, the content column (<main>) and
// the markdown column inside it. DocsComponents.tsx keeps the behavior.
export const docsComponentsStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { styledText } from "cherry-styled-components";
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
  sidePanelOffset,
  styledAnchor,
  styledTable,
  stylesLists,
} from "@/components/layout/SharedStyled";

export const StyledDocsWrapper = styled.div<{ theme: Theme }>\`
  position: relative;
\`;

export const StyledDocsSidebar = styled.div<{ theme: Theme }>\`
  clear: both;
\`;

// The <main> landmark wraps only the article content: the sidebar, footer,
// and nav render outside it so content extractors and assistive tech start at
// the article.
export const StyledDocsContainer = styled.main<{
  theme: Theme;
  $isChatOpen?: boolean;
}>\`
  position: relative;
  padding: 0 20px 100px 20px;
  width: 100%;
  \${({ theme }) => styledText(theme)};
  transition: all 0.3s ease;

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

  & p {
    color: \${({ theme }) => theme.colors.grayDark};
    hyphens: auto;
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
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 20%, transparent)\`};
    color: \${({ theme }) => theme.colors.dark};
    padding: 2px 4px;
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
    color: \${({ theme }) => theme.colors.primary};
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
