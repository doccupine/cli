import type { DesignStyles } from "./index.js";
import { pillRules, primaryIconRules, squareButtonRules } from "./controls.js";

// The search window (components/SearchModalContent.tsx, a native <dialog>)
// and the header's search button and its shortcut hint
// (components/SearchDocs.tsx). The markup is the same in both designs.
//
// The dialog element is the dimmed, blurred layer over the page and holds the
// panel. Both fade in when it opens and out while it closes (data-closing),
// and SearchModalContent unmounts it when the dialog's exit animation ends.
// The header's search button: the same outlined pill as the page and sidebar
// controls in both designs, with the primary icon, a primary border and no
// fill change on hover, and a ring on keyboard focus only.
// The search window's "Ask AI" button: the same pill as the header's search
// button in both designs, desktop only (it advertises Option+Enter), with
// its key hints as the same small rounded chips as the header's shortcut.
const askRules = `${pillRules([".dcp-search__ask"], [], [])}

.dcp-search__ask {
  display: none;
  flex-shrink: 0;
  padding: 0 6px 0 12px;
}

/* The pill shows primary on hover only, not after a click. */
.dcp-search__ask:focus {
  border-color: var(--color-grayLight);
}

${primaryIconRules([".dcp-search__ask"])}

.dcp-search__ask:disabled {
  opacity: 0.5;
  cursor: default;
}

.dcp-search__ask:disabled:hover {
  color: var(--color-grayDark);
  border-color: var(--color-grayLight);
}

@media screen and (min-width: 992px) {
  .dcp-search__ask {
    display: inline-flex;
  }
}

.dcp-search__kbd {
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: solid 1px var(--color-grayLight);
  color: var(--color-grayDark);
  border-radius: 30px;
}`;

const searchButtonRules = `${pillRules([".dcp-search-button"], [], [])}

/* Below "lg" the shortcut hint is hidden and only the icon is left: an exact
   32px circle. */
.dcp-search-button {
  width: 32px;
  padding: 0;
  justify-content: center;
}

@media screen and (min-width: 992px) {
  .dcp-search-button {
    width: auto;
    padding: 0 6px 0 11px;
    justify-content: flex-start;
  }
}

.dcp-search-button kbd {
  background: transparent;
  border: solid 1px var(--color-grayLight);
  color: var(--color-grayDark);
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 30px;
}

${primaryIconRules([".dcp-search-button"])}`;

