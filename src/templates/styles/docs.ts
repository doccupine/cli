import type { DesignStyles } from "./index.js";

// The docs frame (components/layout/DocsComponents.tsx, components/Docs.tsx):
// the page wrapper, the <main> article column with its prose rules, and the
// markdown column inside it.
//
//   .dcp-docs-wrapper     wraps the rails and the article (DocsWrapper)
//   .dcp-docs             the <main> article column (DocsContainer);
//                         data-chat-open while the chat panel takes the right
//                         side
//   .dcp-docs__body       the row around the markdown column
//   .dcp-docs__content    the markdown column, capped at the content width
//   .dcp-docs-sidebar     DocsSidebar
//
// The article column reserves the rails' width as padding from "lg" up, the
// chat panel's while it is open, and the wider side panel's from "xl" when a
// <SidePanel> is on the page (read through :has(), so it is right on first
// paint). Focus mode (data-focus-mode on <html>) drops the rails' padding,
// unless the chat is open.
export const docsStyles: DesignStyles = {
  shared: `.dcp-docs-sidebar {
  clear: both;
}

.dcp-docs__body {
  display: flex;
  flex-flow: row wrap;
  place-content: stretch flex-start;
  align-items: stretch;
  gap: 20px;
}

.dcp-docs__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  max-width: var(--layout-content-width);
  margin: auto;
}`,
  classic: `.dcp-docs-wrapper {
  position: relative;
}

.dcp-docs {
  position: relative;
  padding: 0 20px 100px 20px;
  width: 100%;
  font-size: 14px;
  line-height: 1.7;
  transition: all 0.3s ease;
}

@media screen and (min-width: 992px) {
  .dcp-docs {
    font-size: 16px;
    line-height: 1.7;
    padding: 0 calc(var(--layout-toc-width) + var(--layout-gutter)) 80px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }

  .dcp-docs[data-chat-open] {
    padding: 0 calc(var(--layout-chat-width) + var(--layout-gutter)) 80px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 1200px) {
  body:has([data-side-panel]) .dcp-docs {
    padding-right: calc(var(--layout-chat-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 992px) {
  html[data-focus-mode] .dcp-docs:not([data-chat-open]) {
    padding-left: 20px;
    padding-right: 20px;
  }
}

/* Content blocks come later in this layer, so a block's own "p" rule of the
   same specificity wins over the article color. */
.dcp-docs p {
  color: var(--color-grayDark);
  hyphens: auto;
}

/* A fenced block without a language renders as a plain <pre>: let a long
   line scroll inside it instead of widening the page. */
.dcp-docs pre {
  max-width: 100%;
  overflow-x: auto;
}

.dcp-docs a:not([class]):not(:has(img)) {
  color: inherit;
  transition: all 0.3s ease;
  text-decoration: none;
  box-shadow: 0 2px 0 0 var(--color-primary);
}

.dcp-docs a:not([class]):not(:has(img)):hover {
  color: var(--color-accent);
  box-shadow: 0 1px 0 0 var(--color-primary);
}

/* The global focus glow, layered over the link's own box-shadow underline
   (the same property) so the underline stays. */
.dcp-docs a:not([class]):not(:has(img)):focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow:
    0 2px 0 0 var(--color-primary),
    0 0 0 2px var(--color-primaryLight);
}

.dcp-docs ul li > .code-wrapper,
.dcp-docs ol li > .code-wrapper {
  margin: 10px 0;
}

.dcp-docs ul li p,
.dcp-docs ol li p {
  display: inline;
}

.dcp-docs ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dcp-docs ul li {
  text-indent: 0;
  display: block;
  position: relative;
  padding: 0 0 0 24px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  min-height: 23px;
}

.dcp-docs ul li::before {
  content: "";
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  position: absolute;
  top: 8px;
  left: 9px;
}

@media screen and (min-width: 992px) {
  .dcp-docs ul li {
    font-size: 16px;
    line-height: 1.7;
    min-height: 27px;
  }

  .dcp-docs ul li::before {
    top: 10px;
  }
}

.dcp-docs ol {
  counter-reset: item;
  padding: 0;
  margin: 0;
}

.dcp-docs ol > li {
  counter-increment: item;
  padding: 0 0 0 24px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-docs ol > li {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-docs ol > li::before {
  content: counter(item) ".";
  display: inline-block;
  min-width: 20px;
  margin-left: -24px;
  margin-right: 4px;
  text-align: right;
  font-weight: 700;
  color: var(--color-primary);
}

.dcp-docs .table-wrapper {
  overflow-x: auto;
  width: 100%;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

.dcp-docs table {
  margin: 0;
  padding: 0;
  border-collapse: collapse;
  width: 100%;
  text-align: left;
}

.dcp-docs table tr {
  margin: 0;
  padding: 0;
}

.dcp-docs table th {
  border-bottom: solid 1px var(--color-grayLight);
  padding: 10px 10px 10px 0;
  font-size: 12px;
  line-height: 1.7;
  font-weight: 600;
  color: var(--color-dark);
}

.dcp-docs table td {
  border-bottom: solid 1px var(--color-grayLight);
  padding: 10px 10px 10px 0;
  color: var(--color-grayDark);
  font-size: 12px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-docs table th,
  .dcp-docs table td {
    font-size: 14px;
    line-height: 1.7;
  }
}

.dcp-docs img,
.dcp-docs video,
.dcp-docs iframe {
  max-width: 100%;
  border-radius: 12px;
}

.dcp-docs code:not([class]),
.dcp-docs kbd {
  max-width: max-content;
  background: color-mix(in srgb, var(--color-primaryLight) 20%, transparent);
  color: var(--color-dark);
  padding: 2px 4px;
  border-radius: 6px;
  /* Short values stay whole (break-word never narrows a table column); long
     ones, marked data-long by InlineCode, may break anywhere. Code is never
     hyphenated, even where the prose around it is. */
  overflow-wrap: break-word;
  hyphens: none;
}

.dcp-docs code:not([class])[data-long] {
  overflow-wrap: anywhere;
}

.dcp-docs .lucide {
  color: var(--color-primary);
}

.dcp-docs .aspect-video {
  aspect-ratio: 16 / 9;
  border-radius: 12px;
}`,
  modern: `/* Below "lg" the wrapper stays unpositioned, so the sidebar's menu button
   (absolute) is placed against the page and lands in the header's top row. */
@media screen and (min-width: 992px) {
  .dcp-docs-wrapper {
    position: relative;
  }
}

.dcp-docs {
  position: relative;
  padding: 24px var(--layout-gutter) 72px;
  width: 100%;
  font-size: 16px;
  line-height: 1.75;
  color: color-mix(in srgb, var(--color-dark) 82%, var(--color-light));
  transition: all 0.3s ease;
}

@media screen and (min-width: 992px) {
  .dcp-docs {
    padding: 32px calc(var(--layout-toc-width) + var(--layout-gutter)) 72px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }

  .dcp-docs[data-chat-open] {
    padding: 32px calc(var(--layout-chat-width) + var(--layout-gutter)) 72px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 1200px) {
  body:has([data-side-panel]) .dcp-docs {
    padding-right: calc(var(--layout-chat-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 992px) {
  html[data-focus-mode] .dcp-docs:not([data-chat-open]) {
    padding-left: 20px;
    padding-right: 20px;
  }
}

/* The base layer paints every p and li in the full ink color; body copy in
   the article is a step softer. Blocks that tint their own text (callouts,
   cards) restate it on their own p rules, which come later in this layer. */
.dcp-docs p,
.dcp-docs li {
  color: color-mix(in srgb, var(--color-dark) 82%, var(--color-light));
}

.dcp-docs h1,
.dcp-docs h2,
.dcp-docs h3,
.dcp-docs h4,
.dcp-docs h5,
.dcp-docs h6 {
  color: var(--color-dark);
  font-weight: 600;
  scroll-margin-top: 24px;
}

.dcp-docs h1 {
  font-size: 30px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

@media screen and (min-width: 992px) {
  .dcp-docs h1 {
    font-size: 36px;
  }
}

/* The paragraph right under the page title reads as its lead. */
.dcp-docs h1:first-child + p {
  font-size: 18px;
  line-height: 28px;
  color: color-mix(in srgb, var(--color-dark) 64%, var(--color-light));
  margin-top: -8px;
}

.dcp-docs h2 {
  font-size: 24px;
  line-height: 1.35;
  letter-spacing: -0.015em;
  margin-top: 20px;
}

.dcp-docs h3 {
  font-size: 20px;
  line-height: 1.4;
  letter-spacing: -0.01em;
  margin-top: 8px;
}

.dcp-docs h4 {
  font-size: 18px;
  line-height: 1.5;
}

.dcp-docs h5,
.dcp-docs h6 {
  font-size: 16px;
  line-height: 1.5;
}

.dcp-docs strong,
.dcp-docs b {
  color: var(--color-dark);
  font-weight: 600;
}

/* A fenced block without a language renders as a plain <pre>: let a long
   line scroll inside it instead of widening the page. */
.dcp-docs pre {
  max-width: 100%;
  overflow-x: auto;
}

/* Content links: accent text over a faint underline that strengthens on
   hover. The resting underline stays so links never rely on color alone. */
.dcp-docs a:not([class]):not(:has(img)) {
  color: var(--color-accent);
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: color-mix(
    in srgb,
    var(--color-accent) 35%,
    transparent
  );
}

.dcp-docs a:not([class]):not(:has(img)):hover {
  text-decoration-color: var(--color-accent);
}

.dcp-docs a:not([class]):not(:has(img)):focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

/* Lists: small muted bullets and muted numbers, so the text leads. */
.dcp-docs ul > li + li,
.dcp-docs ol > li + li {
  margin-top: 6px;
}

.dcp-docs ul li > .code-wrapper,
.dcp-docs ol li > .code-wrapper {
  margin: 10px 0;
}

.dcp-docs ul li p,
.dcp-docs ol li p {
  display: inline;
}

.dcp-docs ul li ul,
.dcp-docs ol li ul,
.dcp-docs ul li ol,
.dcp-docs ol li ol {
  margin-top: 6px;
}

.dcp-docs ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dcp-docs ul li {
  text-indent: 0;
  display: block;
  position: relative;
  padding: 0 0 0 22px;
  margin: 0;
}

.dcp-docs ul li::before {
  content: "";
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-gray);
  position: absolute;
  top: calc(0.875em - 2px);
  left: 6px;
}

.dcp-docs ol {
  counter-reset: item;
  padding: 0;
  margin: 0;
}

.dcp-docs ol > li {
  counter-increment: item;
  padding: 0 0 0 22px;
  margin: 0;
}

.dcp-docs ol > li::before {
  content: counter(item) ".";
  display: inline-block;
  min-width: 18px;
  margin-left: -22px;
  margin-right: 4px;
  text-align: right;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--color-grayDark);
}

.dcp-docs .table-wrapper {
  overflow-x: auto;
  width: 100%;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

.dcp-docs table {
  margin: 0;
  padding: 0;
  border-collapse: collapse;
  width: 100%;
  text-align: left;
}

.dcp-docs table tr {
  margin: 0;
  padding: 0;
}

.dcp-docs table th {
  border-bottom: solid 1px var(--color-grayLight);
  padding: 10px 10px 10px 0;
  font-size: 12px;
  line-height: 1.7;
  font-weight: 600;
  color: var(--color-dark);
}

.dcp-docs table td {
  border-bottom: solid 1px var(--color-grayLight);
  padding: 10px 10px 10px 0;
  color: var(--color-grayDark);
  font-size: 12px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-docs table th,
  .dcp-docs table td {
    font-size: 14px;
    line-height: 1.7;
  }
}

.dcp-docs img,
.dcp-docs video,
.dcp-docs iframe {
  max-width: 100%;
  border-radius: 12px;
}

.dcp-docs code:not([class]),
.dcp-docs kbd {
  max-width: max-content;
  font-size: 0.875em;
  background: color-mix(in srgb, var(--color-dark) 5%, transparent);
  border: solid 1px color-mix(in srgb, var(--color-dark) 8%, transparent);
  color: var(--color-dark);
  padding: 1px 5px;
  border-radius: 6px;
  /* Short values stay whole (break-word never narrows a table column); long
     ones, marked data-long by InlineCode, may break anywhere. Code is never
     hyphenated, even where the prose around it is. */
  overflow-wrap: break-word;
  hyphens: none;
}

.dcp-docs code:not([class])[data-long] {
  overflow-wrap: anywhere;
}

.dcp-docs .lucide {
  color: var(--color-grayDark);
}

.dcp-docs .aspect-video {
  aspect-ratio: 16 / 9;
  border-radius: 12px;
}`,
};
