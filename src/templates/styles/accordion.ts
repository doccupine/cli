import type { DesignStyles } from "./index.js";

// <Accordion> (components/layout/Accordion.tsx). The open state and its ARIA
// wiring live in the component; the styles read them back.
//
//   .dcp-accordion            the block
//   .dcp-accordion__title     the toggle button (aria-expanded)
//   .dcp-accordion__content   the region (aria-hidden while closed); it
//                             animates its height from 0 to auto through
//                             interpolate-size (base.css)
export const accordionStyles: DesignStyles = {
  classic: `.dcp-accordion {
  background: var(--color-light);
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  padding: 20px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  width: 100%;
}

@media screen and (min-width: 992px) {
  .dcp-accordion {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-accordion__title {
  appearance: none;
  display: block;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  font: inherit;
  cursor: pointer;
  margin: 0;
  padding: 0 40px 0 0;
  font-size: 14px;
  line-height: 1.7;
  font-weight: 700;
  color: var(--color-primary);
  transition: color 0.3s ease;
  position: relative;
}

@media screen and (min-width: 992px) {
  .dcp-accordion__title {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-accordion__title:hover {
  color: var(--color-primaryDark);
}

.dcp-accordion__title:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-accordion__title .lucide-chevron-down {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 0;
  transition: transform 0.3s ease;
}

.dcp-accordion__title[aria-expanded="true"] .lucide-chevron-down {
  transform: translateY(-50%) rotate(180deg);
}

.dcp-accordion__content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-grayDark);
  height: 0;
  overflow: clip;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-wrap: wrap;
  flex: 1;
}

@media screen and (min-width: 992px) {
  .dcp-accordion__content {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-accordion__content[aria-hidden="false"] {
  margin: 20px 0 0;
  height: auto;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-accordion__content {
    transition: none;
  }
}`,
  modern: `/* Hairline rows: each accordion is a title row between two rules, and
   consecutive accordions share the rule between them (the article's 20px
   block gap is pulled back, plus the 1px rule). */
.dcp-accordion {
  border-top: solid 1px var(--color-grayLight);
  border-bottom: solid 1px var(--color-grayLight);
  margin: 0;
  width: 100%;
}

.dcp-accordion + .dcp-accordion {
  margin-top: -21px;
}

.dcp-accordion__title {
  appearance: none;
  display: block;
  width: 100%;
  border: none;
  background: none;
  text-align: left;
  font: inherit;
  cursor: pointer;
  margin: 0;
  padding: 14px 32px 14px 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: var(--color-dark);
  transition: color 0.2s ease;
  position: relative;
}

.dcp-accordion__title:hover {
  color: var(--color-accent);
}

.dcp-accordion__title:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: inset 0 0 0 2px var(--color-primaryLight);
}

.dcp-accordion__title .lucide-chevron-down {
  position: absolute;
  top: 50%;
  right: 4px;
  width: 16px;
  height: 16px;
  color: var(--color-grayDark);
  transform: translateY(-50%);
  transition: transform 0.3s ease;
}

.dcp-accordion__title[aria-expanded="true"] .lucide-chevron-down {
  transform: translateY(-50%) rotate(180deg);
}

.dcp-accordion__content {
  height: 0;
  overflow: clip;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex-wrap: wrap;
  flex: 1;
}

.dcp-accordion__content[aria-hidden="false"] {
  padding: 0 0 16px;
  height: auto;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-accordion__content {
    transition: none;
  }
}`,
};