export const searchStyles: DesignStyles = {
  shared: `/* The header's search button (see searchButtonRules for its pill look). */
.dcp-search-button {
  border: solid 1px var(--color-grayLight);
  display: flex;
  align-items: center;
  gap: 6px;
  /* Pinned to the 30px compact header-control tier, so the height cannot
     drift with platform font metrics and the header controls align. */
  box-sizing: border-box;
  height: 30px;
  background: var(--color-light);
  color: var(--color-primary);
  border-radius: 6px;
  padding: 0 8px;
  font-family: inherit;
  cursor: pointer;
}

.dcp-search-button svg.lucide {
  color: inherit;
  min-width: 14px;
}

@media screen and (min-width: 992px) {
  .dcp-search-button {
    padding: 0 4px 0 8px;
  }
}

.dcp-search-kbd {
  font-size: 11px;
  font-family: inherit;
  background: var(--color-grayLight);
  color: var(--color-grayDark);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
  font-weight: 600;
  display: none;
}

@media screen and (min-width: 992px) {
  .dcp-search-kbd {
    display: initial;
  }
}

@keyframes dcp-search-backdrop-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes dcp-search-backdrop-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes dcp-search-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes dcp-search-out {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.96) translateY(-8px);
  }
}

/* The dialog element is the dimmed, blurred layer over the page (its own
   ::backdrop stays clear) and holds the panel, 20px from the viewport's
   edges (120px from the top from "lg"). Near-black in both modes: it covers
   everything behind the panel whatever the visitor's theme. */
.dcp-search {
  position: fixed;
  inset: 0;
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
  margin: 0;
  border: none;
  padding: 20px;
  overflow: visible;
  color: inherit;
  background: rgba(0, 0, 0, 0.5);
  /* Prefixed first: the build keeps the last of the pair. */
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  animation: dcp-search-backdrop-in 300ms ease forwards;
}

.dcp-search[open] {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.dcp-search::backdrop {
  background: transparent;
}

.dcp-search__panel {
  background: var(--color-light);
  box-shadow: var(--shadow-xs);
  width: 100%;
  max-height: calc(100dvh - 40px);
  display: flex;
  flex-direction: column;
  border: solid 1px var(--color-grayLight);
  animation: dcp-search-in 300ms ease forwards;
}

.dcp-search[data-closing] {
  animation-name: dcp-search-backdrop-out;
}

.dcp-search[data-closing] .dcp-search__panel {
  animation-name: dcp-search-out;
}

/* Reduced motion: no movement, but the animations still end, which is what
   unmounts the closed window. */
@media (prefers-reduced-motion: reduce) {
  .dcp-search,
  .dcp-search__panel {
    animation-duration: 1ms;
  }
}

@media screen and (min-width: 992px) {
  .dcp-search {
    padding: 120px 20px 20px 20px;
  }

  .dcp-search__panel {
    max-height: calc(100dvh - 240px);
  }
}

.dcp-search__input-row {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  border-bottom: solid 1px var(--color-grayLight);
}

.dcp-search__input {
  flex: 1;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: var(--color-dark);
  font-family: inherit;
}

.dcp-search__input::placeholder {
  color: var(--color-text-muted);
}

/* type="search" gets the platform clear button, which duplicates the
   window's own close control. */
.dcp-search__input::-webkit-search-cancel-button,
.dcp-search__input::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}

/* The close button. */
.dcp-search__close {
  box-sizing: border-box;
  appearance: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.dcp-search__ask-keys {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* The return glyph's ink sits high in its em box: nudge just the character
   down so it optically centers and lines up with the option glyph. */
.dcp-search__return-glyph {
  display: inline-block;
  transform: translateY(1.5px);
}

/* The scroll area runs from the input row's rule to the panel's bottom edge,
   and its inset is padding inside the scrolled content, so rows scroll out
   under the rule and the bottom edge instead of being clipped short of
   them. */
.dcp-search__results {
  list-style: none;
  position: relative;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

.dcp-search__results[hidden] {
  display: none;
}

/* One indicator that slides between results (to --dcp-highlight-top, at
   --dcp-highlight-height, measured by SearchModalContent) instead of each
   row fading its own background. */
.dcp-search__highlight {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: 6px;
  transition:
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, height;
  transform: translateY(var(--dcp-highlight-top));
  height: var(--dcp-highlight-height);
}

@media (prefers-reduced-motion: reduce) {
  .dcp-search__highlight {
    transition: none;
  }
}

.dcp-search__result {
  position: relative;
  z-index: 1;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.dcp-search__result:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--color-primaryLight);
}

.dcp-search__result-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-dark);
  display: block;
  transition: color 0.15s ease;
}

.dcp-search__result-meta {
  font-size: 14px;
  color: var(--color-text-muted);
  display: block;
  margin-top: 2px;
}

.dcp-search__snippet {
  font-size: 14px;
  color: var(--color-grayDark);
  display: block;
  margin-top: 4px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Matched words in the body text color: the snippet's grayDark falls under
   AA on the primaryLight wash in dark palettes. */
.dcp-search__snippet mark {
  background: color-mix(in srgb, var(--color-primaryLight) 35%, transparent);
  color: var(--color-dark);
  border-radius: 4px;
  padding: 0 1px;
}

.dcp-search__empty {
  padding: 20px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Separates the spinner from "Searching documentation..."; the whitespace
     between them collapses away as an anonymous flex item. */
  gap: 8px;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
}`,
  classic: `${searchButtonRules}

.dcp-search__panel {
  max-width: 560px;
  border-radius: 12px;
}

.dcp-search__input-row {
  gap: 12px;
  padding: 16px;
}

.dcp-search__input-row svg.lucide {
  color: var(--color-gray);
  flex-shrink: 0;
}

.dcp-search__input {
  line-height: 1.7;
}

${askRules}

/* The close button: the shared 32px ghost square. */
${squareButtonRules(".dcp-search__close")}

.dcp-search__highlight {
  background: color-mix(in srgb, var(--color-primaryLight) 20%, transparent);
}

.dcp-search__result[data-active] > span:first-of-type {
  color: var(--color-primary-text);
}`,
  modern: `${searchButtonRules}

.dcp-search__panel {
  max-width: 600px;
  border-radius: 16px;
  overflow: hidden;
}

.dcp-search__input-row {
  gap: 8px;
  min-height: var(--layout-header-height);
  padding: 0 12px 0 16px;
}

.dcp-search__input-row > svg.lucide {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  color: var(--color-grayDark);
  flex-shrink: 0;
}

.dcp-search__input {
  line-height: 24px;
}

${askRules}

/* The close button: the shared 32px ghost square. */
${squareButtonRules(".dcp-search__close")}

/* The sidebar's current-page wash. */
.dcp-search__highlight {
  background: color-mix(in srgb, var(--color-accent) 7%, transparent);
}

.dcp-search__result[data-active] > span:first-of-type {
  color: var(--color-accent);
}`,
};
