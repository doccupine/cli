import type { DesignStyles } from "./index.js";
import { pillRules, primaryIconRules } from "./controls.js";

const primaryIcons = primaryIconRules([
  ".dcp-action-bar__markdown",
  ".dcp-action-bar__toggle",
]);

// The page action bar at the top of the article and the content area under
// it (components/layout/ActionBar.tsx).
//
//   .dcp-action-bar              the row; data-rss when it has an RSS link
//   .dcp-action-bar__eyebrow     the page's category (modern)
//   .dcp-action-bar__group       the copy (and RSS) buttons
//   .dcp-action-bar__actions     the markdown link and the view toggle
//   .dcp-action-button           a small labelled button (copy, RSS)
//   .dcp-action-bar__copy        the copy button, data-copied after a copy
//   .dcp-action-bar__rss         the RSS link
//   .dcp-action-bar__label       a button label, visually hidden when the row
//                                is too narrow for it
//   .dcp-action-bar__markdown    the "view as markdown" link
//   .dcp-action-bar__toggle      the rendered/source switch, data-knob="end"
//                                while the source shows
//   .dcp-action-bar__content     the area under the row; data-raw while it
//                                shows the source, data-section-bar when the
//                                header has a section bar
//   .dcp-raw-source              the source view's textarea wrapper
//   .dcp-raw-source__textarea    the source view's textarea
//
// The modern design draws the buttons with the shared pill classes
// (dcp-pill, dcp-pill-round, dcp-pill-switch), which the classic design
// leaves unstyled.
//
// The bar renders inside the article (.dcp-docs), whose prose rules sit in
// the design layer, so the bar's own rules that meet them are there too and
// compete with the prose by specificity.
// The labelled page actions (copy, RSS): the same pill as the icon-only
// controls, primary icon, primary border on hover, no fill change, and a ring
// on keyboard focus only. A copy turns the pill success-green.
const labelledPills = `${pillRules(
  [".dcp-action-bar__copy", ".dcp-action-bar__rss"],
  [],
  [],
)}

.dcp-action-bar__rss {
  text-decoration: none;
}

/* dcp-action-button keeps a primary border after a click; the pills show
   primary on hover only. */
.dcp-action-bar__copy:focus,
.dcp-action-bar__rss:focus {
  border-color: var(--color-grayLight);
}

${primaryIconRules([".dcp-action-bar__copy", ".dcp-action-bar__rss"])}

.dcp-action-bar__copy[data-copied],
.dcp-action-bar__copy[data-copied]:hover {
  color: var(--color-success);
  border-color: var(--color-success);
}

.dcp-action-bar__copy[data-copied] svg.lucide,
.dcp-action-bar__copy[data-copied]:hover svg.lucide {
  color: var(--color-success);
}`;

