import type { DesignStyles } from "./index.js";
import { squareButtonRules } from "./controls.js";

// Code blocks and <CodeTabs> (components/layout/Code.tsx): the window, its
// top bar, the copy button and the syntax palettes.
//
//   .dcp-code            the window (also carries .code-wrapper, which list
//                        items in the article space out)
//   .dcp-code__bar       the top bar
//   .dcp-code__dots      the classic window dots (.dcp-code__dot)
//   .dcp-code__title     the file name (classic) or file name / language
//                        (modern)
//   .dcp-code__copy      the copy button; data-copied once copied
//   .dcp-code__tabs      the CodeTabs tablist, its tabs .dcp-code__tab
//                        (aria-selected="true" is the active one)
//   .dcp-code__body      the highlighted code (also .code-wrapper-body)
//
// Every rule is a design rule: code blocks sit inside the article, whose
// prose rules (docs.ts) live in the design layer, and the block's rules must
// keep winning their ties with them. The syntax tokens use a fixed
// GitHub-style palette in both modes so highlighting stays legible whatever
// the brand colors; the dark variants are :root.dark rules, so the swap
// follows the mode with no re-render.

/** GitHub Light (light) and GitHub Dark (dark) token colors. */
const SYNTAX: [string[], string, string, string?][] = [
  [
    [
      ".hljs-doctag",
      ".hljs-keyword",
      ".hljs-meta .hljs-keyword",
      ".hljs-template-tag",
      ".hljs-template-variable",
      ".hljs-type",
      ".hljs-variable.language_",
    ],
    "#cf222e",
    "#ff7b72",
  ],
  [
    [
      ".hljs-title",
      ".hljs-title.class_",
      ".hljs-title.class_.inherited__",
      ".hljs-title.function_",
    ],
    "#8250df",
    "#d2a8ff",
  ],
  [
    [
      ".hljs-attr",
      ".hljs-attribute",
      ".hljs-literal",
      ".hljs-meta",
      ".hljs-number",
      ".hljs-operator",
      ".hljs-selector-attr",
      ".hljs-selector-class",
      ".hljs-selector-id",
      ".hljs-variable",
    ],
    "#0550ae",
    "#79c0ff",
  ],
  [
    [".hljs-meta .hljs-string", ".hljs-regexp", ".hljs-string"],
    "#0a3069",
    "#a5d6ff",
  ],
  [[".hljs-built_in", ".hljs-symbol"], "#953800", "#ffa657"],
  [[".hljs-code", ".hljs-comment", ".hljs-formula"], "#6e7781", "#8b949e"],
  [
    [
      ".hljs-name",
      ".hljs-quote",
      ".hljs-selector-pseudo",
      ".hljs-selector-tag",
    ],
    "#116329",
    "#7ee787",
  ],
  [[".hljs-subst"], "#24292f", "#c9d1d9"],
  [[".hljs-section"], "#0550ae", "#1f6feb", "font-weight: 700;"],
  [[".hljs-bullet"], "#953800", "#f2cc60"],
  [[".hljs-emphasis"], "#24292f", "#c9d1d9", "font-style: italic;"],
  [[".hljs-strong"], "#24292f", "#c9d1d9", "font-weight: 700;"],
];

/** One mode's syntax palette, scoped to `scope` (the code body). */
function syntax(scope: string, dark: boolean): string {
  const base = dark
    ? `${scope} .hljs {
  color: #c9d1d9;
  background: transparent;
}`
    : `${scope} .hljs {
  color: #24292f;
  background: #ffffff;
}`;
  const rules = SYNTAX.map(([selectors, light, darkColor, extra]) => {
    const list = selectors
      .map((selector) => `${scope} ${selector}`)
      .join(",\n");
    const declarations = [`  color: ${dark ? darkColor : light};`];
    if (extra) declarations.push(`  ${extra}`);
    return `${list} {\n${declarations.join("\n")}\n}`;
  });
  return [base, ...rules].join("\n\n");
}

