import type { DesignStyles } from "./index.js";

// <Field> (components/layout/Field.tsx): an API field's name, type and
// required tag over its description.
//
//   .dcp-field             the block, ruled below
//   .dcp-field__meta       the name / type / required row
//   .dcp-field__value      the field name
//   .dcp-field__type       the type tag
//   .dcp-field__required   the "required" tag
//
// Nested fields: an <Accordion> inside a <Field> is the field's child
// properties. It drops the accordion's card or rows for a small pill toggle
// and an indented body ruled on the left. These rules sit in the design
// layer after the accordion's own (accordion.ts), and their two-class
// selectors outrank its one-class ones in both designs.
const nested = `.dcp-field .dcp-accordion {
  width: auto;
  margin: 12px 0 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: none;
}

.dcp-field .dcp-accordion + .dcp-accordion {
  margin-top: 8px;
}

.dcp-field .dcp-accordion__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: auto;
  height: 28px;
  padding: 0 10px 0 8px;
  border: solid 1px var(--color-grayLight);
  border-radius: 30px;
  font-size: 13px;
  line-height: 1;
  font-weight: 500;
  color: var(--color-grayDark);
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.dcp-field .dcp-accordion__title:hover {
  color: var(--color-dark);
  border-color: var(--color-gray);
}

.dcp-field .dcp-accordion__title:focus-visible {
  outline: none;
  border-radius: 30px;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

/* The chevron leads the label and turns a quarter: right while closed, down
   while open. */
.dcp-field .dcp-accordion__title .lucide-chevron-down {
  position: static;
  order: -1;
  width: 14px;
  height: 14px;
  color: inherit;
  transform: rotate(-90deg);
}

.dcp-field .dcp-accordion__title[aria-expanded="true"] .lucide-chevron-down {
  transform: none;
}

.dcp-field .dcp-accordion__content {
  gap: 16px;
  margin: 0 0 0 13px;
  padding: 0 0 0 16px;
  border-left: solid 1px var(--color-grayLight);
  font-size: inherit;
}

.dcp-field .dcp-accordion__content[aria-hidden="false"] {
  margin: 12px 0 0 13px;
  padding: 4px 0 4px 16px;
}

/* Child fields are lighter: no rule under the last one, less space. */
.dcp-field .dcp-accordion__content .dcp-field {
  padding-bottom: 16px;
}

.dcp-field .dcp-accordion__content .dcp-field:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-field .dcp-accordion__title,
  .dcp-field .dcp-accordion__title .lucide-chevron-down {
    transition: none;
  }
}`;

export const fieldStyles: DesignStyles = {
  classic: nested,
  modern: nested,
  shared: `.dcp-field {
  border-bottom: solid 1px var(--color-grayLight);
  padding: 0 0 20px 0;
  color: var(--color-grayDark);
}

.dcp-field__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  line-height: 1.7;
  padding: 0 0 15px 0;
}

@media screen and (min-width: 992px) {
  .dcp-field__meta {
    font-size: 14px;
    line-height: 1.7;
  }
}

.dcp-field__value {
  /* The text-safe primary: the raw primary fails AA as 14px text on the dark
     default palette. */
  color: var(--color-primary-text);
  font-family: "Roboto Mono", monospace;
  font-weight: 600;
}

.dcp-field__type {
  background: color-mix(in srgb, var(--color-primaryLight) 20%, transparent);
  color: var(--color-dark);
  padding: 0 4px;
  font-family: "Roboto Mono", monospace;
  border-radius: 6px;
}

.dcp-field__required {
  background: color-mix(in srgb, var(--color-error) 20%, transparent);
  color: var(--color-error-text);
  padding: 0 4px;
  font-family: "Roboto Mono", monospace;
  border-radius: 6px;
}`,
};
