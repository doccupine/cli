import type { DesignStyles } from "./index.js";

// <Field> (components/layout/Field.tsx): an API field's name, type and
// required tag over its description.
//
//   .dcp-field             the block, ruled below
//   .dcp-field__meta       the name / type / required row
//   .dcp-field__value      the field name
//   .dcp-field__type       the type tag
//   .dcp-field__required   the "required" tag
export const fieldStyles: DesignStyles = {
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
  color: var(--color-primary);
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
