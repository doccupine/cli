import type { DesignStyles } from "./index.js";
import { pillRules, primaryIconRules } from "./controls.js";

// The navigation sidebar (components/SideBar.tsx): the rail from "lg" up, a
// sheet under the header below it (.dcp-sidebar[data-open], opened by
// .dcp-sidebar-toggle), its footer row (focus-mode toggle, language and
// version switchers, theme control) and the controls in it
// (components/layout/FocusModeToggle.tsx, VariantSwitchers.tsx,
// Dropdown.tsx).
//
// Variants that used to live in a component's base rule are written
// `.block:where([data-x])`, which keeps the rule at the block's own
// specificity, so the media queries after it still win as before.
// Shared by both designs: the light/dark switch's knob and the focus-mode
// button's placement. classic applies the pill rules to them directly;
// modern gets them from the .dcp-pill classes.
const footerIcons = primaryIconRules([
  ".dcp-theme-switch",
  ".dcp-focus-toggle",
]);

const themeSwitchRules = `/* The light/dark switch, drawn like the page header's view toggle (sun,
   then moon). Use with dcp-pill and dcp-pill-switch. The knob follows the
   "dark" class on <html>, so it is right from the first paint, before React
   knows the mode. */
:root.dark .dcp-theme-switch::after {
  transform: translateX(28px);
}`;

const focusToggleRules = `/* Focus mode (desktop only): FocusModeToggle sets data-focus-mode on <html>
   and the rails slide away. The toggle is fixed rather than in the footer
   row: the footer slides away with the sidebar, and the way back out has to
   stay on screen. A round pill (dcp-pill dcp-pill-round), opaque (see
   primaryIconRules) since it stays over the page once the sidebar slides
   away. */
.dcp-focus-toggle {
  display: none;
}

@media screen and (min-width: 992px) {
  .dcp-focus-toggle {
    display: inline-flex;
    position: fixed;
    /* Above the sidebar (99) so it stays clickable once the rails are out,
       below the chat panel (1000). */
    z-index: 100;
    /* Left end of the sidebar footer row, which leaves room for it; the
       switchers follow and the theme switch holds the right end. */
    left: 20px;
    bottom: 16px;
  }
}`;

