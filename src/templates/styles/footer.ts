import type { DesignStyles } from "./index.js";

// The rows under the article: the links.json row
// (components/layout/StaticLinks.tsx) and the "Powered by" footer
// (components/layout/Footer.tsx). Both are padded like the article column
// (data-chat-open while the chat panel is open).
//
//   .dcp-links            the links row's outer column
//   .dcp-links__content   the row, capped at the content width
//   .dcp-links__link      a link, data-has-icon when it starts with an icon
//   .dcp-footer           the footer's outer column, data-has-links when the
//                         links row is above it
//   .dcp-footer__inner    the footer's content, capped at the content width
//   .dcp-footer__row      the credit and the GitHub mark
//   .dcp-footer-space     the bottom gap that replaces the footer on small
//                         screens when branding is hidden
export const footerStyles: DesignStyles = {
  shared: `.dcp-links {
  display: flex;
  transition: all 0.3s ease;
}

.dcp-links__content {
  max-width: var(--layout-content-width);
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  margin: 0 auto;
}

.dcp-links__link {
  display: flex;
  gap: 6px;
  white-space: nowrap;
  min-width: fit-content;
  text-decoration: none;
}

.dcp-footer {
  transition: all 0.3s ease;
}

.dcp-footer__inner {
  max-width: var(--layout-content-width);
  margin: 0 auto;
  color: var(--color-grayDark);
}

.dcp-footer__inner a {
  text-decoration: none;
  display: inline-flex;
}

/* The GitHub logo is an icon-only link: round the global focus ring so it
   hugs the icon instead of drawing a rectangle. */
.dcp-footer__inner a:has(svg):focus-visible {
  border-radius: 100%;
}

.dcp-footer__row {
  display: flex;
  align-items: center;
  gap: 20px;
}

@media screen and (min-width: 0px) {
  .dcp-footer-space {
    display: block;
    min-height: 80px;
    max-height: 80px;
  }
}

@media screen and (min-width: 992px) {
  .dcp-footer-space {
    display: none;
  }
}`,
  classic: `.dcp-links {
  margin: 0 auto;
  padding: 0 20px;
  margin-bottom: 20px;
}

@media screen and (min-width: 992px) {
  .dcp-links {
    margin: 0;
    padding: 0 calc(var(--layout-toc-width) + var(--layout-gutter)) 20px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }

  .dcp-links[data-chat-open] {
    padding: 0 calc(var(--layout-chat-width) + var(--layout-gutter)) 20px
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 1200px) {
  body:has([data-side-panel]) .dcp-links {
    padding-right: calc(var(--layout-chat-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 992px) {
  html[data-focus-mode] .dcp-links:not([data-chat-open]) {
    padding-left: 20px;
    padding-right: 20px;
  }
}

.dcp-links__content {
  gap: 16px;
}

/* Tinted chips with the interactive ring (dcp-interactive's rules). */
.dcp-links__link {
  position: relative;
  font-size: 14px;
  line-height: 1;
  color: var(--color-accent);
  transition: all 0.3s ease;
  font-weight: 600;
  background: color-mix(in srgb, var(--color-primaryLight) 10%, transparent);
  padding: 6px 8px;
  border-radius: 6px;
  border: solid 1px transparent;
  box-shadow: 0 0 0 0px var(--color-primary);
}

.dcp-links__link:hover {
  border-color: var(--color-primary);
}

.dcp-links__link:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primaryLight);
}

.dcp-links__link:active {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-links__link[data-has-icon] {
  padding-left: 30px;
}

.dcp-links__link * {
  margin: auto 0;
}

.dcp-links__link svg {
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
}

.dcp-links__link:hover {
  color: var(--color-accent);
}

.dcp-footer {
  padding: 0 20px;
}

.dcp-footer[data-has-links] {
  margin-top: 20px;
}

@media screen and (min-width: 992px) {
  .dcp-footer,
  .dcp-footer[data-has-links] {
    margin: 0;
    padding: 0 calc(var(--layout-toc-width) + var(--layout-gutter)) 0
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }

  .dcp-footer[data-chat-open] {
    padding: 0 calc(var(--layout-chat-width) + var(--layout-gutter)) 0
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 1200px) {
  body:has([data-side-panel]) .dcp-footer {
    padding-right: calc(var(--layout-chat-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 992px) {
  html[data-focus-mode] .dcp-footer:not([data-chat-open]) {
    padding-left: 20px;
    padding-right: 20px;
  }
}

.dcp-footer__inner {
  border-top: solid 1px var(--color-grayLight);
  padding: 28px 0;
  font-size: 12px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-footer__inner {
    font-size: 14px;
    line-height: 1.7;
    padding: 20px 0;
  }
}

.dcp-footer__inner a {
  font-weight: 700;
  color: var(--color-accent);
  transition: all 0.3s ease;
}

.dcp-footer__inner a:hover {
  color: var(--color-primary);
}

.dcp-footer__inner a svg {
  width: 18px;
  height: 18px;
}

.dcp-footer__row {
  justify-content: flex-start;
}

@media screen and (min-width: 992px) {
  .dcp-footer__row {
    justify-content: space-between;
  }
}`,
  modern: `.dcp-links {
  padding: 0 var(--layout-gutter);
}

@media screen and (min-width: 992px) {
  .dcp-links {
    padding: 0 calc(var(--layout-toc-width) + var(--layout-gutter)) 0
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }

  .dcp-links[data-chat-open] {
    padding: 0 calc(var(--layout-chat-width) + var(--layout-gutter)) 0
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 1200px) {
  body:has([data-side-panel]) .dcp-links {
    padding-right: calc(var(--layout-chat-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 992px) {
  html[data-focus-mode] .dcp-links:not([data-chat-open]) {
    padding-left: 20px;
    padding-right: 20px;
  }
}

.dcp-links:has(a) {
  padding-bottom: 8px;
}

.dcp-links__content {
  gap: 4px 20px;
}

/* Plain muted text links with an optional leading icon. */
.dcp-links__link {
  display: inline-flex;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  color: var(--color-grayDark);
  border-radius: 6px;
  transition: color 0.2s ease;
}

.dcp-links__link svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.dcp-links__link:hover {
  color: var(--color-dark);
}

.dcp-footer {
  padding: 0 var(--layout-gutter);
}

@media screen and (min-width: 992px) {
  .dcp-footer {
    padding: 0 calc(var(--layout-toc-width) + var(--layout-gutter)) 0
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }

  .dcp-footer[data-chat-open] {
    padding: 0 calc(var(--layout-chat-width) + var(--layout-gutter)) 0
      calc(var(--layout-sidebar-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 1200px) {
  body:has([data-side-panel]) .dcp-footer {
    padding-right: calc(var(--layout-chat-width) + var(--layout-gutter));
  }
}

@media screen and (min-width: 992px) {
  html[data-focus-mode] .dcp-footer:not([data-chat-open]) {
    padding-left: 20px;
    padding-right: 20px;
  }
}

/* One quiet row: the credit on the left, the GitHub mark on the right. */
.dcp-footer__inner {
  padding: 16px 0 40px;
  font-size: 13px;
  line-height: 20px;
}

.dcp-footer__inner a {
  font-weight: 500;
  color: var(--color-dark);
  transition: color 0.2s ease;
}

.dcp-footer__inner a:hover {
  color: var(--color-accent);
}

.dcp-footer__inner a svg {
  width: 16px;
  height: 16px;
}

.dcp-footer__inner a svg [fill] {
  fill: var(--color-grayDark);
}

.dcp-footer__inner a:hover svg [fill] {
  fill: var(--color-dark);
}

.dcp-footer__row {
  justify-content: space-between;
}`,
};
