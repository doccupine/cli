import type { DesignStyles } from "./index.js";

// <Callout> (components/layout/Callout.tsx).
//
//   .dcp-callout          the panel; data-type="note" | "info" | "warning" |
//                         "danger" | "success" picks the alert tint
//   .dcp-callout__body    the column of children beside the icon
//
// The tints are alert-semantic and independent of theme.json; dark values sit
// under :root.dark. In light mode a callout's paragraphs keep the article's
// own text color (docs.ts) and only the icon takes the tint; in dark mode the
// paragraphs take it too. The type selectors are wrapped in :where() so they
// keep the specificity of a single class.
export const calloutStyles: DesignStyles = {
  classic: `.dcp-callout {
  background: var(--color-light);
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  padding: 20px;
  margin: 0;
  max-width: 100%;
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-grayDark);
  display: flex;
}

@media screen and (min-width: 992px) {
  .dcp-callout {
    font-size: 14px;
    line-height: 1.7;
  }
}

.dcp-callout svg {
  vertical-align: middle;
  min-width: min-content;
  margin: 3px 10px 0 0;
}

.dcp-callout:where([data-type="note"]) {
  border-color: #0ea5e933;
  background: #f0f9ff80;
}

.dcp-callout:where([data-type="note"]) svg.lucide {
  color: #0c4a6e;
}

:root.dark .dcp-callout:where([data-type="note"]) {
  border-color: #0ea5e94d;
  background: #0ea5e91a;
}

:root.dark .dcp-callout:where([data-type="note"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="note"]) p {
  color: #bae6fd;
}

.dcp-callout:where([data-type="info"]) {
  border-color: #71717a33;
  background: #fafafa80;
}

.dcp-callout:where([data-type="info"]) svg.lucide,
.dcp-callout:where([data-type="info"]) .lucide {
  color: #18181b;
}

:root.dark .dcp-callout:where([data-type="info"]) {
  border-color: #71717a4d;
  background: #71717a1a;
}

:root.dark .dcp-callout:where([data-type="info"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="info"]) .lucide,
:root.dark .dcp-callout:where([data-type="info"]) p {
  color: #e4e4e7;
}

.dcp-callout:where([data-type="warning"]) {
  border-color: #f59e0b33;
  background: #fffbeb80;
}

.dcp-callout:where([data-type="warning"]) svg.lucide {
  color: #78350f;
}

:root.dark .dcp-callout:where([data-type="warning"]) {
  border-color: #f59e0b4d;
  background: #f59e0b1a;
}

:root.dark .dcp-callout:where([data-type="warning"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="warning"]) p {
  color: #fde68a;
}

.dcp-callout:where([data-type="danger"]) {
  border-color: #ef444433;
  background: #fef2f280;
}

.dcp-callout:where([data-type="danger"]) svg.lucide {
  color: #7f1d1d;
}

:root.dark .dcp-callout:where([data-type="danger"]) {
  border-color: #ef44444d;
  background: #ef44441a;
}

:root.dark .dcp-callout:where([data-type="danger"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="danger"]) p {
  color: #fecaca;
}

.dcp-callout:where([data-type="success"]) {
  border-color: #10b98133;
  background: #ecfdf580;
}

.dcp-callout:where([data-type="success"]) svg.lucide {
  color: #064e3b;
}

:root.dark .dcp-callout:where([data-type="success"]) {
  border-color: #10b9814d;
  background: #10b9811a;
}

:root.dark .dcp-callout:where([data-type="success"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="success"]) p {
  color: #a7f3d0;
}

.dcp-callout__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}`,
  modern: `/* Soft tinted panels without borders. A typed callout tints its fill, icon
   and text with its alert color; an untyped one sits on a neutral wash. */
.dcp-callout {
  background: color-mix(in srgb, var(--color-dark) 4%, transparent);
  border-radius: 12px;
  padding: 14px 16px;
  margin: 0;
  max-width: 100%;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-grayDark);
  display: flex;
  gap: 12px;
}

.dcp-callout svg {
  flex-shrink: 0;
  min-width: min-content;
  margin: 3px 0 0;
}

.dcp-callout:where([data-type="note"]) {
  background: #0ea5e914;
}

.dcp-callout:where([data-type="note"]) svg.lucide {
  color: #0c4a6e;
}

:root.dark .dcp-callout:where([data-type="note"]) {
  background: #0ea5e91f;
}

:root.dark .dcp-callout:where([data-type="note"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="note"]) p {
  color: #bae6fd;
}

.dcp-callout:where([data-type="info"]) {
  background: #71717a14;
}

.dcp-callout:where([data-type="info"]) svg.lucide,
.dcp-callout:where([data-type="info"]) .lucide {
  color: #18181b;
}

:root.dark .dcp-callout:where([data-type="info"]) {
  background: #a1a1aa1f;
}

:root.dark .dcp-callout:where([data-type="info"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="info"]) .lucide,
:root.dark .dcp-callout:where([data-type="info"]) p {
  color: #e4e4e7;
}

.dcp-callout:where([data-type="warning"]) {
  background: #f59e0b1a;
}

.dcp-callout:where([data-type="warning"]) svg.lucide {
  color: #78350f;
}

:root.dark .dcp-callout:where([data-type="warning"]) {
  background: #f59e0b1f;
}

:root.dark .dcp-callout:where([data-type="warning"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="warning"]) p {
  color: #fde68a;
}

.dcp-callout:where([data-type="danger"]) {
  background: #ef444414;
}

.dcp-callout:where([data-type="danger"]) svg.lucide {
  color: #7f1d1d;
}

:root.dark .dcp-callout:where([data-type="danger"]) {
  background: #ef44441f;
}

:root.dark .dcp-callout:where([data-type="danger"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="danger"]) p {
  color: #fecaca;
}

.dcp-callout:where([data-type="success"]) {
  background: #10b98117;
}

.dcp-callout:where([data-type="success"]) svg.lucide {
  color: #064e3b;
}

:root.dark .dcp-callout:where([data-type="success"]) {
  background: #10b9811f;
}

:root.dark .dcp-callout:where([data-type="success"]) svg.lucide,
:root.dark .dcp-callout:where([data-type="success"]) p {
  color: #a7f3d0;
}

.dcp-callout__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}`,
};
