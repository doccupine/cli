import { deriveTemplate } from "../../../../lib/derive-template.js";
import { sharedStyledTemplate } from "../../../components/layout/SharedStyles.js";

// The classic SharedStyled.ts with the modern design's edits.
export const modernSharedStyledTemplate = deriveTemplate(
  "modern components/layout/SharedStyled.ts",
  sharedStyledTemplate,
  [
    [
      `"use client";
import { styledSmall, styledText } from "cherry-styled-components";
import { mq, Theme } from "@/app/theme";
import styled, { css } from "styled-components";`,
      `"use client";
import { styledSmall } from "cherry-styled-components";
import { mq, Theme } from "@/app/theme";
import styled, { css } from "styled-components";`,
    ],
    [
      `\`;

export const styledAnchor = css<{ theme: Theme }>\`
  & a:not([class]):not(:has(img)) {
    color: inherit;
    transition: all 0.3s ease;
    text-decoration: none;
    box-shadow: 0 2px 0 0 \${({ theme }) => theme.colors.primary};

    &:hover {
      color: \${({ theme }) => theme.colors.accent};
      box-shadow: 0 1px 0 0 \${({ theme }) => theme.colors.primary};
    }

    /* Same primaryLight focus glow as the global a:focus-visible ring, but
       layered over the link's own box-shadow underline (same property) so the
       underline is preserved. */
    &:focus-visible {
      outline: none;
      border-radius: \${({ theme }) => theme.spacing.radius.xs};
      box-shadow:
        0 2px 0 0 \${({ theme }) => theme.colors.primary},
        0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
    }
  }
\`;

export const stylesLists = css<{ theme: Theme }>\`
  & ul,
  & ol {
    & li {
      & > .code-wrapper {`,
      `\`;

/** The ink color (theme.colors.dark) faded toward the page surface:
    \`percent\` of ink. One mix reads right in both modes because ink and
    surface swap, so body copy and muted text need no dark-mode overrides. */
export const inkMix = (theme: Theme, percent: number) =>
  \`color-mix(in srgb, \${theme.colors.dark} \${percent}%, \${theme.colors.light})\`;

/** The modern outlined pill control (header search and Ask AI, the page
    actions): 32px tall, fully rounded, a hairline border, a soft fill on
    hover and while expanded, and a ring on keyboard focus only. */
export const pillControlStyles = css<{ theme: Theme }>\`
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xl};
  background: transparent;
  color: \${({ theme }) => theme.colors.grayDark};
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: none;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;

  & svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: inherit;
  }

  &:hover,
  &[aria-expanded="true"] {
    color: \${({ theme }) => theme.colors.dark};
    border-color: \${({ theme }) => theme.colors.gray};
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 4%, transparent)\`};
  }

  &:focus,
  &:active {
    box-shadow: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

/* Content links: accent text over a faint underline that strengthens on
   hover. The resting underline stays so links never rely on color alone. */
export const styledAnchor = css<{ theme: Theme }>\`
  & a:not([class]):not(:has(img)) {
    color: \${({ theme }) => theme.colors.accent};
    font-weight: 500;
    transition: all 0.2s ease;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    text-decoration-color: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.accent} 35%, transparent)\`};

    &:hover {
      text-decoration-color: \${({ theme }) => theme.colors.accent};
    }

    &:focus-visible {
      outline: none;
      border-radius: \${({ theme }) => theme.spacing.radius.xs};
      box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
    }
  }
\`;

/* Lists: small muted bullets and muted numbers, so the text leads. */
export const stylesLists = css<{ theme: Theme }>\`
  & ul,
  & ol {
    & > li + li {
      margin-top: 6px;
    }

    & li {
      & > .code-wrapper {`,
    ],
    [
      `        display: inline;
      }
    }
  }`,
      `        display: inline;
      }

      & ul,
      & ol {
        margin-top: 6px;
      }
    }
  }`,
    ],
    [
      `      display: block;
      position: relative;
      padding: 0 0 0 24px;
      margin: 0;
      \${({ theme }) => styledText(theme)};
      min-height: 23px;

      \${mq("lg")} {
        min-height: 27px;
      }

      &::before {
        content: "";
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: \${({ theme }) => theme.colors.primary};
        position: absolute;
        top: 8px;
        left: 9px;

        \${mq("lg")} {
          top: 10px;
        }
      }
    }`,
      `      display: block;
      position: relative;
      padding: 0 0 0 22px;
      margin: 0;

      &::before {
        content: "";
        display: block;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: \${({ theme }) => theme.colors.gray};
        position: absolute;
        top: calc(0.875em - 2px);
        left: 6px;
      }
    }`,
    ],
    [
      `    & > li {
      counter-increment: item;
      padding: 0 0 0 24px;
      margin: 0;
      \${({ theme }) => styledText(theme)};

      &::before {
        content: counter(item) ".";
        display: inline-block;
        min-width: 20px;
        margin-left: -24px;
        margin-right: 4px;
        text-align: right;
        font-weight: 700;
        color: \${({ theme }) => theme.colors.primary};
      }
    }`,
      `    & > li {
      counter-increment: item;
      padding: 0 0 0 22px;
      margin: 0;

      &::before {
        content: counter(item) ".";
        display: inline-block;
        min-width: 18px;
        margin-left: -22px;
        margin-right: 4px;
        text-align: right;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: \${({ theme }) => theme.colors.grayDark};
      }
    }`,
    ],
  ],
);
