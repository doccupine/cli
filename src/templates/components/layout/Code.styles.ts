// Look of code blocks and <CodeTabs>: the window, its top bar, the copy
// button and the syntax palettes. Highlighting, copying and tab keyboard
// handling stay in Code.tsx.
export const codeStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import {
  interactiveStyles,
  resetButton,
  styledCode,
} from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { thinScrollbar } from "@/components/layout/SharedStyled";

export const CodeWrapper = styled.span<{ theme: Theme }>\`
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  border: solid 1px \${({ theme }) => theme.colors.grayLight};
  background: \${({ theme }) => theme.colors.light};
\`;

/* Code block uses a fixed GitHub-style palette for the syntax tokens in both
   modes so highlighting stays legible regardless of brand colors. The dark-mode
   surface, however, matches the left sidebar's translucent brand tint
   (color-mix of theme.colors.primaryLight over the black page) instead of
   GitHub's #0d1117, so the window sits on the same background as the nav. Dark
   variants live in :root.dark & blocks so the swap happens via the active
   <html> class with no re-render. */
export const TopBar = styled.div<{ theme: Theme }>\`
  position: relative;
  background: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.primaryLight} 5%, transparent)\`};
  border-top-left-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-top-right-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom: solid 1px \${({ theme }) => theme.colors.grayLight};
  height: 33px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
\`;

export const DotsContainer = styled.div\`
  display: flex;
  gap: 5px;
\`;

export const Dot = styled.span<{ theme: Theme }>\`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);

  :root.dark & {
    background: rgba(255, 255, 255, 0.1);
  }
\`;

/* Icon-only copy button. interactiveStyles supplies the border highlight on
   hover plus the focus/active rings (no scale effect). Colors come from theme
   tokens (grayLight border, success/grayDark icon) that swap for dark mode via
   the theme prop, so no :root.dark & override is needed and the copied state
   reads consistently in both modes. */
export const CopyButton = styled.button<{ theme: Theme; $copied: boolean }>\`
  \${resetButton}
  \${interactiveStyles}
  background: \${({ theme }) => theme.colors.light};
  border-color: \${({ theme }) => theme.colors.grayLight};
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -6px;

  & svg.lucide {
    margin: 0;
    color: \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.grayDark};
  }
\`;

/* Centered file name in the TopBar. Sits absolutely over the flex row so the
   dots and copy button keep their edge alignment. Monospace + a muted grayDark
   token that swaps for dark mode via the theme prop. pointer-events off so
   clicks fall through to nothing and never steal focus from the buttons. */
export const TopBarTitle = styled.span<{ theme: Theme }>\`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  font-family: \${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  line-height: 2;
  color: \${({ theme }) => theme.colors.grayDark};
\`;

/* Segmented control living in the TopBar for CodeTabs. Scrolls horizontally
   with the thin scrollbar when the labels overflow the 33px bar. */
export const TabList = styled.div<{ theme: Theme }>\`
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
  \${thinScrollbar};
  padding: 2px;
  margin-left: -8px;
\`;

export const CodeTabButton = styled.button<{ theme: Theme; $active: boolean }>\`
  \${resetButton}
  \${interactiveStyles}
  flex: 0 0 auto;
  font-family: \${({ theme }) => theme.fonts.mono};
  font-size: 12px;
  line-height: 1;
  padding: 5px;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  border: solid 1px
    \${({ theme, $active }) =>
      $active ? theme.colors.grayLight : "transparent"};
  background: \${({ theme, $active }) =>
    $active ? theme.colors.light : "transparent"};
  color: \${({ theme, $active }) =>
    $active ? theme.colors.dark : theme.colors.grayDark};
  box-shadow: 0 0 0 0px \${({ theme }) => theme.colors.primary};

  &:hover {
    color: \${({ theme }) => theme.colors.dark};
    background: \${({ theme, $active }) =>
      $active
        ? theme.colors.light
        : \`color-mix(in srgb, \${theme.colors.dark} 4%, transparent)\`};
  }

  &:focus {
    border-color: \${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }

  &:active {
    box-shadow: 0 0 0 1px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

/* GitHub Light syntax highlighting by default; GitHub Dark in :root.dark.
   Browser resolves which rule wins based on the active <html> class with no
   JS or React re-render involved. */
export const lightSyntaxHighlight = css\`
  & .hljs {
    color: #24292f;
    background: #ffffff;
  }
  & .hljs-doctag,
  & .hljs-keyword,
  & .hljs-meta .hljs-keyword,
  & .hljs-template-tag,
  & .hljs-template-variable,
  & .hljs-type,
  & .hljs-variable.language_ {
    color: #cf222e;
  }
  & .hljs-title,
  & .hljs-title.class_,
  & .hljs-title.class_.inherited__,
  & .hljs-title.function_ {
    color: #8250df;
  }
  & .hljs-attr,
  & .hljs-attribute,
  & .hljs-literal,
  & .hljs-meta,
  & .hljs-number,
  & .hljs-operator,
  & .hljs-selector-attr,
  & .hljs-selector-class,
  & .hljs-selector-id,
  & .hljs-variable {
    color: #0550ae;
  }
  & .hljs-meta .hljs-string,
  & .hljs-regexp,
  & .hljs-string {
    color: #0a3069;
  }
  & .hljs-built_in,
  & .hljs-symbol {
    color: #953800;
  }
  & .hljs-code,
  & .hljs-comment,
  & .hljs-formula {
    color: #6e7781;
  }
  & .hljs-name,
  & .hljs-quote,
  & .hljs-selector-pseudo,
  & .hljs-selector-tag {
    color: #116329;
  }
  & .hljs-subst {
    color: #24292f;
  }
  & .hljs-section {
    color: #0550ae;
    font-weight: 700;
  }
  & .hljs-bullet {
    color: #953800;
  }
  & .hljs-emphasis {
    color: #24292f;
    font-style: italic;
  }
  & .hljs-strong {
    color: #24292f;
    font-weight: 700;
  }
\`;

export const darkSyntaxHighlight = css\`
  & .hljs {
    color: #c9d1d9;
    background: transparent;
  }
  & .hljs-doctag,
  & .hljs-keyword,
  & .hljs-meta .hljs-keyword,
  & .hljs-template-tag,
  & .hljs-template-variable,
  & .hljs-type,
  & .hljs-variable.language_ {
    color: #ff7b72;
  }
  & .hljs-title,
  & .hljs-title.class_,
  & .hljs-title.class_.inherited__,
  & .hljs-title.function_ {
    color: #d2a8ff;
  }
  & .hljs-attr,
  & .hljs-attribute,
  & .hljs-literal,
  & .hljs-meta,
  & .hljs-number,
  & .hljs-operator,
  & .hljs-selector-attr,
  & .hljs-selector-class,
  & .hljs-selector-id,
  & .hljs-variable {
    color: #79c0ff;
  }
  & .hljs-meta .hljs-string,
  & .hljs-regexp,
  & .hljs-string {
    color: #a5d6ff;
  }
  & .hljs-built_in,
  & .hljs-symbol {
    color: #ffa657;
  }
  & .hljs-code,
  & .hljs-comment,
  & .hljs-formula {
    color: #8b949e;
  }
  & .hljs-name,
  & .hljs-quote,
  & .hljs-selector-pseudo,
  & .hljs-selector-tag {
    color: #7ee787;
  }
  & .hljs-subst {
    color: #c9d1d9;
  }
  & .hljs-section {
    color: #1f6feb;
    font-weight: 700;
  }
  & .hljs-bullet {
    color: #f2cc60;
  }
  & .hljs-emphasis {
    color: #c9d1d9;
    font-style: italic;
  }
  & .hljs-strong {
    color: #c9d1d9;
    font-weight: 700;
  }
\`;

export const Body = styled.div<{ theme: Theme }>\`
  background: #ffffff;
  border-bottom-left-radius: \${({ theme }) => theme.spacing.radius.lg};
  border-bottom-right-radius: \${({ theme }) => theme.spacing.radius.lg};
  color: #24292f;
  padding: 20px 0;
  font-family: \${({ theme }) => theme.fonts.mono};
  text-align: left;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100dvh - 400px);
  \${thinScrollbar};
  \${({ theme }) => styledCode(theme)};
  \${lightSyntaxHighlight};

  /* The 20px side gutter sits on the <code> element instead of the Body so it
     scrolls with the content: the right gutter survives a scroll to the end of
     a long line, and diff rows can bleed back through it to the window edge. */
  & .hljs {
    display: block;
    width: 100%;
    min-width: min-content;
    padding: 0 20px;
  }

  /* Diff rows: highlight.js wraps each +/- line in its own span, so tinting it
     edge to edge reads like a GitHub diff. inline-table keeps the trailing
     newline as the line break instead of adding an empty row, and the negative
     margin pulls the row back through the gutter so the accent bar sits flush
     against the window edge. border-left + padding-left add up to the same
     20px, keeping the code itself aligned with the untouched lines. The tints
     are the success/error tokens at low alpha, so a custom theme.json palette
     carries through and the syntax colors underneath stay legible. */
  & .hljs-addition,
  & .hljs-deletion {
    display: inline-table;
    width: calc(100% + 40px);
    margin: 0 -20px;
    padding: 0 20px 0 17px;
    border-left: solid 3px transparent;
  }

  & .hljs-addition {
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.success} 12%, transparent)\`};
    border-left-color: \${({ theme }) => theme.colors.success};
  }

  & .hljs-deletion {
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.error} 12%, transparent)\`};
    border-left-color: \${({ theme }) => theme.colors.error};
  }

  :root.dark & {
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.primaryLight} 5%, transparent)\`};
    color: #ffffff;
    \${darkSyntaxHighlight};

    /* The tints sit on a near-black surface in dark mode, so they need a few
       more points of alpha to read at the same strength as in light. */
    & .hljs-addition {
      background: \${({ theme }) =>
        \`color-mix(in srgb, \${theme.colors.success} 16%, transparent)\`};
    }

    & .hljs-deletion {
      background: \${({ theme }) =>
        \`color-mix(in srgb, \${theme.colors.error} 16%, transparent)\`};
    }
  }
\`;
`;
