// Stylesheets of a generated site
// ================================
//
// Generated sites style with plain global CSS: no CSS-in-JS runtime, no
// per-instance <style> tags, class names that stay the same from build to
// build so site authors can target them from their own CSS. The root layout
// (src/lib/layout.ts) imports, in this order:
//
//   app/styles/reset.css       declares the layer order, then the resets
//   app/styles/tokens.css      colors and shadows, generated from theme.json
//                              (styles/tokens.ts)
//   app/styles/base.css        element defaults (body, links, lists, focus)
//   app/styles/components.css  every component rule both designs share
//   app/styles/design.css      the site design's own rules: classic or modern
//
// Cascade layers: `@layer reset, tokens, base, components, design, utilities`.
// A later layer wins over an earlier one whatever the selectors' specificity,
// so a design rule overrides a shared component rule without fighting it, and
// unlayered CSS (a site author's own stylesheet) wins over all of them.
//
// Conventions for a component
// ---------------------------
// - Class names: `dcp-<block>` for a component's root, `dcp-<block>__<part>`
//   for the pieces inside it (`dcp-header`, `dcp-header__inner`). Blocks are
//   kebab-case and unique across the site. Pieces several components
//   reuse are shared classes of their own (controls.ts) (`dcp-pill`, ...), added
//   next to the block's class in the markup.
// - Variants and state are data attributes, never extra class names:
//   boolean ones present or absent (`data-active`, written as
//   `data-active={active || undefined}`), enumerated ones with a value
//   (`data-size="small"`). Prefer the platform's own state where it exists:
//   `[open]` on <dialog>/<details>, `:popover-open`, `[aria-expanded="true"]`,
//   `[aria-current="page"]`.
// - Continuous values (a width, a position, an author's color, a column count)
//   are inline custom properties set by the component,
//   `style={{ "--dcp-columns": count } as React.CSSProperties}`, read in CSS
//   as `var(--dcp-columns)`.
// - Colors and shadows only through the tokens: `var(--color-primary)`,
//   `var(--shadow-md)`. A value that differs by mode is a token, or a rule
//   under `:root.dark`, never a branch in JS.
// - Page geometry (rail widths, header heights, offsets) through the design's
//   `--layout-*` properties (see `geometry` in each design below), so the
//   shared rules work for both designs.
// - Breakpoints are literal media queries, the theme's values:
//   sm 576px, md 768px, lg 992px, xl 1200px, xxl 1440px, xxxl 1920px,
//   written `@media screen and (min-width: 992px)`.
// - Flat selectors, no CSS nesting, formatted the way Prettier prints CSS
//   (the generated app's format check covers these files).
// - A component file renders plain elements with these class names and keeps
//   "use client" only when it has state, effects or event handlers.
//
// Where a rule goes
// -----------------
// Each area of the site has a module in this directory exporting a
// `DesignStyles` record: `shared` rules land in components.css, `classic` and
// `modern` in design.css for that design. A rule both designs need goes in
// `shared`; a design only adds what differs. The markup is the same for both
// designs except in the few files a design replaces (modernOverrides in
// src/lib/structures.ts), so the class names are shared too.
//
// The rules are written unindented here and wrapped in their layer below.

import { actionBarStyles } from "./action-bar.js";
import { baseCss } from "./base.js";
import { chatStyles } from "./chat.js";
import { controlStyles } from "./controls.js";
import { docsStyles } from "./docs.js";
import { footerStyles } from "./footer.js";
import { headerStyles } from "./header.js";
import { notFoundStyles } from "./not-found.js";
import { pagerStyles } from "./pager.js";
import { resetCss } from "./reset.js";
import { searchStyles } from "./search.js";
import { sidePanelStyles } from "./side-panel.js";
import { sidebarStyles } from "./sidebar.js";
import { siteGateStyles } from "./site-gate.js";
import { tocStyles } from "./toc.js";
import { utilitiesCss } from "./utilities.js";
import { calloutStyles } from "./callout.js";
import { cardStyles } from "./card.js";
import { stepsStyles } from "./steps.js";
import { accordionStyles } from "./accordion.js";
import { tabsStyles } from "./tabs.js";
import { columnsStyles } from "./columns.js";
import { spaceStyles } from "./space.js";
import { fieldStyles } from "./field.js";
import { badgeStyles } from "./badge.js";
import { buttonStyles } from "./button.js";
import { frameStyles } from "./frame.js";
import { updateStyles } from "./update.js";
import { colorSwatchStyles } from "./color-swatch.js";
import { promptStyles } from "./prompt.js";
import { tooltipStyles } from "./tooltip.js";
import { demoThemeStyles } from "./demo-theme.js";
import { spinnerStyles } from "./spinner.js";
import { codeStyles } from "./code.js";
import { copyButtonStyles } from "./copy-button.js";
import { mermaidStyles } from "./mermaid.js";
import { treeStyles } from "./tree.js";
import { apiPlaygroundStyles } from "./api-playground.js";

export type StyleDesign = "classic" | "modern";

/** One area's rules: shared by both designs, or one design's own. */
export interface DesignStyles {
  shared?: string;
  classic?: string;
  modern?: string;
}

