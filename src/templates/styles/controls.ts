import type { DesignStyles } from "./index.js";

// Shared classes: the pieces several components reuse. A component adds the class next to its own block
// class and its own rules state only what differs. These rules come first in
// their layer, so a component rule of the same specificity overrides them.
//
// A shared class only wins over a component rule from a later layer, or from
// the same layer with higher specificity. Where a shared declaration must win
// over a component's own, state it in the component rule instead of relying
// on the class, or the order flips.
// The keyboard-focus ring for links. It sits at the start of the design
// layer rather than in base: it has to compete by specificity with the
// components' own rules (a component's base radius loses to it, a
// component's own :focus-visible rule wins), and a rule in an earlier layer
// would lose to every one of them.
const linkFocusRing = `/* Keyboard-focus ring for links: keyboard only (:focus-visible), a soft
   primaryLight glow that follows the element's radius. Link-styled buttons
   (.button-link) draw their own and are excluded through :where(), which
   adds no specificity, so a component's own :focus-visible rule wins. */
a:focus-visible:where(:not(.button-link)) {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

/* The ring's radius for links that have none of their own (inline links).
   No specificity, so a card or pill keeps its own radius around the ring. */
:where(a:focus-visible:not(.button-link)) {
  border-radius: 6px;
}`;

// The pill controls. Modern applies them through the .dcp-pill classes;
// classic applies the same rules straight to its page actions (the markdown
// link and the view toggle), so its other controls keep their own look.
export function pillRules(
  pill: string[],
  round: string[],
  switches: string[],
): string {
  const sel = (list: string[], suffix = "") =>
    list.map((s) => s + suffix).join(",\n");
  return `/* The outlined pill control: 32px tall, fully rounded, a hairline
   border, a soft fill on hover and while expanded, and a ring on keyboard
   focus only. */
${sel(pill)} {
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  border: solid 1px var(--color-grayLight);
  border-radius: 30px;
  background: transparent;
  color: var(--color-grayDark);
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
}

${sel(pill, " svg")} {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: inherit;
}

${sel([...pill.map((s) => s + ":hover"), ...pill.map((s) => s + '[aria-expanded="true"]')])} {
  color: var(--color-dark);
  border-color: var(--color-gray);
  background: color-mix(in srgb, var(--color-dark) 4%, transparent);
}

${sel([...pill.map((s) => s + ":focus"), ...pill.map((s) => s + ":active")])} {
  box-shadow: none;
}

${sel(pill, ":focus-visible")} {
  outline: none;
  /* Restated: the links' keyboard ring (a:focus-visible) sets 6px. */
  border-radius: 30px;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}${
    round.length
      ? `

/* An icon-only pill: a 32px circle. */
${sel(round)} {
  width: 32px;
  padding: 0;
  justify-content: center;
}`
      : ""
  }${
    switches.length
      ? `

/* A two-icon pill switch: 60px wide, with a soft 24px knob behind the first
   icon, or behind the second with data-knob="end". */
${sel(switches)} {
  width: 60px;
  justify-content: space-between;
  padding: 0 8px;
  position: relative;
}

${sel(switches, " svg")} {
  position: relative;
  z-index: 1;
}

${sel(switches, "::after")} {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-dark) 7%, transparent);
  transition: transform 0.2s ease;
}

${sel(switches, '[data-knob="end"]::after')} {
  transform: translateX(28px);
}

@media (prefers-reduced-motion: reduce) {
  ${sel(switches, "::after")} {
    transition: none;
  }
}`
      : ""
  }`;
}

// The ghost-square icon button of the dialogs' headers (the search window's
// close, the chat panel's reset and close, the API playground's close): an
// exact 32px square with the sidebar row's hover fill and a ring on keyboard
// focus only. Both designs use it.
export function squareButtonRules(selector: string): string {
  return `${selector} {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  max-width: 32px;
  min-height: 32px;
  max-height: 32px;
  padding: 0;
  border: solid 1px transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--color-grayDark);
  box-shadow: none;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

${selector} svg {
  width: 16px;
  height: 16px;
  color: inherit;
}

${selector}:hover {
  color: var(--color-dark);
  border-color: transparent;
  background: color-mix(in srgb, var(--color-dark) 6%, transparent);
}

${selector}:focus,
${selector}:active {
  border-color: transparent;
  box-shadow: none;
}

${selector}:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}`;
}

// The page and sidebar controls (markdown link, view toggle, light/dark
// switch, focus-mode button) keep primary icons in both designs, with the
// accent and a primary border on hover, as the classic controls always
// had. Their background stays the page's own light color.
export function primaryIconRules(selectors: string[]): string {
  const sel = (suffix: string) =>
    selectors.map((s) => `${s}${suffix}`).join(",\n");
  // svg.lucide outranks the article's own icon color (.dcp-docs .lucide).
  // The page's own background, at rest and on hover: hover changes only the
  // border and the icon color.
  return `${sel("")} {
  background: var(--color-light);
}

${sel(" svg.lucide")} {
  color: var(--color-primary);
}

${sel(":hover svg.lucide")} {
  color: var(--color-accent);
}

${sel(":hover")} {
  border-color: var(--color-primary);
  background: var(--color-light);
}`;
}

export const controlStyles: DesignStyles = {
  shared: `/* "Skip to content": the first keyboard stop, hidden until focused, then
   shown as a pill over the header's top-left corner. */
.dcp-skip-link {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 2000;
  padding: 8px 14px;
  border-radius: 30px;
  background: var(--color-light);
  color: var(--color-primary-text);
  border: solid 1px var(--color-primary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-200%);
}

.dcp-skip-link:focus-visible {
  transform: none;
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

/* The skip link's target: focusable from script only, so no ring. */
.dcp-docs:focus {
  outline: none;
}

/* Code blocks are focusable (they scroll sideways): an inset ring on
   keyboard focus only. */
.dcp-code__body pre:focus {
  outline: none;
}

.dcp-code__body pre:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-primaryLight);
}

/* A button with the browser's own look removed. */
.dcp-reset-button {
  box-sizing: border-box;
  appearance: none;
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
}

/* Slim, theme-aware scrollbar for internal scroll areas (code blocks,
   modals, tables), so the chunky native bar does not stand out. */
.dcp-thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

/* Hover, focus and active affordance for interactive surfaces: a transparent
   1px border that picks up the primary color on hover, and a soft ring. */
.dcp-interactive {
  transition: all 0.3s ease;
  border: solid 1px transparent;
  box-shadow: 0 0 0 0px var(--color-primary);
}

.dcp-interactive:hover {
  border-color: var(--color-primary);
}

.dcp-interactive:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}`,
  classic: linkFocusRing,
  modern: `${linkFocusRing}

${pillRules([".dcp-pill"], [".dcp-pill-round"], [".dcp-pill-switch"])}`,
};