const classic = `.dcp-code {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  border-radius: 12px;
  border: solid 1px var(--color-grayLight);
  background: var(--color-light);
}

/* The dark-mode body matches the left sidebar's translucent brand tint
   instead of GitHub's #0d1117, so the window sits on the same background as
   the navigation. */
.dcp-code__bar {
  position: relative;
  background: color-mix(in srgb, var(--color-primaryLight) 5%, transparent);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom: solid 1px var(--color-grayLight);
  /* The modern design's header height, so both designs' code windows have
     the same bar (and room for the 32px copy button). */
  height: 40px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
}

.dcp-code__dots {
  display: flex;
  gap: 5px;
}

.dcp-code__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
}

:root.dark .dcp-code__dot {
  background: rgba(255, 255, 255, 0.1);
}

/* Icon-only copy button: the shared 32px ghost square, like the dialogs'
   close buttons, success-tinted once copied. */
${squareButtonRules(".dcp-code__copy")}

.dcp-code__copy {
  flex-shrink: 0;
  margin: 0 -6px 0 0;
}

/* svg.lucide outranks the article's own icon color (.dcp-docs .lucide). */
.dcp-code__copy svg.lucide {
  margin: 0;
  color: var(--color-grayDark);
}

.dcp-code__copy:hover svg.lucide {
  color: var(--color-dark);
}

.dcp-code__copy:where([data-copied]) svg.lucide,
.dcp-code__copy:where([data-copied]):hover svg.lucide {
  color: var(--color-success);
}

/* Centered file name, over the flex row so the dots and the copy button keep
   their edge alignment; clicks fall through it. */
.dcp-code__title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  font-family: "Roboto Mono", monospace;
  font-size: 12px;
  line-height: 2;
  color: var(--color-grayDark);
}

/* Segmented control in the top bar for CodeTabs; scrolls sideways when the
   labels overflow the bar. */
.dcp-code__tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
  padding: 2px;
  margin-left: -8px;
}

.dcp-code__tab {
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  outline: none;
  flex: 0 0 auto;
  font-family: "Roboto Mono", monospace;
  font-size: 12px;
  line-height: 1;
  padding: 5px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
  border: solid 1px transparent;
  background: transparent;
  color: var(--color-grayDark);
  box-shadow: 0 0 0 0px var(--color-primary);
}

.dcp-code__tab:where([aria-selected="true"]) {
  border: solid 1px var(--color-grayLight);
  background: var(--color-light);
  color: var(--color-dark);
}

.dcp-code__tab:hover {
  border-color: var(--color-primary);
  color: var(--color-dark);
  background: color-mix(in srgb, var(--color-dark) 4%, transparent);
}

.dcp-code__tab:where([aria-selected="true"]):hover {
  background: var(--color-light);
}

.dcp-code__tab:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-code__tab:active {
  box-shadow: 0 0 0 1px var(--color-primaryLight);
}

.dcp-code__body {
  background: #ffffff;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  color: #24292f;
  padding: 20px 0;
  font-family: "Roboto Mono", monospace;
  text-align: left;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100dvh - 400px);
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
  font-size: 14px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-code__body {
    font-size: 16px;
    line-height: 1.7;
  }
}

${syntax(".dcp-code__body", false)}

/* The 20px side gutter sits on the <code> element instead of the body so it
   scrolls with the content: the right gutter survives a scroll to the end of
   a long line, and diff rows can bleed back through it to the window edge. */
.dcp-code__body .hljs {
  display: block;
  width: 100%;
  min-width: min-content;
  padding: 0 20px;
}

/* Diff rows: highlight.js wraps each +/- line in its own span, so tinting it
   edge to edge reads like a GitHub diff. inline-table keeps the trailing
   newline as the line break instead of adding an empty row, and the negative
   margin pulls the row back through the gutter so the accent bar sits flush
   against the window edge. The tints are the success/error tokens at low
   alpha, so a custom palette carries through. */
.dcp-code__body .hljs-addition,
.dcp-code__body .hljs-deletion {
  display: inline-table;
  width: calc(100% + 40px);
  margin: 0 -20px;
  padding: 0 20px 0 17px;
  border-left: solid 3px transparent;
}

.dcp-code__body .hljs-addition {
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  border-left-color: var(--color-success);
}

.dcp-code__body .hljs-deletion {
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
  border-left-color: var(--color-error);
}

:root.dark .dcp-code__body {
  background: color-mix(in srgb, var(--color-primaryLight) 5%, transparent);
  color: #ffffff;
}

${syntax(":root.dark .dcp-code__body", true)}

/* The tints sit on a near-black surface in dark mode, so they need a few more
   points of alpha to read at the same strength as in light. */
:root.dark .dcp-code__body .hljs-addition {
  background: color-mix(in srgb, var(--color-success) 16%, transparent);
}

:root.dark .dcp-code__body .hljs-deletion {
  background: color-mix(in srgb, var(--color-error) 16%, transparent);
}`;

