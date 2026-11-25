import type { DesignStyles } from "./index.js";

// The password gate (components/layout/SiteGate.tsx): a centered card with
// the password form, and the theme toggle and credit under it.
//
//   .dcp-gate                  the page
//   .dcp-gate__inner           the centered column
//   .dcp-gate__card            the card
//   .dcp-gate__icon            the lock badge
//   .dcp-gate__title           the site name
//   .dcp-gate__lede            "This site is password protected."
//   .dcp-gate__form            the form
//   .dcp-gate__field           the password field's wrapper
//   .dcp-gate__input           the password field; aria-invalid after a
//                              wrong password
//   .dcp-gate__alert           the error callout's slot
//   .dcp-gate__footer          the toggle and the credit
//   .dcp-gate__branding        "Powered by Doccupine"
//   .dcp-gate__theme-toggle    the light/dark toggle
export const siteGateStyles: DesignStyles = {
  shared: `.dcp-gate {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--color-light);
}

.dcp-gate__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 380px;
}

.dcp-gate__footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dcp-gate__branding {
  margin: 0;
  font-size: 14px;
  color: var(--color-grayDark);
}

.dcp-gate__branding a {
  color: var(--color-accent);
  font-weight: 700;
  text-decoration: none;
  transition: all 0.3s ease;
}

.dcp-gate__branding a:hover {
  color: var(--color-primary);
}

.dcp-gate__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding: 40px 32px;
  background: var(--color-light);
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.dcp-gate__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: var(--color-accent);
  background: var(--color-grayLight);
}

.dcp-gate__icon svg {
  width: 22px;
  height: 22px;
}

.dcp-gate__title {
  margin: 0;
  font-size: 22px;
  color: var(--color-accent);
}

.dcp-gate__lede {
  margin: 0;
  font-size: 15px;
  color: var(--color-grayDark);
}

.dcp-gate__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.dcp-gate__alert {
  width: 100%;
  text-align: left;
}

.dcp-gate__field {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
}

.dcp-gate__input {
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  cursor: text;
  outline: none;
  min-width: 100px;
  font-family: inherit;
  padding: 17px 15px;
  border-radius: 6px;
  font-weight: 400;
  hyphens: auto;
  color: var(--color-dark);
  background: var(--color-light);
  border: solid 2px var(--color-grayLight);
  box-shadow: 0 0 0 0px var(--color-primaryLight);
  transition: all 0.3s ease;
  word-break: keep-all;
  white-space: nowrap;
  display: inline-flex;
  height: 50px;
  font-size: 16px;
  line-height: 1;
  width: 100%;
}

.dcp-gate__input::placeholder {
  color: var(--color-gray);
}

.dcp-gate__input:hover:not([disabled]) {
  border-color: var(--color-primary);
}

.dcp-gate__input:focus:not([disabled]) {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
  border-color: var(--color-primary);
}

.dcp-gate__input[aria-invalid="true"] {
  border-color: var(--color-error);
}

/* Two glyphs with a knob behind the current mode's. The knob follows the
   "dark" class on <html>, so it is right from the first paint. */
.dcp-gate__theme-toggle {
  box-sizing: border-box;
  appearance: none;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
  border: solid 1px var(--color-grayLight);
  box-shadow: 0 0 0 0px var(--color-primary);
  width: 56px;
  height: 30px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  position: relative;
  margin: auto 0;
  background: var(--color-light);
}

.dcp-gate__theme-toggle:hover {
  border-color: var(--color-primary);
}

.dcp-gate__theme-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-gate__theme-toggle::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primaryLight) 20%, transparent);
  transition: all 0.3s ease;
  z-index: 1;
}

:root.dark .dcp-gate__theme-toggle::after {
  transform: translateX(26px);
}

.dcp-gate__theme-toggle svg {
  width: 16px;
  height: 16px;
  object-fit: contain;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.dcp-gate__theme-toggle svg[stroke] {
  stroke: var(--color-primary);
}

.dcp-gate__theme-toggle:hover svg[stroke] {
  stroke: var(--color-accent);
}`,
};
