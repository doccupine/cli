export const modernHeaderStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { resetButton } from "cherry-styled-components";
import { pillControlStyles } from "@/components/layout/SharedStyled";
import { mq, Theme } from "@/app/theme";
import { StyledSearchButton } from "@/components/SearchDocs";
import {
  COLUMN_GUTTER,
  HEADER_HEIGHT,
  HEADER_MENU_SLOT,
} from "@/components/layout/designTokens";

export const StyledHeader = styled.header<{
  theme: Theme;
  $hasChildren: boolean;
  $pinned: boolean;
}>\`
  /* In normal flow at the top of the page, fixed only once the page scrolls.
     iOS Safari refuses to color its toolbar from the theme-color meta while
     a sticky or fixed element touches the top edge - whatever that element's
     background (transparent, frosted, or opaque; the Doccupine platform
     site's header is position: relative on its app pages for the same
     reason). At scroll position zero an in-flow header occupies exactly the
     place a sticky one would, so the swap is invisible; while scrolled, the
     toolbar is collapsed anyway. StyledHeaderShell holds the header's
     measured height while it is fixed, so pinning never shifts the page. */
  position: relative;
  top: 0;
  margin: 0;
  z-index: 1000;
  width: 100%;
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.light} 88%, transparent)\`};
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);

  \${({ $pinned }) =>
    $pinned &&
    css\`
      position: fixed;
      left: 0;
    \`}

  & .logo {
    display: flex;
    align-items: center;
    min-width: 0;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};

    & svg,
    & img {
      height: auto;
      width: fit-content;
      min-width: 0;
      max-width: min(160px, 100%);
      max-height: 26px;

      & [fill]:not(.ignore-fill) {
        fill: \${({ theme }) => theme.colors.dark};
      }
    }
  }
\`;

/**
 * In-flow placeholder that owns the header's space. While the header is
 * pinned (position: fixed, out of flow), the shell keeps the header's
 * measured height so pinning never shifts the page; at the top of the page
 * it collapses to its content.
 */
export const StyledHeaderShell = styled.div<{
  $pinned: boolean;
  $height: number;
}>\`
  \${({ $pinned, $height }) =>
    $pinned &&
    $height > 0 &&
    css\`
      height: \${$height}px;
    \`}
\`;

/* Logo, section tabs, actions. Below "lg" the tabs wrap onto a second row
   and the top row leaves room for the menu button. From "lg" the logo and the
   actions take equal flexible halves, so the tabs sit centered on the page. */
export const StyledHeaderInner = styled.div<{ $hasChildren: boolean }>\`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 16px;
  min-height: \${HEADER_HEIGHT}px;
  padding: 0 \${HEADER_MENU_SLOT + COLUMN_GUTTER}px 0 \${COLUMN_GUTTER}px;

  /* The logo takes the room the controls leave and gives way last: it
     shrinks rather than pushing the controls onto a second row. */
  & > .logo {
    flex: 1 1 0;
    height: \${HEADER_HEIGHT}px;
  }

  \${mq("lg")} {
    flex-wrap: nowrap;
    padding: 0 \${COLUMN_GUTTER}px;
  }
\`;

/** Narrowest viewport where Ask AI keeps its label beside the default logo
    on one row; below it the pill is icon-only, like the search pill. */
const ASK_LABEL_MIN_WIDTH = 390;

export const StyledAskButton = styled.button<{ theme: Theme }>\`
  \${resetButton};
  \${pillControlStyles};
  flex-shrink: 0;
  padding: 0 9px;

  @media screen and (min-width: \${ASK_LABEL_MIN_WIDTH}px) {
    padding: 0 11px;
  }
\`;

// The visible label; the button's accessible name is its aria-label.
export const StyledAskLabel = styled.span\`
  display: none;

  @media screen and (min-width: \${ASK_LABEL_MIN_WIDTH}px) {
    display: inline;
  }
\`;

export const StyledLeftWrapper = styled.div<{ theme: Theme }>\`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: fit-content;

  \${mq("lg")} {
    flex: 1 1 0;
  }

  & \${StyledSearchButton} {
    \${pillControlStyles};
    padding: 0 9px;

    \${mq("lg")} {
      padding: 0 6px 0 11px;
    }

    & kbd {
      background: transparent;
      border: solid 1px \${({ theme }) => theme.colors.grayLight};
      color: \${({ theme }) => theme.colors.grayDark};
      font-weight: 500;
      padding: 1px 6px;
      border-radius: \${({ theme }) => theme.spacing.radius.xl};
    }
  }
\`;
`;