const modern = `/* The body is the page surface in light mode and a faint ink lift in dark;
   the header strip sits one tone above it. Rules are ink mixed into the
   surface, so they stay visible on any palette. */
.dcp-code {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  border-radius: 12px;
  --code-surface: var(--color-light);
  --code-header: color-mix(in srgb, var(--color-dark) 3%, var(--color-light));
  --code-rule: color-mix(in srgb, var(--color-dark) 8%, var(--color-light));
  border: solid 1px
    color-mix(in srgb, var(--color-dark) 11%, var(--color-light));
  background: var(--code-surface);
  overflow: hidden;
}

:root.dark .dcp-code {
  --code-surface: color-mix(
    in srgb,
    var(--color-dark) 2.5%,
    var(--color-light)
  );
  --code-header: color-mix(in srgb, var(--color-dark) 5%, var(--color-light));
}

/* Long lines scroll sideways. Fade their clipped end into the surface over
   the same 16px the code is inset on the left. */
.dcp-code::after {
  content: "";
  position: absolute;
  top: 40px;
  right: 0;
  bottom: 0;
  width: 16px;
  pointer-events: none;
  background: linear-gradient(to right, transparent, var(--code-surface));
}

/* Slim header: the file name or language on the left, the copy button on the
   right. */
.dcp-code__bar {
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
}

/* Icon-only copy button: the shared 32px ghost square, centered in the 40px
   header, success-tinted once copied. */
${squareButtonRules(".dcp-code__copy")}

.dcp-code__copy {
  flex-shrink: 0;
}

/* svg.lucide outranks the article's own icon color (.dcp-docs .lucide). */
.dcp-code__copy svg.lucide {
  margin: 0;
  color: var(--color-grayDark);
}

.dcp-code__copy:hover svg.lucide {
  color: var(--color-dark);
}

.dcp-code__copy:where([data-copied]) svg.lucide,
.dcp-code__copy:where([data-copied]):hover svg.lucide {
  color: var(--color-success);
}

/* The block's label: its file name when the fence names one, otherwise its
   language. */
.dcp-code__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 20px;
  font-weight: 500;
  color: var(--color-grayDark);
}

/* Text tabs in the header for CodeTabs, the active one underlined. */
.dcp-code__tabs {
  display: flex;
  align-items: stretch;
  align-self: stretch;
  gap: 16px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

.dcp-code__tab {
  box-sizing: border-box;
  appearance: none;
  border: none;
  margin: 0;
  outline: none;
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
  color: var(--color-grayDark);
  transition: color 0.2s ease;
}

.dcp-code__tab:where([aria-selected="true"]) {
  color: var(--color-dark);
}

/* Inside the tab strip, which scrolls and would clip anything below it,
   resting on the header rule. */
.dcp-code__tab::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: transparent;
}

.dcp-code__tab:where([aria-selected="true"])::after {
  background: var(--color-dark);
}

.dcp-code__tab:hover {
  color: var(--color-dark);
}

.dcp-code__tab:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: inset 0 0 0 2px var(--color-primaryLight);
}

.dcp-code__body {
  background: transparent;
  color: #24292f;
  padding: 14px 0;
  font-family: "Roboto Mono", monospace;
  text-align: left;
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100dvh - 400px);
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
  font-size: 14px;
  line-height: 24px;
}

${syntax(".dcp-code__body", false)}

/* The 16px side gutter sits on the <code> element instead of the body so it
   scrolls with the content (see the classic note). */
.dcp-code__body .hljs {
  background: transparent;
  display: block;
  width: 100%;
  min-width: min-content;
  padding: 0 16px;
}

.dcp-code__body .hljs-addition,
.dcp-code__body .hljs-deletion {
  display: inline-table;
  width: calc(100% + 32px);
  margin: 0 -16px;
  padding: 0 16px 0 13px;
  border-left: solid 3px transparent;
}

.dcp-code__body .hljs-addition {
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  border-left-color: var(--color-success);
}

.dcp-code__body .hljs-deletion {
  background: color-mix(in srgb, var(--color-error) 12%, transparent);
  border-left-color: var(--color-error);
}

:root.dark .dcp-code__body {
  color: #ffffff;
}

${syntax(":root.dark .dcp-code__body", true)}

:root.dark .dcp-code__body .hljs-addition {
  background: color-mix(in srgb, var(--color-success) 16%, transparent);
}

:root.dark .dcp-code__body .hljs-deletion {
  background: color-mix(in srgb, var(--color-error) 16%, transparent);
}`;

export const codeStyles: DesignStyles = { classic, modern };
