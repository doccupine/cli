import type { DesignStyles } from "./index.js";
import { squareButtonRules } from "./controls.js";

// The site banner (components/layout/Banner.tsx), above the header.
//
//   .dcp-banner            the banner: a one-row grid ([data-dismissing]
//                          while it collapses, [hidden] once dismissed)
//   .dcp-banner__clip      the row, clipping the bar as it collapses
//   .dcp-banner__bar       the bar: the text and the close button
//   .dcp-banner__content   the announcement text
//   .dcp-banner__dismiss   the close button, when the banner is dismissible
//
// The banner scrolls away with the page. While part of it is on screen, the
// fixed parts of the page start below it: Banner.tsx records its height in
// --dcp-banner-height and the visible part in --dcp-banner-offset on <html>
// (before the first paint, then on scroll and resize), and the rules below
// push the rails and the mobile menu down by the visible part. Without a
// banner both are unset and every offset falls back to 0. The header itself
// pins once the banner is gone (Header.tsx, header.ts).
//
// Design-layer rules, so the banner's own link ring wins over the site's
// link focus ring (controls.ts) and the offsets win over the rails' own.
const css = `/* A one-row grid around the bar: dismissing animates the row from 1fr to
   0fr (the bar's full height to nothing) while it fades, so the header and
   the page below slide up with it. */
.dcp-banner {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
  transition:
    grid-template-rows 0.28s ease,
    opacity 0.28s ease;
}

.dcp-banner[data-dismissing] {
  grid-template-rows: 0fr;
  opacity: 0;
}

.dcp-banner[hidden] {
  display: none;
}

.dcp-banner__clip {
  min-height: 0;
  overflow: hidden;
}

.dcp-banner__bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 8px 48px;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
}

.dcp-banner__content {
  margin: 0;
  color: inherit;
}

.dcp-banner__content a {
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.dcp-banner__content a:focus-visible {
  outline: none;
  border-radius: 4px;
  box-shadow: 0 0 0 2px var(--color-on-primary);
}

.dcp-banner__content code {
  padding: 1px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-on-primary) 15%, transparent);
  color: inherit;
  font-size: 0.9em;
}

/* The close button: the site's 32px ghost square (like the search and chat
   close buttons), in the banner's own colors. */
${squareButtonRules(".dcp-banner__dismiss")}

.dcp-banner__dismiss {
  position: absolute;
  top: 50%;
  right: 8px;
  color: var(--color-on-primary);
  transform: translateY(-50%);
}

.dcp-banner__dismiss:hover {
  color: var(--color-on-primary);
  background: color-mix(in srgb, var(--color-on-primary) 15%, transparent);
}

.dcp-banner__dismiss:focus-visible {
  box-shadow: 0 0 0 2px var(--color-on-primary);
}

/* Below "lg" the navigation opens as a sheet under the header. */
.dcp-sidebar {
  margin-top: var(--dcp-banner-offset, 0px);
}

@media screen and (max-width: 991px) {
  .dcp-sidebar {
    max-height: calc(
      100dvh - var(--layout-header-height) - var(--dcp-banner-offset, 0px)
    );
  }

  .dcp-sidebar:where([data-sections]) {
    max-height: calc(
      100dvh - var(--layout-header-height-with-sections) -
        var(--dcp-banner-offset, 0px)
    );
  }
}

/* From "lg" up the rails are fixed to the viewport's full height. */
@media screen and (min-width: 992px) {
  .dcp-sidebar,
  .dcp-toc,
  .dcp-side-panel {
    margin-top: var(--dcp-banner-offset, 0px);
    height: calc(100dvh - var(--dcp-banner-offset, 0px));
    max-height: calc(100dvh - var(--dcp-banner-offset, 0px));
  }
}

@media (prefers-reduced-motion: reduce) {
  .dcp-banner,
  .dcp-banner__dismiss {
    transition: none;
  }
}`;

export const bannerStyles: DesignStyles = { classic: css, modern: css };