export const actionBarStyles: DesignStyles = {
  shared: `/* A small bordered button with the interactive ring. */
.dcp-action-button {
  transition: all 0.2s ease;
  border: solid 1px var(--color-grayLight);
  box-shadow: 0 0 0 0px var(--color-primary);
  background: var(--color-light);
  color: var(--color-accent);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: -6px;
}

.dcp-action-button:hover {
  border-color: var(--color-primary);
}

.dcp-action-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-raw-source {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
}

.dcp-raw-source__textarea {
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  outline: none;
  cursor: text;
  min-width: 100px;
  font-family: inherit;
  display: inline-block;
  padding: 15px;
  border-radius: 6px;
  font-weight: 400;
  white-space: break-spaces;
  hyphens: none;
  color: var(--color-dark);
  background: var(--color-light);
  border: solid 2px var(--color-grayLight);
  box-shadow: 0 0 0 0px var(--color-primaryLight);
  transition: all 0.3s ease;
  min-height: 80px;
  font-size: 16px;
  line-height: 1.7;
  width: 100%;
}

.dcp-raw-source__textarea::placeholder {
  color: var(--color-gray);
}

.dcp-raw-source__textarea:hover:not([disabled]) {
  border-color: var(--color-primary);
}

.dcp-raw-source__textarea:focus:not([disabled]) {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
  border-color: var(--color-primary);
}`,
  classic: `.dcp-action-button svg.lucide {
  color: inherit;
}

.dcp-action-bar {
  border-bottom: solid 1px var(--color-grayLight);
  left: 0;
  padding: 12px 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: var(--layout-content-width);
  margin: auto;
  transition: all 0.3s ease;
}

.dcp-action-bar__actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  margin: auto 0;
}

.dcp-action-bar__label {
  white-space: nowrap;
}

@media screen and (max-width: 279px) {
  .dcp-action-bar__label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
}

@media screen and (max-width: 343px) {
  [data-rss] .dcp-action-bar__label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
}

/* dcp-action-button's -6px right margin aligns a lone button with the
   edge; inside the group it would eat into the gap. */
.dcp-action-bar__group {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
}

.dcp-action-bar__group > * {
  margin-right: 0;
}

/* The markdown link and the view toggle: the modern design's pills (see
   pillRules in controls.ts), so both designs share the same page actions. */
${pillRules(
  [".dcp-action-bar__markdown", ".dcp-action-bar__toggle"],
  [".dcp-action-bar__markdown"],
  [".dcp-action-bar__toggle"],
)}

.dcp-action-bar__markdown {
  text-decoration: none;
}

${primaryIcons}

${labelledPills}

.dcp-action-bar__content {
  padding-top: 20px;
  transition: all 0.3s ease;
}

/* The source view's textarea fills the viewport. Scoped to data-raw so it
   never reaches textareas inside page content. */
.dcp-action-bar__content[data-raw] textarea {
  max-width: var(--layout-content-width);
  margin: auto;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 160px);
}

.dcp-action-bar__content[data-raw][data-section-bar] textarea {
  min-height: calc(100vh - 202px);
}

@media screen and (min-width: 992px) {
  .dcp-action-bar__content[data-raw] textarea,
  .dcp-action-bar__content[data-raw][data-section-bar] textarea {
    min-height: calc(100vh - 159px);
  }
}`,
  modern: `.dcp-action-button svg.lucide {
  color: inherit;
}

/* The page header's top row: the page's category as an eyebrow on the left,
   quiet page actions on the right. The title follows in the content. */
.dcp-action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  max-width: var(--layout-content-width);
  margin: auto;
}

.dcp-action-bar__eyebrow {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  color: var(--color-accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dcp-action-bar__actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

/* Below 390px (450px with the RSS link) the labels are visually hidden and
   the pills go icon-only, so the row never wraps or squeezes its controls
   (only the eyebrow truncates). */
.dcp-action-bar__label {
  white-space: nowrap;
}

@media screen and (max-width: 389px) {
  .dcp-action-bar__label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    border: 0;
  }
}

@media screen and (max-width: 449px) {
  [data-rss] .dcp-action-bar__label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    border: 0;
  }
}

${labelledPills}

.dcp-action-bar__copy,
.dcp-action-bar__rss {
  margin: 0;
  flex-shrink: 0;
}

@media screen and (max-width: 389px) {
  .dcp-action-bar__copy,
  .dcp-action-bar__rss {
    padding: 0 9px;
  }
}

@media screen and (max-width: 449px) {
  [data-rss] .dcp-action-bar__copy,
  [data-rss] .dcp-action-bar__rss {
    padding: 0 9px;
  }
}

.dcp-action-bar__group {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  margin-left: auto;
}

.dcp-action-bar__group > * {
  margin-right: 0;
}

.dcp-action-bar__content {
  padding-top: 8px;
}

/* The source view's textarea fills the viewport. Scoped to data-raw so it
   never reaches textareas inside page content. */
.dcp-action-bar__content[data-raw] {
  padding-top: 16px;
}

.dcp-action-bar__content[data-raw] textarea {
  max-width: var(--layout-content-width);
  margin: auto;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 180px);
}

.dcp-action-bar__content[data-raw][data-section-bar] textarea {
  min-height: calc(100vh - 220px);
}

@media screen and (min-width: 992px) {
  .dcp-action-bar__content[data-raw] textarea,
  .dcp-action-bar__content[data-raw][data-section-bar] textarea {
    min-height: calc(100vh - 180px);
  }
}

${primaryIcons}`,
};
