import type { DesignStyles } from "./index.js";

// <RequestExample> / <ResponseExample> (components/layout/ApiExample.tsx)
// and the rail Docs gathers them into.
//
//   .dcp-api-examples         the rail: also .dcp-side-panel, whose rules
//                             pin it to the right column from "lg" up and
//                             make the article columns room for it
//   .dcp-api-example          one example (<figure>), data-kind="request"
//                             or "response"
//   .dcp-api-example__label   its label (<figcaption>)
//
// The side panel's rules are shared; these sit in the design layer, so they
// win where they differ: below "lg" the rail is plain, stacked examples
// rather than the side panel's tinted card.
const css = `.dcp-api-examples {
  gap: 20px;
  padding: 0;
  border-radius: 0;
  background: none;
}

@media screen and (min-width: 992px) {
  .dcp-api-examples {
    gap: 24px;
    padding: var(--layout-rail-top) 20px 24px;
    background: var(--color-light);
  }
}

.dcp-api-example {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  margin: 0;
}

.dcp-api-example__label {
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.dcp-api-example > p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-grayDark);
}`;

export const apiExamplesStyles: DesignStyles = { classic: css, modern: css };
