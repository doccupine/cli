import type { DesignStyles } from "./index.js";
import { pillRules } from "./controls.js";

// Preview (components/layout/Preview.tsx, PreviewCode.tsx): a live example
// on a stage, over its source in the site's own code block.
//
//   .dcp-preview              the card
//   .dcp-preview__stage       the example, centered; data-fill stretches
//                             media to its width inside the padding,
//                             data-bleed drops the padding so the content
//                             runs edge to edge, and the inline
//                             --dcp-preview-min-height sets its height
//   .dcp-preview__code        the code panel under the stage; with
//                             data-collapsible it has a toggle, and
//                             data-collapsed while it is closed
//   .dcp-preview__source      the code block inside the panel
//   .dcp-preview__toggle-row  the row holding the toggle
//   .dcp-preview__toggle      the "View code" / "Hide code" pill
//
// The rules sit in the design layer after the article prose (docs.ts) and
// the code block (code.ts), so the overrides of the nested .dcp-code win
// their ties with the block's own rules.

/** Rules both designs share; `radius` is the card's corner radius. */
function rules(radius: string, bodyPadding: string): string {
  return `.dcp-preview {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  border: solid 1px var(--color-grayLight);
  border-radius: ${radius};
  background: var(--color-light);
  overflow: hidden;
}

.dcp-preview__stage {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: var(--dcp-preview-min-height, 240px);
  padding: 32px 20px;
  background: var(--preview-stage);
}

@media screen and (min-width: 768px) {
  .dcp-preview__stage {
    padding: 48px 40px;
  }
}

.dcp-preview__stage > * {
  max-width: 100%;
}

.dcp-preview__stage p {
  margin: 0;
}

.dcp-preview__stage img,
.dcp-preview__stage video,
.dcp-preview__stage iframe {
  display: block;
  max-width: 100%;
  border-radius: 8px;
}

/* fill: media spans the stage, which keeps a slim frame of padding so the
   rounded corners read against the stage surface. An iframe has no natural
   size, so it is given a 16:9 box unless the author set a height. */
.dcp-preview__stage[data-fill] {
  padding: 16px;
}

.dcp-preview__stage[data-fill] > * {
  width: 100%;
}

.dcp-preview__stage[data-fill] img,
.dcp-preview__stage[data-fill] video,
.dcp-preview__stage[data-fill] iframe {
  width: 100%;
  height: auto;
}

.dcp-preview__stage[data-fill] iframe:not([height]) {
  aspect-ratio: 16 / 9;
}

@media screen and (min-width: 768px) {
  .dcp-preview__stage[data-fill] {
    padding: 24px;
  }
}

/* bleed: no padding and no default height, the content stacked at full
   width, flush with the card's edges. The card's own radius clips the top
   corners, so media keeps none of its own, and it sits directly on the code
   panel's hairline. An explicit minHeight still applies. */
.dcp-preview__stage[data-bleed] {
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 0;
  padding: 0;
  min-height: var(--dcp-preview-min-height, 0px);
}

.dcp-preview__stage[data-bleed] > * {
  width: 100%;
}

.dcp-preview__stage[data-bleed] img,
.dcp-preview__stage[data-bleed] video,
.dcp-preview__stage[data-bleed] iframe {
  width: 100%;
  height: auto;
  border-radius: 0;
}

.dcp-preview__stage[data-bleed] iframe {
  border: none;
}

.dcp-preview__stage[data-bleed] iframe:not([height]) {
  aspect-ratio: 16 / 9;
}

/* The code block joins the card: no border or radius of its own, a hairline
   between it and the stage. */
.dcp-preview__code {
  position: relative;
  border-top: solid 1px var(--color-grayLight);
}

.dcp-preview__code .dcp-code {
  border: none;
  border-radius: 0;
}

.dcp-preview__code .dcp-code__bar,
.dcp-preview__code .dcp-code__body {
  border-radius: 0;
}

/* Collapsed: three lines of code, then a fourth fading out under the
   toggle. lh is the code's own line height, so the cut lands on a line
   whatever the font size. clip rather than hidden: nothing (focus, find in
   page) can scroll the cut-off code into the window. */
.dcp-preview__code[data-collapsed] .dcp-code__body {
  max-height: calc(${bodyPadding} + 4lh);
  overflow: clip;
  mask-image: linear-gradient(to bottom, black 55%, transparent);
}

/* The <pre> scrolls long lines sideways on its own (the article's pre rule);
   cut off, it scrolls nothing until the code is shown, matching its removal
   from the tab order (PreviewCode). */
.dcp-preview__code[data-collapsed] .dcp-code__body pre {
  overflow: clip;
}

/* The modern block fades long lines at its right edge; the collapsed panel
   fades the whole body instead. */
.dcp-preview__code[data-collapsed] .dcp-code::after {
  display: none;
}

.dcp-preview__toggle-row {
  display: flex;
  justify-content: center;
  padding: 12px 16px;
  border-top: solid 1px var(--color-grayLight);
}

/* Above the code block, which is itself raised (z-index 2). */
.dcp-preview__code[data-collapsed] .dcp-preview__toggle-row {
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;
  bottom: 10px;
  padding: 0;
  border-top: none;
  pointer-events: none;
}

${pillRules([".dcp-preview__toggle"], [], [])}

/* Opaque, so it stays legible over the faded code; open, it keeps its
   resting look rather than the pills' expanded fill. */
.dcp-preview__toggle,
.dcp-preview__toggle[aria-expanded="true"] {
  pointer-events: auto;
  color: var(--color-grayDark);
  border-color: var(--color-grayLight);
  background: var(--color-light);
}

.dcp-preview__toggle:hover,
.dcp-preview__toggle[aria-expanded="true"]:hover {
  color: var(--color-dark);
  border-color: var(--color-gray);
  background: color-mix(in srgb, var(--color-dark) 4%, var(--color-light));
}

/* svg.lucide outranks the article's own icon color (.dcp-docs .lucide). */
.dcp-preview__toggle svg.lucide {
  margin: 0;
  color: inherit;
  transition: transform 0.2s ease;
}

.dcp-preview__toggle[aria-expanded="true"] svg.lucide {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .dcp-preview__toggle,
  .dcp-preview__toggle svg.lucide {
    transition: none;
  }
}`;
}

// The stage is a step off the page, in the code block's own tint family: the
// classic code bar's primary wash, the modern header's ink lift.
const classic = `.dcp-preview {
  --preview-stage: color-mix(
    in srgb,
    var(--color-primaryLight) 5%,
    var(--color-light)
  );
}

${rules("12px", "20px")}`;

const modern = `.dcp-preview {
  --preview-stage: color-mix(
    in srgb,
    var(--color-dark) 3%,
    var(--color-light)
  );
}

:root.dark .dcp-preview {
  --preview-stage: color-mix(
    in srgb,
    var(--color-dark) 4%,
    var(--color-light)
  );
}

${rules("16px", "14px")}`;

export const previewStyles: DesignStyles = { classic, modern };
