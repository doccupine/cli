import type { DesignStyles } from "./index.js";

// Update (components/layout/Update.tsx): a changelog entry.
//
//   .dcp-update                the entry (its id is the anchor)
//   .dcp-update__sidebar       the label and description, sticky from "lg"
//   .dcp-update__label         the anchor chip with the entry's label
//   .dcp-update__description   the small text under the label
//   .dcp-update__body          the entry's content
//
// In the design layer after the article prose (docs.ts), competing with it
// by specificity as before.
const css = `.dcp-update {
  position: relative;
  display: flex;
  gap: 20px;
  flex-direction: column;
}

.dcp-update__label {
  display: inline-block;
  width: fit-content;
  background: color-mix(in srgb, var(--color-primaryLight) 20%, transparent);
  color: var(--color-primary);
  padding: 2px 4px;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  font-size: 12px;
  line-height: 1.7;
}

.dcp-update__label:hover {
  background: color-mix(in srgb, var(--color-primaryLight) 35%, transparent);
}

.dcp-update__description {
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-gray);
}

.dcp-update__sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dcp-update__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--color-gray);
}

@media screen and (min-width: 992px) {
  .dcp-update {
    margin: 20px 0;
    flex-direction: row;
  }

  .dcp-update__label,
  .dcp-update__description {
    font-size: 14px;
    line-height: 1.7;
  }

  .dcp-update__sidebar {
    position: sticky;
    top: 80px;
    align-self: flex-start;
    min-width: 160px;
  }
}`;

export const updateStyles: DesignStyles = {
  classic: css,
  modern: css,
};
