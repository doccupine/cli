export const modernCodeStylesTemplate = `"use client";
import styled, { css } from "styled-components";
import { resetButton } from "cherry-styled-components";
import { Theme } from "@/app/theme";
import { thinScrollbar } from "@/components/layout/SharedStyled";

export const CodeWrapper = styled.span<{ theme: Theme }>\`
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  border-radius: \${({ theme }) => theme.spacing.radius.lg};
  /* The code body is the page surface in light mode and a faint ink lift in
     dark; the header strip sits one tone above it. Rules are ink mixed into
     the surface, so they stay visible on any palette. */
  --code-surface: \${({ theme }) => theme.colors.light};
  --code-header: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.dark} 3%, \${theme.colors.light})\`};
  --code-rule: \${({ theme }) =>
    \`color-mix(in srgb, \${theme.colors.dark} 8%, \${theme.colors.light})\`};
  border: solid 1px
    \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 11%, \${theme.colors.light})\`};
  background: var(--code-surface);
  overflow: hidden;

  :root.dark & {
    --code-surface: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 2.5%, \${theme.colors.light})\`};
    --code-header: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 5%, \${theme.colors.light})\`};
  }

  /* Long lines scroll sideways. Fade their clipped end into the surface over
     the same 16px the code is inset on the left, so the text never runs
     flush into the right edge. */
  &::after {
    content: "";
    position: absolute;
    top: 40px;
    right: 0;
    bottom: 0;
    width: 16px;
    pointer-events: none;
    background: linear-gradient(to right, transparent, var(--code-surface));
  }
\`;

/* Slim header: the file name or language on the left, the copy button on the
   right. Code blocks use a fixed GitHub-style palette for the syntax tokens in
   both modes so highlighting stays legible regardless of brand colors; the
   surface is a faint ink wash that follows the mode. Dark variants live in
   :root.dark & blocks so the swap happens via the active <html> class with no
   re-render. */
export const TopBar = styled.div<{ theme: Theme }>\`
  position: relative;
  height: 40px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 0 4px 0 16px;
  background: var(--code-header);
  border-bottom: solid 1px var(--code-rule);
\`;

/* Kept for the shared export surface of this module; the modern code block
   shows a label instead of window dots. */
export const DotsContainer = styled.div\`
  display: none;
\`;

export const Dot = styled.span\`
  display: none;
\`;

/* Icon-only copy button: the 32px ghost square of the chat and search
   controls, centered in the 40px header; success-tinted once copied. */
export const CopyButton = styled.button<{ theme: Theme; $copied: boolean }>\`
  \${resetButton}
  box-sizing: border-box;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: \${({ theme }) => theme.spacing.radius.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease;

  & svg.lucide {
    width: 15px;
    height: 15px;
    margin: 0;
    color: \${({ theme, $copied }) =>
      $copied ? theme.colors.success : theme.colors.grayDark};
    transition: color 0.2s ease;
  }

  &:hover {
    background: \${({ theme }) =>
      \`color-mix(in srgb, \${theme.colors.dark} 6%, transparent)\`};

    & svg.lucide {
      color: \${({ theme, $copied }) =>
        $copied ? theme.colors.success : theme.colors.dark};
    }
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
  }
\`;

/* The block's label: its file name when the fence names one, otherwise its
   language. */
export const TopBarTitle = styled.span<{ theme: Theme }>\`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 20px;
  font-weight: 500;
  color: \${({ theme }) => theme.colors.grayDark};
\`;

/* Text tabs in the header for CodeTabs, the active one underlined. Scrolls
   horizontally with the thin scrollbar when the labels overflow. */
export const TabList = styled.div<{ theme: Theme }>\`
  display: flex;
  align-items: stretch;
  align-self: stretch;
  gap: 16px;
  min-width: 0;
  overflow-x: auto;
  \${thinScrollbar};
\`;

export const CodeTabButton = styled.button<{ theme: Theme; $active: boolean }>\`
  \${resetButton}
  flex: 0 0 auto;
  position: relative;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  padding: 0;
  cursor: pointer;
  white-space: nowrap;
  background: transparent;
  color: \${({ theme, $active }) =>
    $active ? theme.colors.dark : theme.colors.grayDark};
  transition: color 0.2s ease;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    /* Inside the tab strip, which scrolls and would clip anything below it,
       resting on the header rule. */
    bottom: 0;
    height: 2px;
    border-radius: 2px;
    background: \${({ theme, $active }) =>
      $active ? theme.colors.dark : "transparent"};
  }

  &:hover {
    color: \${({ theme }) => theme.colors.dark};
  }

  &:focus-visible {
    outline: none;
    border-radius: \${({ theme }) => theme.spacing.radius.xs};
    box-shadow: inset 0 0 0 2px \${({ theme }) => theme.colors.primaryLight};
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
  background: transparent;
  color: #24292f;
  padding: 14px 0;
  font-family: \${({ theme }) => theme.fonts.mono};
  text-align: left;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100dvh - 400px);
  \${thinScrollbar};
  font-size: \${({ theme }) => theme.fontSizes.small.lg};
  line-height: 24px;
  \${lightSyntaxHighlight};

  /* The 16px side gutter sits on the <code> element instead of the Body so it
     scrolls with the content: the right gutter survives a scroll to the end of
     a long line, and diff rows can bleed back through it to the window edge. */
  & .hljs {
    background: transparent;
    display: block;
    width: 100%;
    min-width: min-content;
    padding: 0 16px;
  }

  /* Diff rows: highlight.js wraps each +/- line in its own span, so tinting it
     edge to edge reads like a GitHub diff. inline-table keeps the trailing
     newline as the line break instead of adding an empty row, and the negative
     margin pulls the row back through the gutter so the accent bar sits flush
     against the window edge. border-left + padding-left add up to the same
     16px, keeping the code itself aligned with the untouched lines. The tints
     are the success/error tokens at low alpha, so a custom theme.json palette
     carries through and the syntax colors underneath stay legible. */
  & .hljs-addition,
  & .hljs-deletion {
    display: inline-table;
    width: calc(100% + 32px);
    margin: 0 -16px;
    padding: 0 16px 0 13px;
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
