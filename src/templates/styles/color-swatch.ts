import type { DesignStyles } from "./index.js";

// ColorSwatch (components/layout/ColorSwatch.tsx): a color sample with its
// token name.
//
//   .dcp-swatch-group         the grid of swatches
//   .dcp-swatch               one swatch
//   .dcp-swatch__color        the sample, painted from the inline
//                             --dcp-swatch-color, opaque so the label's
//                             contrast is the color's own; data-light-text
//                             when white contrasts more than black
//   .dcp-swatch__label        the token name row
//
// In the design layer after the article prose (docs.ts), competing with it
// by specificity as before.
const css = `.dcp-swatch-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
    grid-template-columns: repeat(3, 1fr);
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
