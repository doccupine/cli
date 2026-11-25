import type { DesignStyles } from "./index.js";

// The site header (components/layout/Header.tsx) and the section bar inside
// it (components/layout/SectionBar.tsx).
//
// The header sits in normal flow at the top of the page and turns fixed only
// once the page scrolls ([data-pinned]): iOS Safari refuses to color its
// toolbar from the theme-color meta while a sticky or fixed element touches
// the top edge, whatever that element's background. At scroll position zero
// an in-flow header occupies exactly the place a sticky one would, so the
// swap is invisible; .dcp-header-shell holds the header's measured height
// (--dcp-header-height) while it is fixed, so pinning never shifts the page.
export const headerStyles: DesignStyles = {
  shared: `.dcp-header-shell {
  height: var(--dcp-header-height, auto);
}

.dcp-header {
  position: relative;
  top: 0;
  margin: 0;
  z-index: 1000;
  width: 100%;
  border-bottom: solid 1px var(--color-grayLight);
}

.dcp-header[data-pinned] {
  position: fixed;
  left: 0;
}

/* The browser scrolls the page on its compositor thread, a frame or more
   before the scroll handler can pin the header, so on a fast scroll the
   in-flow header used to slide up and snap back. Until it is pinned, a
   scroll-driven animation holds it at the top: it runs on that same thread,
   moving the header down by exactly the distance scrolled (1px per 1px over
   the first 10000px). Once pinned, position: fixed takes over and the
   animation is off. It keeps the header still rather than moving it, so it
   stays on under reduced motion. Browsers without scroll timelines keep the
   JS pinning alone. */
@keyframes dcp-header-hold {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(10000px);
  }
}

@supports (animation-timeline: scroll()) {
  .dcp-header:not([data-pinned]) {
    animation: dcp-header-hold linear both;
    animation-timeline: scroll(root block);
    animation-range: 0px 10000px;
  }
}

.dcp-section-bar {
  display: flex;
  order: 3;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.dcp-section-bar::-webkit-scrollbar {
  display: none;
}

.dcp-section-bar__link {
  text-decoration: none;
  white-space: nowrap;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: fit-content;
  position: relative;
}

.dcp-section-bar__link:focus-visible {
  outline: none;
}`,
  classic: `@media screen and (min-width: 992px) {
  .dcp-header:where(:not([data-sections])) {
    padding-bottom: 16px;
    padding-top: 16px;
  }
}

.dcp-header::before,
.dcp-header::after {
  display: block;
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: var(--color-light);
  z-index: -2;
}

.dcp-header::after {
  background: color-mix(in srgb, var(--color-primaryLight) 5%, transparent);
  z-index: -1;
}

/* Below "lg" the logo takes the room the controls leave and is the last
   thing to give way: it shrinks rather than pushing the controls onto a
   second row. From "lg" it keeps its natural width. */
.dcp-header .logo {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
}

.dcp-header .logo svg,
.dcp-header .logo img {
  margin: auto 0;
  height: auto;
  width: fit-content;
  min-width: 0;
  max-width: min(182px, 100%);
  max-height: 30px;
}

.dcp-header .logo svg [fill]:not(.ignore-fill),
.dcp-header .logo img [fill]:not(.ignore-fill) {
  fill: var(--color-primary);
}

@media screen and (min-width: 992px) {
  .dcp-header .logo {
    flex: 0 1 auto;
    min-width: max-content;
  }

  .dcp-header .logo svg,
  .dcp-header .logo img {
    min-width: fit-content;
    max-width: 182px;
  }
}

.dcp-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 16px 0 0 20px;
}

.dcp-header__inner:where(:not([data-sections])) {
  padding-bottom: 16px;
}

@media screen and (min-width: 992px) {
  .dcp-header__inner {
    flex-wrap: nowrap;
    padding: 0 20px;
  }
}

.dcp-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: fit-content;
  padding-right: 20px;
}

/* The assistant launcher's accessible name is its aria-label, so its visible
   label can drop out on the narrowest phones: from 344px it fits beside the
   widest logo (182px) on one row. */
.dcp-header__actions .dcp-chat-launcher__inner > span {
  display: none;
}

@media screen and (min-width: 344px) {
  .dcp-header__actions .dcp-chat-launcher__inner > span {
    display: inline;
  }
}

@media screen and (min-width: 992px) {
  .dcp-header__actions {
    padding-right: 0;
  }
}

.dcp-section-bar {
  width: calc(100% + 20px);
  margin: 0 0 0 -10px;
  padding: 0;
}

@media screen and (min-width: 992px) {
  .dcp-section-bar {
    padding: 0 10px;
    order: unset;
    width: 100%;
    margin: 0;
    justify-content: flex-end;
  }
}

.dcp-section-bar__link {
  font-size: 14px;
  line-height: 1.7;
  padding: 16px 10px;
  color: var(--color-gray);
  border-bottom: solid 2px transparent;
}

@media screen and (min-width: 992px) {
  .dcp-section-bar__link {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-section-bar__link[data-active] {
  font-weight: 600;
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

/* The bar scrolls horizontally, and overflow-x: auto clips it vertically too,
   so an edge-drawn ring would get shaved top and bottom: the ring is an inset
   pseudo-element instead, and the global link ring is off. */
.dcp-section-bar__link:focus-visible {
  box-shadow: none;
}

.dcp-section-bar__link:focus-visible::after {
  content: "";
  position: absolute;
  inset: 3px;
  border: solid 2px var(--color-primaryLight);
  border-radius: 6px;
  pointer-events: none;
}

.dcp-section-bar__link:hover {
  color: var(--color-primary);
}`,
  modern: `.dcp-header {
  background: color-mix(in srgb, var(--color-light) 88%, transparent);
  /* Prefixed first: the CSS minifier keeps only the last of the pair. */
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  backdrop-filter: saturate(180%) blur(12px);
}

.dcp-header .logo {
  display: flex;
  align-items: center;
  min-width: 0;
  border-radius: 6px;
}

.dcp-header .logo svg,
.dcp-header .logo img {
  height: auto;
  width: fit-content;
  min-width: 0;
  max-width: min(160px, 100%);
  max-height: 26px;
}

.dcp-header .logo svg [fill]:not(.ignore-fill),
.dcp-header .logo img [fill]:not(.ignore-fill) {
  fill: var(--color-dark);
}

/* Logo, section tabs, actions. Below "lg" the tabs wrap onto a second row
   and the top row leaves room for the menu button. From "lg" the logo and
   the actions take equal flexible halves, so the tabs sit centered. */
.dcp-header__inner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 16px;
  min-height: var(--layout-header-height);
  padding: 0 calc(var(--layout-header-menu-slot) + var(--layout-gutter)) 0
    var(--layout-gutter);
}

/* The logo takes the room the controls leave and gives way last: it shrinks
   rather than pushing the controls onto a second row. */
.dcp-header__inner > .logo {
  flex: 1 1 0;
  height: var(--layout-header-height);
}

@media screen and (min-width: 992px) {
  .dcp-header__inner {
    flex-wrap: nowrap;
    padding: 0 var(--layout-gutter);
  }
}

.dcp-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: fit-content;
}

@media screen and (min-width: 992px) {
  .dcp-header__actions {
    flex: 1 1 0;
  }
}

/* Ask AI: icon-only below 390px, like the search pill; the button's
   accessible name is its aria-label. Use with dcp-pill. */
.dcp-header__ask {
  flex-shrink: 0;
  /* Icon-only: an exact 32px circle, like the search button. */
  width: 32px;
  padding: 0;
  justify-content: center;
}

/* Hover like the search button: a primary border on the page background, no
   fill (also while the chat is open). Doubled to outrank the pill's own. */
.dcp-header__ask.dcp-header__ask:hover,
.dcp-header__ask.dcp-header__ask[aria-expanded="true"] {
  border-color: var(--color-primary);
  background: var(--color-light);
}

.dcp-header__ask-label {
  display: none;
}

@media screen and (min-width: 390px) {
  .dcp-header__ask {
    width: auto;
    padding: 0 11px;
    justify-content: flex-start;
  }

  .dcp-header__ask-label {
    display: inline;
  }
}

/* Soft pills: centered in the header from "lg", a scrolling second row of
   the header below it. The active section reads as a quiet gray fill. */
.dcp-section-bar {
  align-items: center;
  gap: 4px;
  width: calc(
    100% + var(--layout-header-menu-slot) + 2 * var(--layout-gutter)
  );
  height: calc(
    var(--layout-header-height-with-sections) - var(--layout-header-height)
  );
  margin: 0 calc(-1 * (var(--layout-header-menu-slot) + var(--layout-gutter)))
    0 calc(-1 * var(--layout-gutter));
  /* The pills start on the page gutter, like the logo and the content. */
  padding: 0 0 6px var(--layout-gutter);
}

/* The same gutter after the last pill once the row scrolls to its end (a
   spacer, because scroll containers do not reliably keep end padding). */
.dcp-section-bar::after {
  content: "";
  flex: 0 0 calc(var(--layout-gutter) - 4px);
  height: 1px;
}

@media screen and (min-width: 992px) {
  .dcp-section-bar {
    order: unset;
    width: auto;
    height: auto;
    margin: 0;
    padding: 0;
    overflow: visible;
  }

  .dcp-section-bar::after {
    display: none;
  }
}

.dcp-section-bar__link {
  font-size: 14px;
  line-height: 20px;
  padding: 6px 12px;
  border-radius: 30px;
  color: var(--color-grayDark);
  background: transparent;
}

.dcp-section-bar__link[data-active] {
  color: var(--color-dark);
  background: color-mix(in srgb, var(--color-dark) 6%, transparent);
}

/* The ring is inset so the horizontally scrolling bar below "lg" cannot
   clip it. The pill radius is restated: the links' keyboard ring
   (a:focus-visible in controls) sets 6px with a higher specificity than the
   tab's own rule. */
.dcp-section-bar__link:focus-visible {
  border-radius: 30px;
  box-shadow: inset 0 0 0 2px var(--color-primaryLight);
}

.dcp-section-bar__link:hover {
  color: var(--color-dark);
  background: color-mix(in srgb, var(--color-dark) 4%, transparent);
}`,
};
