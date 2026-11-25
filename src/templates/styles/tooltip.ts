import type { DesignStyles } from "./index.js";

// Tooltip (components/layout/Tooltip.tsx): a hint on a dotted-underlined
// phrase, opened on hover, focus or tap.
//
//   .dcp-tooltip             the inline wrapper the bubble is placed against
//   .dcp-tooltip__trigger    the underlined phrase
//   .dcp-tooltip__bubble     the positioner: data-open while shown,
//                            data-placement top | bottom, and the inline
//                            --dcp-tooltip-shift that keeps it on screen
//   .dcp-tooltip__content    the bubble itself
//   .dcp-tooltip__headline   an optional bold first line
//   .dcp-tooltip__cta        an optional link
//
// The gap between trigger and bubble is padding on the positioner, not a
// margin, so the pointer never crosses empty space on its way to the link.
// In the design layer after the article prose (docs.ts), competing with it
// by specificity as before.
const css = `.dcp-tooltip {
  position: relative;
  display: inline-block;
}

.dcp-tooltip__trigger {
  cursor: help;
  text-decoration: underline dotted 1.5px;
  text-decoration-color: var(--color-gray);
  text-underline-offset: 4px;
  border-radius: 6px;
}

.dcp-tooltip__trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-tooltip__bubble {
  position: absolute;
  left: 50%;
  transform: translateX(calc(-50% + var(--dcp-tooltip-shift, 0px)));
  width: max-content;
  max-width: min(260px, calc(100vw - 16px));
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
}

.dcp-tooltip__bubble:where([data-placement="top"]) {
  bottom: 100%;
  padding-bottom: 8px;
}

.dcp-tooltip__bubble:where([data-placement="bottom"]) {
  top: 100%;
  padding-top: 8px;
}

.dcp-tooltip__bubble:where([data-open]) {
  opacity: 1;
  visibility: visible;
}

.dcp-tooltip__content {
  display: block;
  background: var(--color-light);
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-grayDark);
  text-align: left;
}

.dcp-tooltip__headline {
  display: block;
  font-weight: 700;
  color: var(--color-dark);
}

.dcp-tooltip__cta {
  display: block;
  margin-top: 5px;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.3s ease;
}

.dcp-tooltip__cta:hover {
  color: var(--color-primaryDark);
}

@media screen and (min-width: 992px) {
  .dcp-tooltip__content {
    font-size: 14px;
    line-height: 1.7;
  }
}`;

export const tooltipStyles: DesignStyles = {
  classic: css,
  modern: css,
};
