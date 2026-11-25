import type { DesignStyles } from "./index.js";

// ColorSwatch (components/layout/ColorSwatch.tsx): a color sample with its
// token name.
//
//   .dcp-swatch-group         the grid of swatches; with a cols prop it
//                             carries --dcp-swatch-columns-sm/-md/-lg, the
//                             count capped for each breakpoint
//   .dcp-swatch               one swatch
//   .dcp-swatch__color        the sample, painted from the inline
//                             --dcp-swatch-color, opaque so the label's
//                             contrast is the color's own; data-light-text
//                             when white contrasts more than black
//   .dcp-swatch__label        the token name row
//
// In the design layer after the article prose (docs.ts), competing with it
// by specificity as before.
//
// The grid shows two columns, three from "md". A cols prop replaces those
// counts: capped at two below "md" and three below "xl", the full count from
// "xl", so a wide group never squeezes its swatches on a narrow screen and a
// one-column group stays one.
const css = `.dcp-swatch-group {
  display: grid;
  grid-template-columns: repeat(var(--dcp-swatch-columns-sm, 2), 1fr);
  gap: 20px;
}

.dcp-swatch {
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  overflow: hidden;
}

.dcp-swatch__color {
  background: var(--dcp-swatch-color);
  height: 80px;
  display: flex;
  align-items: flex-end;
  padding: 8px 12px;
  color: #000000;
  font-size: 12px;
  font-family: monospace;
  border-bottom: solid 1px var(--color-grayLight);
}

.dcp-swatch__color:where([data-light-text]) {
  color: #ffffff;
}

.dcp-swatch__label {
  padding: 10px 12px;
  background: var(--color-light);
  line-height: 1.7;
  font-size: 13px;
  color: var(--color-grayDark);
}

.dcp-swatch__label code {
  color: var(--color-dark);
  font-weight: 600;
  font-size: 13px;
}

@media screen and (min-width: 768px) {
  .dcp-swatch-group {
    grid-template-columns: repeat(var(--dcp-swatch-columns-md, 3), 1fr);
  }
}

@media screen and (min-width: 1200px) {
  .dcp-swatch-group {
    grid-template-columns: repeat(var(--dcp-swatch-columns-lg, 3), 1fr);
  }
}

/* The label's text size steps up from "lg" (the theme's body text size),
   after its own 13px, as before. */
@media screen and (min-width: 992px) {
  .dcp-swatch__label {
    font-size: 16px;
    line-height: 1.7;
  }
}`;

export const colorSwatchStyles: DesignStyles = {
  classic: css,
  modern: css,
};
