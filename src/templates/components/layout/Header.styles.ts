// Look of the site header. The pin-on-scroll behavior, search and chat
// launchers stay in Header.tsx.
export const headerStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { mq, Theme } from "@/app/theme";

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

  \${({ $pinned }) =>
    $pinned &&
    css\`
      position: fixed;
      left: 0;
    \`}

  \${({ $hasChildren }) =>
    !$hasChildren &&
    css\`
      \${mq("lg")} {
        padding-bottom: 16px;
        padding-top: 16px;
      }
    \`}

  &::before,
  &::after {
    display: block;
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: \${({ theme }) => theme.colors.light};
    z-index: -2;
  }

  &::after {
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 5%, transparent)\`};
    z-index: -1;
  }

  /* Below "lg" the logo takes the room the controls leave and is the last
     thing to give way: it shrinks rather than pushing the controls onto a
     second row. From "lg" it keeps its natural width. */
  & .logo {
    display: flex;
    flex: 1 1 0;
    min-width: 0;

    & svg,
    & img {
      margin: auto 0;
      height: auto;
      width: fit-content;
      min-width: 0;
      max-width: min(182px, 100%);
      max-height: 30px;

      & [fill]:not(.ignore-fill) {
        fill: \${({ theme }) => theme.colors.primary};
      }
    }

    \${mq("lg")} {
      flex: 0 1 auto;
      min-width: max-content;

      & svg,
      & img {
        min-width: fit-content;
        max-width: 182px;
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

export const StyledHeaderInner = styled.div<{ $hasChildren: boolean }>\`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 16px 0 0 20px;

  \${({ $hasChildren }) =>
    !$hasChildren &&
    css\`
      padding-bottom: 16px;
    \`}

  \${mq("lg")} {
    flex-wrap: nowrap;
    padding: 0 20px;
  }
\`;

/** Narrowest viewport where the assistant launcher keeps its label next to
    the widest logo (182px) on one row; below it the launcher is icon-only. */
const LAUNCHER_LABEL_MIN_WIDTH = 344;

export const StyledLeftWrapper = styled.div\`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: fit-content;
  padding-right: 20px;

  /* The launcher's accessible name is its aria-label, so the visible label
     can drop out on the narrowest phones. */
  & .chat-launcher-inner > span {
    display: none;
  }

  @media screen and (min-width: \${LAUNCHER_LABEL_MIN_WIDTH}px) {
    & .chat-launcher-inner > span {
      display: inline;
    }
  }

  \${mq("lg")} {
    padding-right: 0;
  }
\`;
`;
