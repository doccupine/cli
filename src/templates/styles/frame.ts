import type { DesignStyles } from "./index.js";

// Frame (components/layout/Frame.tsx): media in a soft bordered figure.
//
//   .dcp-frame            the column holding the hint and the figure
//   .dcp-frame__hint      a small note above the figure
//   .dcp-frame__figure    the bordered figure
//   .dcp-frame__content   the media, centered
//   .dcp-frame__caption   the caption under the media
//
// The rules sit in the design layer after the article prose (docs.ts), so
// they compete with it by specificity, as they did before: the article's
// image radius loses to the frame's own, and the article's paragraph color
// still wins on the hint.
const css = `.dcp-frame {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 100%;
}

.dcp-frame__hint {
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-grayDark);
  margin: 0;
}

.dcp-frame__figure {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 8px;
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-grayLight) 25%, transparent);
}

.dcp-frame__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.dcp-frame__content > * {
  max-width: 100%;
}

.dcp-frame__content p {
  margin: 0;
}

.dcp-frame__content img,
.dcp-frame__content video,
.dcp-frame__content iframe {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.dcp-frame__caption {
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
}

@media screen and (min-width: 992px) {
  .dcp-frame__hint,
  .dcp-frame__caption {
    font-size: 14px;
    line-height: 1.7;
  }
}`;

export const frameStyles: DesignStyles = {
  classic: css,
  modern: css,
};
