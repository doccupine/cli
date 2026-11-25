import type { DesignStyles } from "./index.js";

// <Steps> / <Step> (components/layout/Steps.tsx).
//
//   .dcp-steps             the list
//   .dcp-steps__step       one step, with the rail drawn by ::after
//   .dcp-steps__number     the numbered circle
//   .dcp-steps__title      the optional title row (icon and text)
//   .dcp-steps__content    the step's children
export const stepsStyles: DesignStyles = {
  classic: `.dcp-steps {
  position: relative;
  width: 100%;
}

.dcp-steps__step {
  border-radius: 12px;
  padding: 0 0 20px 52px;
  margin: 0;
  position: relative;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-grayDark);
}

@media screen and (min-width: 992px) {
  .dcp-steps__step {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-steps__step::after {
  content: "";
  position: absolute;
  left: 16px;
  top: 0;
  width: 1px;
  height: 100%;
  background: var(--color-primary);
  background: linear-gradient(180deg, var(--color-primary), transparent);
  border-radius: 4px;
}

.dcp-steps__number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.7;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
}

@media screen and (min-width: 992px) {
  .dcp-steps__number {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-steps__title {
  margin: 0 0 10px 0;
  padding: 2px 0 0 0;
  color: var(--color-dark);
  font-size: 14px;
  line-height: 1.7;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

@media screen and (min-width: 992px) {
  .dcp-steps__title {
    font-size: 16px;
    line-height: 1.7;
  }
}

/* See Card: lucide's color prop lands on an SVG presentation attribute,
   where a CSS custom property would not resolve. */
.dcp-steps__title > svg.lucide {
  color: var(--color-primary);
}

.dcp-steps__content {
  color: var(--color-grayDark);
  font-size: 14px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-steps__content {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-steps__content > .code-wrapper {
  margin: 10px 0;
}`,
  modern: `/* Small muted number circles (26px) joined by a thin rail. */
.dcp-steps {
  position: relative;
  width: 100%;
}

.dcp-steps__step {
  padding: 0 0 28px 42px;
  margin: 0;
  position: relative;
}

.dcp-steps__step::after {
  content: "";
  position: absolute;
  left: 13px;
  top: 32px;
  bottom: 6px;
  width: 1px;
  background: var(--color-grayLight);
}

.dcp-steps__step:last-child {
  padding-bottom: 0;
}

.dcp-steps__step:last-child::after {
  display: none;
}

.dcp-steps__number {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-dark) 6%, transparent);
  color: var(--color-grayDark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
}

.dcp-steps__title {
  margin: 0 0 6px;
  min-height: 26px;
  color: var(--color-dark);
  font-size: 16px;
  line-height: 26px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* See Card: lucide's color prop lands on an SVG presentation attribute,
   where a CSS custom property would not resolve. */
.dcp-steps__title > svg.lucide {
  width: 16px;
  height: 16px;
  color: var(--color-grayDark);
}

.dcp-steps__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dcp-steps__content > .code-wrapper {
  margin: 4px 0;
}`,
};