/** Page geometry of each design, as `--layout-*` custom properties. */
const geometry: Record<StyleDesign, string> = {
  classic: `:root {
  /* Width of the left navigation rail from "lg" up. */
  --layout-sidebar-width: 280px;
  /* Width of the right rail: the table of contents, or a side panel below "xl". */
  --layout-toc-width: 280px;
  /* Width of the chat panel, and of a side panel from "xl" up. */
  --layout-chat-width: 420px;
  /* Space between a rail and the content column, and the column's own side
     padding on small screens. */
  --layout-gutter: 20px;
  /* Maximum width of the content column (article, pager, footer, links). */
  --layout-content-width: 640px;
  /* Height of the header below "lg", without and with the section bar. */
  --layout-header-height: 62px;
  --layout-header-height-with-sections: 120px;
  /* Width kept free at the right end of the header's top row below "lg",
     where the sidebar's menu button sits over the header. */
  --layout-header-menu-slot: 52px;
  /* Top padding of the fixed rails, clearing the header. */
  --layout-rail-top: 82px;
  /* scroll-padding-top of the page, so anchor targets land below the header. */
  --layout-scroll-padding-top: 80px;
}`,
  modern: `:root {
  /* Width of the left navigation rail from "lg" up. */
  --layout-sidebar-width: 264px;
  /* Width of the right rail: the table of contents, or a side panel below "xl". */
  --layout-toc-width: 240px;
  /* Width of the chat panel, and of a side panel from "xl" up. */
  --layout-chat-width: 420px;
  /* Space between a rail and the content column, and the column's own side
     padding on small screens. */
  --layout-gutter: 24px;
  /* Maximum width of the content column (article, pager, footer, links). */
  --layout-content-width: 680px;
  /* Height of the header below "lg", without and with the section bar. */
  --layout-header-height: 56px;
  --layout-header-height-with-sections: 100px;
  /* Width kept free at the right end of the header's top row below "lg",
     where the sidebar's menu button sits over the header. */
  --layout-header-menu-slot: 52px;
  /* Top padding of the fixed rails, clearing the header. */
  --layout-rail-top: 88px;
  /* scroll-padding-top of the page, so anchor targets land below the header. */
  --layout-scroll-padding-top: 88px;
}`,
};

/** Component areas, in the order their rules are written. */
const AREAS: DesignStyles[] = [
  controlStyles,
  docsStyles,
  headerStyles,
  sidebarStyles,
  tocStyles,
  actionBarStyles,
  pagerStyles,
  footerStyles,
  sidePanelStyles,
  searchStyles,
  chatStyles,
  notFoundStyles,
  siteGateStyles,
  // Content components, after the frame: inside the article they win ties
  // with its prose rules (docs.ts).
  calloutStyles,
  cardStyles,
  stepsStyles,
  accordionStyles,
  tabsStyles,
  columnsStyles,
  spaceStyles,
  fieldStyles,
  badgeStyles,
  buttonStyles,
  frameStyles,
  updateStyles,
  colorSwatchStyles,
  promptStyles,
  tooltipStyles,
  demoThemeStyles,
  spinnerStyles,
  codeStyles,
  copyButtonStyles,
  mermaidStyles,
  treeStyles,
  apiPlaygroundStyles,
];

/** Indents a block of CSS by two spaces, leaving blank lines empty. */
function indent(css: string): string {
  return css
    .trim()
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");
}

/** `@layer name { ... }` around the given chunks, one blank line apart. */
export function layer(name: string, chunks: (string | undefined)[]): string {
  const body = chunks
    .filter((chunk): chunk is string => Boolean(chunk && chunk.trim()))
    .map(indent)
    .join("\n\n");
  return body ? `@layer ${name} {\n${body}\n}\n` : `@layer ${name} {\n}\n`;
}

/** Top-level rules (@property) that cannot sit inside a layer. */
function topLevel(chunks: (string | undefined)[]): string {
  return chunks
    .filter((chunk): chunk is string => Boolean(chunk && chunk.trim()))
    .map((chunk) => chunk.trim())
    .join("\n\n");
}

const PROPERTY_RULE = /@property [^{]+\{[^}]*\}\n*/g;

function propertyRules(css: string): string {
  return (css.match(PROPERTY_RULE) ?? []).join("\n").trim();
}

function withoutPropertyRules(css: string): string {
  return css.replace(PROPERTY_RULE, "");
}

export const resetStylesheet = resetCss;

export const baseStylesheet = `${layer("base", [baseCss])}
${layer("utilities", [utilitiesCss])}`;

export const componentsStylesheet = (() => {
  const properties = topLevel(
    AREAS.map((area) => area.shared && propertyRules(area.shared)),
  );
  const rules = AREAS.map(
    (area) => area.shared && withoutPropertyRules(area.shared),
  );
  return `/* Component styles both site designs share. See design.css for the
   design's own rules, which win over these. */
${properties ? `${properties}\n\n` : ""}${layer("components", rules)}`;
})();

export function designStylesheet(design: StyleDesign): string {
  const title = design === "modern" ? "Modern" : "Classic";
  return `/* ${title} design: page geometry and the rules that differ from the
   shared component styles in components.css. */
${layer("tokens", [geometry[design]])}
${layer(
  "design",
  AREAS.map((area) => area[design]),
)}`;
}
