import type { DesignStyles } from "./index.js";
import { squareButtonRules } from "./controls.js";

// The API playground (components/layout/ApiPlayground.tsx): the compact
// endpoint bar in the article and the request dialog it opens.
//
//   .dcp-playground                the endpoint bar
//   .dcp-playground__method        the method badge (a Badge), bar metrics
//   .dcp-playground__path          the endpoint path, scrolls sideways
//   .dcp-playground__param         a {path} parameter inside it
//   .dcp-playground__send          the filled "Try it" / "Send" button
//   .dcp-playground-modal          the native <dialog>: full-screen tinted
//                                  layer; data-closing while it animates out
//   .dcp-playground-modal__inner   the card (__close, __title, __content)
//   .dcp-playground__header        the dialog's path bar row (__path-bar)
//   .dcp-playground__body          the two-column grid (__column)
//   .dcp-playground__description, __toolbar, __meta
//   .dcp-playground__toggle        a mode / secrets switch; data-active
//   .dcp-playground__section       an accordion section's inset content
//   .dcp-playground__field         a parameter: __field-head, __field-name,
//                                  __type, __required, __field-desc
//   .dcp-playground__response      the response area; __loading covers it
//                                  while a request runs, __placeholder
//                                  before the first one
//   .dcp-playground__card          the response card: __card-head,
//                                  __inline, __status (data-ok),
//                                  __card-body, __media
//   .dcp-input-wrap, .dcp-input-box, .dcp-input, .dcp-textarea
//                                  the form controls (adapted from
//                                  cherry-styled-components, MIT)
//
// Both designs share these rules. They sit in the design layer, after the
// article prose (docs.ts), so they keep competing with it by specificity as
// they did when they were styled components.
const rules = `.dcp-playground {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 8px 8px 8px 12px;
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  background: var(--color-light);
}

.dcp-playground__method {
  flex-shrink: 0;
  padding: 0 4px;
  border: none;
}

.dcp-playground__path {
  flex: 1;
  min-width: 0;
  font-family: "Roboto Mono", monospace;
  font-weight: 600;
  font-size: 14px;
  color: var(--color-dark);
  overflow-x: auto;
  white-space: nowrap;
}

.dcp-playground__path::-webkit-scrollbar {
  display: none;
}

.dcp-playground__param {
  font-family: "Roboto Mono", monospace;
  background: color-mix(in srgb, var(--color-primaryLight) 20%, transparent);
  color: var(--color-dark);
  padding: 2px 4px;
  border-radius: 6px;
  overflow-wrap: anywhere;
}

/* The filled accent button, with the interactive border and ring. */
.dcp-playground__send {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  font-family: Inter;
  font-weight: 600;
  font-size: 14px;
  color: var(--color-on-primary);
  background: var(--color-primary-fill);
  padding: 8px 14px;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: solid 1px transparent;
  box-shadow: 0 0 0 0px var(--color-primary);
}

.dcp-playground__send:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-fill-hover);
  color: var(--color-on-primary-hover);
}

.dcp-playground__send:hover svg {
  color: var(--color-on-primary-hover);
  stroke: var(--color-on-primary-hover);
}

.dcp-playground__send:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-playground__send svg {
  color: var(--color-on-primary);
  stroke: var(--color-on-primary);
}

.dcp-playground__send:disabled {
  opacity: 0.6;
  cursor: default;
}

/* The request dialog. The <dialog> is the tinted full-screen layer (its own
   ::backdrop stays clear) and centers the card. It mounts on open and
   unmounts when its exit animation ends. */
.dcp-playground-modal {
  position: fixed;
  inset: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: none;
  overflow: visible;
  color: inherit;
  background: color-mix(in srgb, var(--color-primary) 50%, transparent);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1010;
  animation: dcp-playground-fade-in 0.3s ease both;
  transition: background-color 0.3s ease;
}

.dcp-playground-modal:not([open]) {
  display: none;
}

.dcp-playground-modal::backdrop {
  background: transparent;
}

.dcp-playground-modal[data-closing] {
  animation-name: dcp-playground-fade-out;
  pointer-events: none;
}

.dcp-playground-modal__inner {
  background: var(--color-light);
  border-radius: 12px;
  padding: 20px;
  max-width: calc(100% - 40px);
  width: 100%;
  margin: auto;
  position: relative;
  outline: none;
  animation: dcp-playground-rise-in 0.3s ease both;
}

.dcp-playground-modal[data-closing] .dcp-playground-modal__inner {
  animation-name: dcp-playground-sink-out;
}

@media screen and (min-width: 992px) {
  .dcp-playground-modal__inner {
    max-width: 1120px;
  }
}

.dcp-playground-modal__close {
  box-sizing: border-box;
  appearance: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  width: 28px;
  height: 28px;
  min-width: 28px;
  max-width: 28px;
  min-height: 28px;
  max-height: 28px;
  border-radius: 50%;
  background: var(--color-light);
  border: solid 2px var(--color-grayLight);
  color: var(--color-grayDark);
  box-shadow: 0 0 0 0px var(--color-primaryLight);
  transition: all 0.3s ease;
}

.dcp-playground-modal__close svg {
  width: 14px;
  height: 14px;
}

.dcp-playground-modal__close:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dcp-playground-modal__close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-playground-modal__title {
  margin: 0 0 15px 0;
  padding: 0 0 15px 0;
  color: var(--color-dark);
  position: relative;
  font-size: 18px;
  line-height: 1.6;
}

.dcp-playground-modal__title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--color-grayLight);
}

/* The 5px padding keeps controls' focus rings (and the scrollbar) inside the
   scroll box's clip; the -5px margin gives that gutter back. */
.dcp-playground-modal__content {
  max-height: calc(100svh - 200px);
  overflow-y: auto;
  padding: 5px;
  margin: -5px;
  font-size: 14px;
  line-height: 1.7;
}

.dcp-playground-modal__content hr {
  margin: 20px 0;
  border: none;
  border-bottom: solid 1px var(--color-grayLight);
}

@media screen and (min-width: 992px) {
  .dcp-playground-modal__title {
    font-size: 20px;
    line-height: 1.5;
  }

  .dcp-playground-modal__content {
    font-size: 16px;
    line-height: 1.7;
  }
}

@keyframes dcp-playground-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes dcp-playground-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes dcp-playground-rise-in {
  from {
    transform: translateY(40px);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes dcp-playground-sink-out {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(40px);
  }
}

/* The dialog's contents. */
.dcp-playground__header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 5px 0 0 0;
}

.dcp-playground__path-bar {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px 8px 12px;
  border: solid 1px var(--color-grayLight);
  border-radius: 6px;
  background: var(--color-light);
}

.dcp-playground__body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 0;
  margin: 20px 0 0 0;
}

.dcp-playground__column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.dcp-playground__description {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-grayDark);
}

.dcp-playground__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dcp-playground__toggle {
  position: relative;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
  line-height: 1;
  color: var(--color-accent);
  display: flex;
  gap: 6px;
  font-weight: 600;
  white-space: nowrap;
  min-width: fit-content;
  background: color-mix(in srgb, var(--color-primaryLight) 10%, transparent);
  padding: 6px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: solid 1px transparent;
  box-shadow: 0 0 0 0px var(--color-primary);
}

.dcp-playground__toggle:hover {
  border-color: var(--color-primary);
}

.dcp-playground__toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-playground__toggle[data-active] {
  background: var(--color-primary-fill);
  color: var(--color-on-primary);
}

.dcp-playground__card {
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  overflow: hidden;
}

.dcp-playground__card-head {
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: var(--color-dark);
  font-size: 12px;
  line-height: 1.7;
}

.dcp-playground__inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dcp-playground__card-body {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Insets an accordion section's content, so full-width inputs' focus rings
   are not clipped by the accordion's overflow. */
.dcp-playground__section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
}

.dcp-playground__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dcp-playground__field-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  line-height: 1.7;
}

.dcp-playground__field-name {
  font-family: "Roboto Mono", monospace;
  font-weight: 600;
  color: var(--color-dark);
}

.dcp-playground__type {
  font-family: "Roboto Mono", monospace;
  color: var(--color-grayDark);
  background: color-mix(in srgb, var(--color-gray) 15%, transparent);
  padding: 0 4px;
  border-radius: 6px;
}

.dcp-playground__required {
  font-family: "Roboto Mono", monospace;
  color: var(--color-error);
}

.dcp-playground__field-desc {
  margin: 0;
  width: 100%;
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-text-muted);
}

.dcp-playground__status {
  font-family: "Roboto Mono", monospace;
  font-weight: 700;
  color: var(--color-on-error);
  background: var(--color-error-fill);
  padding: 0 4px;
  border-radius: 6px;
}

.dcp-playground__status[data-ok] {
  color: var(--color-on-success);
  background: var(--color-success-fill);
}

.dcp-playground__meta {
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-text-muted);
}

.dcp-playground__placeholder {
  border: dashed 1px var(--color-grayLight);
  border-radius: 12px;
  padding: 24px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-text-muted);
}

/* Holds the response (or the placeholder) and lets the loading layer sit on
   top of it, so a re-send keeps the previous content in place. */
.dcp-playground__response {
  position: relative;
}

/* The prefixed backdrop-filter first: the CSS minifier keeps only the last
   of the pair. */
.dcp-playground__loading {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: solid 1px var(--color-grayLight);
  border-radius: 12px;
  color: var(--color-grayDark);
  background: color-mix(in srgb, var(--color-light) 60%, transparent);
  -webkit-backdrop-filter: blur(1px);
  backdrop-filter: blur(1px);
}

.dcp-playground__media {
  max-width: 100%;
  border-radius: 6px;
}

@media screen and (min-width: 992px) {
  .dcp-playground__body {
    grid-template-columns: 1fr 1fr;
  }

  .dcp-playground__description,
  .dcp-playground__card-head,
  .dcp-playground__field-head,
  .dcp-playground__field-desc,
  .dcp-playground__meta,
  .dcp-playground__placeholder {
    font-size: 14px;
    line-height: 1.7;
  }
}

/* Form controls, adapted from cherry-styled-components (MIT). */
.dcp-input-wrap {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
}

.dcp-input-box {
  position: relative;
  width: 100%;
}

.dcp-input,
.dcp-textarea {
  box-sizing: border-box;
  appearance: none;
  margin: 0;
  outline: none;
  cursor: text;
  min-width: 100px;
  font-family: inherit;
  border-radius: 6px;
  font-weight: 400;
  color: var(--color-dark);
  background: var(--color-light);
  border: solid 2px var(--color-grayLight);
  box-shadow: 0 0 0 0px var(--color-primaryLight);
  transition: all 0.3s ease;
  width: 100%;
}

.dcp-input {
  padding: 17px 15px;
  hyphens: auto;
  word-break: keep-all;
  white-space: nowrap;
  display: inline-flex;
  height: 50px;
  font-size: 16px;
  line-height: 1;
}

.dcp-textarea {
  display: inline-block;
  padding: 15px;
  white-space: break-spaces;
  hyphens: none;
  min-height: 80px;
  font-size: 16px;
  line-height: 1.7;
}

.dcp-input::placeholder,
.dcp-textarea::placeholder {
  color: var(--color-text-muted);
}

.dcp-input:hover:not([disabled]),
.dcp-textarea:hover:not([disabled]) {
  border-color: var(--color-primary);
}

.dcp-input:focus:not([disabled]),
.dcp-textarea:focus:not([disabled]) {
  box-shadow: 0 0 0 2px var(--color-primaryLight);
  border-color: var(--color-primary);
}`;

// The dialog's close button is the shared 32px ghost square (like the chat
// panel's header actions and the search window's close), in both designs.
// Same center as the old 28px circle (2px further out on each side).
const closeButton = `.dcp-playground-modal__close {
  top: 18px;
  right: 18px;
}

${squareButtonRules(".dcp-playground-modal__close")}`;

export const apiPlaygroundStyles: DesignStyles = {
  classic: `${rules}

${closeButton}`,
  modern: `${rules}

${closeButton}`,
};