export const sidebarStyles: DesignStyles = {
  shared: `.dcp-sidebar {
  position: fixed;
  overflow-y: auto;
  width: 100%;
  z-index: 99;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    visibility 0s linear 0.3s;
  left: 0;
  background: var(--color-light);
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
}

.dcp-sidebar::-webkit-scrollbar {
  display: none;
}

.dcp-sidebar:where([data-open]) {
  transform: translateY(0);
  opacity: 1;
  pointer-events: all;
  visibility: visible;
  transition-delay: 0s;
}

.dcp-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.dcp-sidebar__list:last-of-type {
  margin-bottom: auto;
}

.dcp-sidebar__item {
  display: flex;
  gap: 10px;
  clear: both;
}

/* The space under a group's label and after its rows. */
.dcp-sidebar__space {
  display: block;
  min-height: 20px;
  max-height: 20px;
}

.dcp-sidebar__label svg,
.dcp-sidebar__link svg,
.dcp-sidebar__group-button svg,
.dcp-sidebar__group-row svg,
.dcp-sidebar__group-link svg {
  flex-shrink: 0;
}

/* Compact HTTP-method label before a generated API endpoint link: Badge's
   mono look with sidebar metrics. It stays on the title's first line when
   the title wraps (the top offset centers it in one line box), and the
   min-width fits the longest verb (OPTIONS), so every title starts on one
   edge. Written .dcp-badge.dcp-sidebar__method: one class more than Badge's
   own rules, which come later in this layer. */
.dcp-badge.dcp-sidebar__method {
  flex-shrink: 0;
  align-self: flex-start;
  justify-content: center;
  min-width: 48px;
  height: 18px;
  margin-top: calc((14px * var(--dcp-sidebar-row-line-height) - 18px) / 2);
  font-size: 9px;
  letter-spacing: 0.02em;
  padding: 1px 4px;
  border: none;
}

.dcp-sidebar__group-link {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

/* The ring is drawn on the row via :has(:focus-visible); the global link
   glow stays off so it is not drawn twice. */
.dcp-sidebar__group-link:focus-visible {
  outline: none;
  box-shadow: none;
}

/* Collapsed groups are hidden from assistive tech and focus by SideBar.tsx
   (aria-hidden and inert); this only animates them, height 0 to auto through
   interpolate-size. */
.dcp-sidebar__group-content {
  list-style: none;
  margin: 0;
  padding: 0;
  height: 0;
  overflow: clip;
  visibility: hidden;
  transition:
    height 0.3s ease,
    visibility 0s linear 0.3s;
}

.dcp-sidebar__group-content:where([data-open]) {
  height: auto;
  visibility: visible;
  transition-delay: 0s;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-sidebar__group-content {
    transition: none;
  }
}

/* The theme control's slot takes whatever the switchers leave, so the
   control stays beside them in the mobile menu and holds the right end of
   the rail. */
.dcp-sidebar__footer-toggle {
  display: flex;
  flex: 1;
  justify-content: flex-start;
}

@media screen and (min-width: 992px) {
  .dcp-sidebar__footer-toggle {
    flex: 0 0 auto;
    margin-left: auto;
  }
}

/* The language and version switchers. A lone pill claims only the width its
   label needs; a pair ([data-dense]) grows from its labels' widths into the
   rail's free width and gives up characters, never height. */
.dcp-switchers {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dcp-switcher {
  display: flex;
  min-width: 0;
}

@media screen and (min-width: 992px) {
  .dcp-switchers[data-dense] {
    flex: 1;
  }

  .dcp-switchers[data-dense] .dcp-switcher {
    flex: 1 1 auto;
  }
}

/* Fills the trigger so the label takes the width and the chevron keeps the
   right edge when the pill is stretched across the rail. */
.dcp-switcher__content {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: var(--color-accentStrong);
}

/* The glyphs sit at the toggles' resting color and pick up the accent on
   hover, so all the controls of the row light up the same way. */
.dcp-switcher__content svg {
  flex-shrink: 0;
  color: var(--color-primary);
  transition: color 0.3s ease;
}

.dcp-switcher__content > svg:last-child {
  transition:
    color 0.3s ease,
    transform 0.3s ease;
}

button:hover > .dcp-switcher__content svg {
  color: var(--color-accent);
}

[aria-expanded="true"] > .dcp-switcher__content > svg:last-child {
  transform: rotate(180deg);
}

/* Below "lg" the sidebar is the full-width mobile menu, so every trigger
   shows its glyph and full label. On the rail a pair drops to the glyphless
   short form (a language's code, a version's own label) rather than
   truncating both. */
.dcp-switcher__icon {
  display: flex;
}

.dcp-switcher__label,
.dcp-switcher__short {
  flex: 1;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dcp-switcher__short {
  display: none;
}

@media screen and (min-width: 992px) {
  .dcp-switchers[data-dense] .dcp-switcher__icon,
  .dcp-switchers[data-dense] .dcp-switcher__label {
    display: none;
  }

  .dcp-switcher__short {
    display: block;
  }
}

/* Keeps every label aligned whether or not the entry carries the mark. */
.dcp-switcher__mark {
  display: flex;
  flex-shrink: 0;
  width: 14px;
}

/* Dropdown: a bordered trigger and a menu that scales in and out. */
.dcp-dropdown {
  position: relative;
  display: inline-block;
}

.dcp-dropdown:where([data-full-width]) {
  display: flex;
  flex: 1;
  min-width: 0;
}

.dcp-dropdown__trigger {
  transition: all 0.3s ease;
  border: solid 1px transparent;
  box-shadow: 0 0 0 0px var(--color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  width: auto;
  min-width: 0;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-color, var(--color-grayLight));
  background: transparent;
  color: inherit;
  font-family: inherit;
  cursor: pointer;
}

.dcp-dropdown__trigger:where([data-full-width]) {
  width: 100%;
}

/* Standing in a row of icon buttons: the same 30px pill, filled surface and
   border as the toggles beside it. */
.dcp-dropdown__trigger:where([data-compact]) {
  gap: 6px;
  height: 30px;
  min-height: 0;
  padding: 0 10px;
  border-radius: 30px;
  background: var(--color-light);
}

.dcp-dropdown__trigger:hover {
  border-color: var(--color-primary);
}

.dcp-dropdown__trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-dropdown__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--color-light);
  border: 1px solid var(--color-grayLight);
  border-radius: 6px;
  box-shadow: var(--shadow-xs);
  z-index: 1000;
  transform-origin: top left;
  animation: dcp-dropdown-in 0.15s ease forwards;
}

.dcp-dropdown__menu:where([data-placement="top"]) {
  top: auto;
  bottom: calc(100% + 8px);
  transform-origin: bottom left;
}

.dcp-dropdown__menu:where([data-align="right"]) {
  left: auto;
  right: 0;
  transform-origin: top right;
}

.dcp-dropdown__menu:where([data-placement="top"][data-align="right"]) {
  transform-origin: bottom right;
}

/* A compact trigger sits in a narrow rail, so its menu starts narrower too
   and still clears both edges of that rail whichever way it is aligned. */
.dcp-dropdown__menu:where([data-compact]) {
  min-width: 160px;
}

.dcp-dropdown__menu:where([data-closing]) {
  animation-name: dcp-dropdown-out;
}

@keyframes dcp-dropdown-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes dcp-dropdown-out {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
}

.dcp-dropdown__divider {
  height: 1px;
  background: var(--color-grayLight);
  margin: 0;
}

/* One entry of a menu. The checked entry of a choice menu is tinted like a
   hovered one and keeps its weight. */
.dcp-dropdown__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: none;
  border: none;
  text-align: left;
  font-family: inherit;
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dcp-dropdown__item:where([data-checked]) {
  background: color-mix(in srgb, var(--color-primaryLight) 10%, transparent);
}

.dcp-dropdown__item svg {
  flex-shrink: 0;
  transition: color 0.3s;
}

/* A hairline between neighbours only: the first entry meets the menu's own
   border, and no entry draws a line on both edges. */
.dcp-dropdown__item + .dcp-dropdown__item {
  border-top: 1px solid var(--color-grayLight);
}

.dcp-dropdown__item:hover {
  background: color-mix(in srgb, var(--color-primaryLight) 10%, transparent);
  color: var(--color-accent);
}

/* Inset so the menu's overflow does not clip it, square so the menu's own
   rounded corners shape it. */
.dcp-dropdown__item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--color-primaryLight);
}

/* The menu button sits at the right end of the header's top row. It is not
   part of the header (the sidebar owns the menu state), so it is placed over
   it: absolute against the page while the header is in normal flow, fixed
   only once the header pins. Nothing fixed touches the top edge at scroll
   position zero, which iPad Safari needs to color its toolbar. */
.dcp-sidebar-toggle {
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  font-weight: 600;
  white-space: nowrap;
  hyphens: auto;
  text-decoration: none;
  text-align: center;
  gap: 10px;
  text-overflow: ellipsis;
  box-shadow: 0 0 0 0px var(--color-primary);
  font-size: 16px;
  line-height: 1;
  position: absolute;
  z-index: 1001;
  top: calc((var(--layout-header-height) - 32px) / 2);
  right: var(--layout-gutter);
  width: 32px;
  height: 32px;
  min-height: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: solid 1px var(--color-grayLight);
  background: var(--color-light);
  color: var(--color-dark);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

/* Doubled to outrank the filled button's own fill and rings on hover, focus
   and press: this control stays a quiet outlined circle. */
.dcp-sidebar-toggle.dcp-sidebar-toggle:hover,
.dcp-sidebar-toggle.dcp-sidebar-toggle:focus,
.dcp-sidebar-toggle.dcp-sidebar-toggle:active {
  background: var(--color-light);
  box-shadow: none;
}

/* Like the header's search button: a primary border on hover, no fill. */
.dcp-sidebar-toggle.dcp-sidebar-toggle:hover {
  border-color: var(--color-primary);
}

.dcp-sidebar-toggle.dcp-sidebar-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

html:has(#header[data-pinned]) .dcp-sidebar-toggle {
  position: fixed;
}

/* The chat panel opens fullscreen below "lg" and its own header holds the
   close button where this one sits, so the menu button steps aside. */
html:has([data-chat-panel][aria-hidden="false"]) .dcp-sidebar-toggle {
  visibility: hidden;
}

@media screen and (min-width: 992px) {
  .dcp-sidebar-toggle {
    display: none;
  }
}

.dcp-sidebar-toggle__burger {
  display: block;
  width: 14px;
  height: 10px;
  position: relative;
}

.dcp-sidebar-toggle__burger::before,
.dcp-sidebar-toggle__burger::after {
  content: "";
  display: block;
  position: absolute;
  left: 0;
  width: 14px;
  height: 1.5px;
  border-radius: 2px;
  background: var(--color-dark);
  transition: transform 0.3s ease;
}

.dcp-sidebar-toggle__burger::before {
  top: 1px;
}

.dcp-sidebar-toggle__burger::after {
  bottom: 1px;
}

[aria-expanded="true"] > .dcp-sidebar-toggle__burger::before {
  transform: translateY(3.25px) rotate(45deg);
}

[aria-expanded="true"] > .dcp-sidebar-toggle__burger::after {
  transform: translateY(-3.25px) rotate(-45deg);
}

@media (prefers-reduced-motion: reduce) {
  .dcp-sidebar-toggle__burger::before,
  .dcp-sidebar-toggle__burger::after {
    transition: none;
  }
}`,
  classic: `.dcp-sidebar {
  --dcp-sidebar-row-line-height: 1.6;
  max-height: calc(100dvh - var(--layout-header-height));
  top: var(--layout-header-height);
  padding: 20px;
  transform: translateY(30px);
}

/* Below "lg" the rail opens as a sheet under the header, whose height
   depends on whether the section bar is showing. */
.dcp-sidebar:where([data-sections]) {
  max-height: calc(100dvh - var(--layout-header-height-with-sections));
  top: var(--layout-header-height-with-sections);
}

.dcp-sidebar:where([data-open]) {
  transform: translateY(0);
}

@media screen and (min-width: 992px) {
  .dcp-sidebar {
    border-right: solid 1px var(--color-grayLight);
    transition: none;
    max-height: 100dvh;
    padding: var(--layout-rail-top) 20px 20px 20px;
    opacity: 1;
    pointer-events: all;
    visibility: visible;
    transform: translateY(0);
    /* Mixed over the page background rather than transparent so the panel
       reads as a filled surface in both modes. */
    background: color-mix(
      in srgb,
      var(--color-primaryLight) 8%,
      var(--color-light)
    );
    top: 0;
    width: var(--layout-sidebar-width);
  }

  .dcp-sidebar {
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
  }

  html[data-focus-mode] .dcp-sidebar {
    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
  }

  html[data-focus-mode] .dcp-sidebar {
    visibility: hidden;
    transition:
      transform 0.3s ease,
      opacity 0.3s ease,
      visibility 0s linear 0.3s;
  }
}

/* One row of 30px controls: the focus-mode toggle, the language and version
   switchers, then the theme toggle. The focus toggle is fixed rather than a
   child (it outlives the sidebar in focus mode), so on the rail the row's own
   padding leaves its 30px plus a gap free at the left. */
.dcp-sidebar__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 22px 20px;
  position: sticky;
  border-top: 1px solid var(--color-grayLight);
  /* Same opaque mix as the sidebar panel so the sticky footer blends into it
     while still masking the list scrolling underneath. */
  background: color-mix(
    in srgb,
    var(--color-primaryLight) 8%,
    var(--color-light)
  );
  margin: 0 -20px -20px;
  bottom: -20px;
}

@media screen and (min-width: 992px) {
  .dcp-sidebar__footer {
    padding: 16px 20px 16px 58px;
  }
}

.dcp-sidebar__label {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-accentStrong);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media screen and (min-width: 992px) {
  .dcp-sidebar__label {
    font-size: 16px;
    line-height: 1.7;
  }
}

/* Every sidebar row (leaf links and group headers) shares one look, so
   hover, the current page and the left rail read the same. The inset grows
   14px per nesting level (--dcp-sidebar-depth, set by SideBar.tsx). */
.dcp-sidebar__link,
.dcp-sidebar__group-row {
  text-decoration: none;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-accentMuted);
  padding: 5px 0 5px 20px;
  padding-left: calc(20px + var(--dcp-sidebar-depth, 0) * 14px);
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  transition: all 0.3s ease;
  border-left: solid 1px var(--color-grayLight);
}

.dcp-sidebar__link[aria-current="page"],
.dcp-sidebar__group-row[data-active] {
  color: var(--color-accentStrong);
  border-color: var(--color-primary);
  font-weight: 600;
}

.dcp-sidebar__link:hover,
.dcp-sidebar__group-row:hover {
  color: var(--color-accent);
  border-color: var(--color-primary);
}

/* A group that is not a page: one toggle button with the row's look over the
   base of a filled button, whose hover fill and focus ring it keeps. */
.dcp-sidebar__group-button {
  box-sizing: border-box;
  appearance: none;
  border: none;
  background: none;
  margin: 0;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  border-radius: 100px;
  font-weight: 600;
  white-space: nowrap;
  hyphens: auto;
  text-overflow: ellipsis;
  justify-content: center;
  box-shadow: 0 0 0 0px var(--color-primary);
  text-decoration: none;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-accentMuted);
  padding: 5px 0 5px 20px;
  padding-left: calc(20px + var(--dcp-sidebar-depth, 0) * 14px);
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  transition: all 0.3s ease;
  border-left: solid 1px var(--color-grayLight);
  width: 100%;
  height: auto;
  min-height: 0;
  text-align: left;
}

.dcp-sidebar__group-button[data-active] {
  color: var(--color-accentStrong);
  border-color: var(--color-primary);
  font-weight: 600;
}

.dcp-sidebar__group-button:hover {
  background: var(--color-primaryDark);
  border-color: var(--color-primaryDark);
}

.dcp-sidebar__group-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-sidebar__group-button:hover {
  color: var(--color-accent);
  border-color: var(--color-primary);
}

/* Buttons are not covered by the global link ring, so this toggle carries
   its own copy of it. */
.dcp-sidebar__group-button:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-sidebar__group-button .lucide,
.dcp-sidebar__group-chevron .lucide {
  margin: auto 0;
}

/* The collapse chevron points right when closed and turns to point down
   when the group is open. */
.dcp-sidebar__group-button .lucide-chevron-right,
.dcp-sidebar__group-row .lucide-chevron-right {
  margin-left: auto;
  transition: transform 0.3s ease;
}

.dcp-sidebar__group-button[data-open] .lucide-chevron-right,
.dcp-sidebar__group-row[data-open] .lucide-chevron-right {
  transform: rotate(90deg);
}

/* The row is a plain div, so it never matches :focus-visible itself: it is
   ringed when its link or chevron takes keyboard focus. */
.dcp-sidebar__group-row:has(:focus-visible) {
  border-radius: 6px;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-sidebar__group-chevron {
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  outline: none;
  font-family: inherit;
  border-radius: 100px;
  font-weight: 600;
  white-space: nowrap;
  hyphens: auto;
  text-decoration: none;
  transition: all 0.3s ease;
  text-align: center;
  gap: 10px;
  text-overflow: ellipsis;
  box-shadow: 0 0 0 0px var(--color-primary);
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: auto;
  height: auto;
  min-height: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}

.dcp-sidebar__group-chevron:hover {
  background: var(--color-primaryDark);
  border-color: var(--color-primaryDark);
}

.dcp-sidebar__group-chevron:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

/* The ring is drawn on the row via :has(:focus-visible). */
.dcp-sidebar__group-chevron:focus-visible {
  outline: none;
}

/* The sidebar footer controls are the modern design's pills: the
   light/dark switch and the focus-mode button (see pillRules in
   controls.ts). */
${pillRules(
  [".dcp-theme-switch", ".dcp-focus-toggle"],
  [".dcp-focus-toggle"],
  [".dcp-theme-switch"],
)}

${themeSwitchRules}

${focusToggleRules}

${footerIcons}`,
  modern: `/* Rows get their inset from --dcp-sidebar-row-inset (set on the groups
   below) plus 14px per nesting level (--dcp-sidebar-depth, set by
   SideBar.tsx). The rail keeps a real margin from the viewport edge, so the
   current page's highlight never runs up to it. */
.dcp-sidebar {
  --dcp-sidebar-row-line-height: 1.45;
  max-height: calc(100dvh - var(--layout-header-height));
  top: var(--layout-header-height);
  padding: 16px var(--layout-gutter) 24px 16px;
  transform: translateY(16px);
}

/* Below "lg" the rail opens as a sheet under the header, whose height
   depends on whether the section bar is showing. */
.dcp-sidebar:where([data-sections]) {
  max-height: calc(100dvh - var(--layout-header-height-with-sections));
  top: var(--layout-header-height-with-sections);
}

.dcp-sidebar:where([data-open]) {
  transform: translateY(0);
}

@media screen and (min-width: 992px) {
  .dcp-sidebar {
    transition: none;
    max-height: 100dvh;
    padding: var(--layout-rail-top) 16px 24px 16px;
    opacity: 1;
    pointer-events: all;
    visibility: visible;
    transform: translateY(0);
    background: transparent;
    top: 0;
    width: var(--layout-sidebar-width);
  }

  .dcp-sidebar {
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
  }

  html[data-focus-mode] .dcp-sidebar {
    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
  }

  html[data-focus-mode] .dcp-sidebar {
    visibility: hidden;
    transition:
      transform 0.3s ease,
      opacity 0.3s ease,
      visibility 0s linear 0.3s;
  }
}

/* One row of controls: the 32px focus-mode toggle, the language and version
   switchers, then the theme switch. The focus toggle is fixed rather than a
   child (it outlives the sidebar in focus mode), so on the rail the row's own
   padding leaves its 20px offset, its 32px and an 8px gap free at the left.
   No rule above it: a short fade masks the list scrolling underneath. */
.dcp-sidebar__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px var(--layout-gutter) 24px;
  position: sticky;
  background: var(--color-light);
  margin: 24px calc(-1 * var(--layout-gutter)) -24px -16px;
  bottom: -24px;
}

.dcp-sidebar__footer::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  height: 24px;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, var(--color-light));
}

@media screen and (min-width: 992px) {
  .dcp-sidebar__footer {
    margin-right: -16px;
    padding: 16px 16px 16px 60px;
  }
}

${themeSwitchRules}

/* A group: its label, then its rows. SideBar.tsx puts a 20px space under
   the label and another after the rows; this design keeps the one between
   groups and tightens the label's own. When the label has an icon, rows
   start where its text does (the 14px icon plus the 8px gap). */
.dcp-sidebar__list {
  --dcp-sidebar-row-inset: 10px;
}

.dcp-sidebar__list:has(> li > strong svg) {
  --dcp-sidebar-row-inset: 32px;
}

.dcp-sidebar__list > li:nth-child(2) {
  display: none;
}

.dcp-sidebar__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 6px;
  padding-left: 10px;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-dark);
}

.dcp-sidebar__label svg {
  width: 14px;
  height: 14px;
  color: var(--color-grayDark);
}

/* Every sidebar row (leaf links and group headers): quiet text, a soft fill
   on hover, and the accent color with a heavier weight for the current
   page; no rails or borders. */
.dcp-sidebar__link,
.dcp-sidebar__group-row {
  text-decoration: none;
  font-size: 14px;
  line-height: 1.45;
  color: var(--color-grayDark);
  padding: 6px 8px 6px var(--dcp-sidebar-row-inset, 10px);
  padding-left: calc(
    var(--dcp-sidebar-row-inset, 20px) + var(--dcp-sidebar-depth, 0) * 14px
  );
  margin: 1px 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

/* A faint accent wash keeps the current page findable when the palette's
   accent sits close to the body text (the default grays). A group header
   holding the current page keeps only the accent text: that page's own row
   carries the wash. */
.dcp-sidebar__link[aria-current="page"],
.dcp-sidebar__group-row[data-active] {
  color: var(--color-accent);
  font-weight: 500;
  background: color-mix(in srgb, var(--color-accent) 7%, transparent);
}

.dcp-sidebar__group-row[data-active] {
  background: transparent;
}

.dcp-sidebar__link:hover,
.dcp-sidebar__group-row:hover {
  color: var(--color-dark);
  background: color-mix(in srgb, var(--color-dark) 4%, transparent);
}

.dcp-sidebar__link[aria-current="page"]:hover,
.dcp-sidebar__group-row[data-active]:hover {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 9%, transparent);
}

.dcp-sidebar__group-row:has(:focus-visible) {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

/* A group that is not a page: one toggle button with the row's look over the
   base of a filled button. */
.dcp-sidebar__group-button {
  box-sizing: border-box;
  appearance: none;
  border: none;
  background: none;
  cursor: pointer;
  outline: none;
  font-weight: 600;
  white-space: nowrap;
  hyphens: auto;
  text-overflow: ellipsis;
  justify-content: center;
  box-shadow: 0 0 0 0px var(--color-primary);
  text-decoration: none;
  font-size: 14px;
  line-height: 1.45;
  color: var(--color-grayDark);
  padding: 6px 8px 6px var(--dcp-sidebar-row-inset, 10px);
  padding-left: calc(
    var(--dcp-sidebar-row-inset, 20px) + var(--dcp-sidebar-depth, 0) * 14px
  );
  margin: 1px 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
  width: 100%;
  height: auto;
  min-height: 0;
  text-align: left;
  font-family: inherit;
}

.dcp-sidebar__group-button[data-active] {
  color: var(--color-accent);
  font-weight: 500;
  background: transparent;
}

.dcp-sidebar__group-button:hover {
  background: var(--color-primaryDark);
  border-color: var(--color-primaryDark);
}

.dcp-sidebar__group-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-sidebar__group-button:hover {
  color: var(--color-dark);
  background: color-mix(in srgb, var(--color-dark) 4%, transparent);
}

.dcp-sidebar__group-button[data-active]:hover {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 9%, transparent);
}

/* Doubled to outrank the filled button's fill and rings on hover, focus and
   press, so the toggle behaves like the link rows. */
.dcp-sidebar__group-button.dcp-sidebar__group-button:focus,
.dcp-sidebar__group-button.dcp-sidebar__group-button:active {
  background: transparent;
  box-shadow: none;
}

.dcp-sidebar__group-button.dcp-sidebar__group-button:hover {
  background: color-mix(in srgb, var(--color-dark) 4%, transparent);
  box-shadow: none;
}

/* Buttons are not covered by the global link ring, so this toggle carries
   its own copy of it. */
.dcp-sidebar__group-button.dcp-sidebar__group-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-sidebar__group-button .lucide,
.dcp-sidebar__group-chevron .lucide {
  margin: auto 0;
}

/* The collapse chevron sits after the label, points right when closed and
   turns to point down when the group is open. */
.dcp-sidebar__group-button .lucide-chevron-right,
.dcp-sidebar__group-row .lucide-chevron-right {
  width: 14px;
  height: 14px;
  color: var(--color-gray);
  transition: transform 0.2s ease;
}

.dcp-sidebar__group-button[data-open] .lucide-chevron-right,
.dcp-sidebar__group-row[data-open] .lucide-chevron-right {
  transform: rotate(90deg);
}

.dcp-sidebar__group-button .lucide-chevron-right {
  margin-left: auto;
}

.dcp-sidebar__group-chevron {
  box-sizing: border-box;
  appearance: none;
  outline: none;
  font-family: inherit;
  border-radius: 100px;
  font-weight: 600;
  white-space: nowrap;
  hyphens: auto;
  text-decoration: none;
  transition: all 0.3s ease;
  text-align: center;
  gap: 10px;
  text-overflow: ellipsis;
  box-shadow: 0 0 0 0px var(--color-primary);
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  min-height: 0;
  padding: 0;
  margin: 0 0 0 auto;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}

/* No fill or rings of its own: the row draws the hover fill and, via
   :has(:focus-visible), the ring. */
.dcp-sidebar__group-chevron.dcp-sidebar__group-chevron:hover,
.dcp-sidebar__group-chevron.dcp-sidebar__group-chevron:focus,
.dcp-sidebar__group-chevron.dcp-sidebar__group-chevron:active,
.dcp-sidebar__group-chevron.dcp-sidebar__group-chevron:focus-visible {
  outline: none;
  background: none;
  box-shadow: none;
}

${focusToggleRules}

${footerIcons}`,
};
