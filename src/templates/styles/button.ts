import type { DesignStyles } from "./index.js";

// Button (components/layout/Button.tsx): the MDX button, as a <button> or,
// with an href, a link. Adapted from cherry-styled-components (MIT,
// https://github.com/cherry-design-system/styled-components), whose button
// look it keeps.
//
//   .dcp-button        the button or link (links also carry .button-link,
//                      which opts them out of the base link focus ring)
//     data-variant     primary | secondary | tertiary (absent when disabled)
//     data-disabled    the disabled look (a disabled button, or a link)
//     data-outline     outlined instead of filled
//     data-error       the error color (absent when disabled)
//     data-size        default | big | small
//     data-full-width  stretches to its container
//
// Variants are written `.dcp-button:where([...])` to keep the button's own
// single-class specificity, as the one styled rule it replaces had. The rules
// sit in the design layer, after the article prose (docs.ts), so the icon and
// paragraph colors win against it as they did before.
const css = `.dcp-button {
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  display: inline-flex;
  padding: 15px 30px;
  border-radius: 100px;
  font-weight: 600;
  white-space: nowrap;
  hyphens: auto;
  color: var(--color-onFilled);
  text-decoration: none;
  transition: all 0.3s ease;
  text-align: center;
  gap: 10px;
  text-overflow: ellipsis;
  justify-content: center;
  align-items: center;
  min-height: fit-content;
}

.dcp-button .icon,
.dcp-button .lucide {
  margin: auto 0;
}

.dcp-button:where([data-variant="primary"]) {
  background: var(--color-primary-fill);
  border: solid 2px var(--color-primary-fill);
  box-shadow: 0 0 0 0px var(--color-primary);
}

.dcp-button:where([data-variant="primary"]):hover {
  background: var(--color-primary-fill-hover);
  border-color: var(--color-primary-fill-hover);
  color: var(--color-on-primary-hover);
}

.dcp-button:where([data-variant="primary"]):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-button:where([data-variant="primary"][data-outline]) {
  color: var(--color-primary-text);
  background: transparent;
  border-color: var(--color-primary);
}

.dcp-button:where([data-variant="primary"][data-outline]):hover {
  background: transparent;
  border-color: var(--color-primaryDark);
  color: var(--color-primary-text-hover);
}

.dcp-button:where([data-variant="secondary"]) {
  background: var(--color-secondary-fill);
  border: solid 2px var(--color-secondary-fill);
  box-shadow: 0 0 0 0px var(--color-secondary);
}

.dcp-button:where([data-variant="secondary"]):hover {
  background: var(--color-secondary-fill-hover);
  border-color: var(--color-secondary-fill-hover);
  color: var(--color-on-secondary-hover);
}

.dcp-button:where([data-variant="secondary"]):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-secondaryLight);
}

.dcp-button:where([data-variant="secondary"][data-outline]) {
  color: var(--color-secondary-text);
  background: transparent;
  border-color: var(--color-secondary);
}

.dcp-button:where([data-variant="secondary"][data-outline]):hover {
  background: transparent;
  color: var(--color-secondary-text-hover);
}

.dcp-button:where([data-variant="tertiary"]) {
  background: var(--color-tertiary-fill);
  border: solid 2px var(--color-tertiary-fill);
  box-shadow: 0 0 0 0px var(--color-tertiary);
}

.dcp-button:where([data-variant="tertiary"]):hover {
  background: var(--color-tertiary-fill-hover);
  border-color: var(--color-tertiary-fill-hover);
  color: var(--color-on-tertiary-hover);
}

.dcp-button:where([data-variant="tertiary"]):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-tertiaryLight);
}

.dcp-button:where([data-variant="tertiary"][data-outline]) {
  color: var(--color-tertiary-text);
  background: transparent;
  border-color: var(--color-tertiary);
}

.dcp-button:where([data-variant="tertiary"][data-outline]):hover {
  background: transparent;
  color: var(--color-tertiary-text-hover);
}

.dcp-button:where([data-error]) {
  background: var(--color-error-fill);
  border: solid 2px var(--color-error-fill);
  box-shadow: 0 0 0 0px var(--color-error);
}

.dcp-button:where([data-error]):hover {
  background: var(--color-error-fill-hover);
  border-color: var(--color-error-fill-hover);
  color: var(--color-on-error-hover);
}

.dcp-button:where([data-error]):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-error) 90%, white);
}

.dcp-button:where([data-error][data-outline]) {
  color: var(--color-error-text);
  background: transparent;
  border-color: var(--color-error);
}

.dcp-button:where([data-error][data-outline]):hover {
  background: transparent;
  color: var(--color-error-text-hover);
}

.dcp-button:where([data-size="default"]) {
  height: 50px;
  font-size: 16px;
  line-height: 1;
}

.dcp-button:where([data-size="big"]) {
  height: 60px;
  font-size: 18px;
  line-height: 1;
  padding: 18px 30px;
}

.dcp-button:where([data-size="small"]) {
  height: 40px;
  font-size: 14px;
  line-height: 1;
  padding: 10px 20px;
}

.dcp-button:where([data-disabled]) {
  cursor: not-allowed;
  background: var(--color-grayLight);
  border: solid 2px var(--color-grayLight);
  color: var(--color-gray);
}

.dcp-button:where([data-full-width]) {
  width: 100%;
}

/* A filled button's fill and label, and their hover pair: the colors
   tokens.css computes so the label reaches WCAG AA (--color-<key>-fill,
   --color-on-<key>, --color-<key>-fill-hover, --color-on-<key>-hover). */
.dcp-button:where([data-variant="primary"]:not([data-outline])) {
  color: var(--color-on-primary);
}

.dcp-button:where([data-variant="secondary"]:not([data-outline])) {
  color: var(--color-on-secondary);
}

.dcp-button:where([data-variant="tertiary"]:not([data-outline])) {
  color: var(--color-on-tertiary);
}

.dcp-button:where([data-error]:not([data-outline])) {
  color: var(--color-on-error);
}

.dcp-button p {
  color: inherit !important;
}

.dcp-button svg.lucide {
  margin: auto 0;
  min-width: min-content;
  color: inherit;
}`;

export const buttonStyles: DesignStyles = {
  classic: css,
  modern: css,
};
