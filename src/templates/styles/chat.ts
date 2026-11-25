import type { DesignStyles } from "./index.js";
import { squareButtonRules } from "./controls.js";

// The chat: panel, transcript, composer and the classic header's launcher
// (components/chat). Both designs share the kit; the modern design restyles
// the panel's header and composer.
export const chatStyles: DesignStyles = {
  shared: `/* Chat: the panel, transcript, composer and the header launcher. Adapted
   from cherry-styled-components (MIT). */
@property --dcp-gradient-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@keyframes dcp-rotate-gradient {
  0% {
    --dcp-gradient-angle: 0deg;
  }
  100% {
    --dcp-gradient-angle: 360deg;
  }
}

@keyframes dcp-pulse-glow {
  0%,
  100% {
    opacity: 0.5;
    filter: blur(16px);
  }
  50% {
    opacity: 1;
    filter: blur(22px);
  }
}

@keyframes dcp-sparkle-float {
  0%,
  100% {
    opacity: 0;
    transform: translateY(0) scale(0);
  }
  50% {
    opacity: 0.9;
    transform: translateY(-20px) scale(1);
  }
}

@keyframes dcp-dot-fade {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes dcp-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* The panel: a drawer on the right from "lg" up, the full screen below.
   Visibility snaps on when it opens, so focus can land at once, and waits
   for the slide when it closes. */
.dcp-chat-panel {
  display: flex;
  flex-direction: column;
  background: var(--color-light);
  color: var(--color-dark);
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100dvh;
  z-index: 1000;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease,
    visibility 0s linear 0s;
  transform: translateX(0);
  opacity: 1;
  visibility: visible;
}

.dcp-chat-panel:not([data-open]) {
  transform: translateX(100%);
  opacity: 0;
  visibility: hidden;
  transition-delay: 0s, 0s, 0.3s;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-chat-panel {
    transition: none;
  }
}

@media screen and (min-width: 992px) {
  .dcp-chat-panel {
    width: var(--layout-chat-width);
    border-left: solid 1px var(--color-grayLight);
  }
}

.dcp-chat-panel__header {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  padding: 12px 20px;
  border-bottom: solid 1px var(--color-grayLight);
  flex-shrink: 0;
}

.dcp-chat-panel__title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-dark);
}

.dcp-chat-panel__title h3 {
  margin: 0;
  font-size: 16px;
  line-height: 1.2;
}

.dcp-chat-panel__title svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.dcp-chat-panel__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* A round icon-only button. */
.dcp-icon-button {
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
  position: relative;
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

.dcp-icon-button svg {
  width: 14px;
  height: 14px;
}

.dcp-icon-button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dcp-icon-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

/* The transcript. */
.dcp-chat-messages {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

.dcp-chat-message {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  width: 100%;
}

/* One step tighter than body text, so a transcript stays dense. */
.dcp-chat-message .dcp-chat-message__content {
  min-width: 0;
  font-size: 14px;
  line-height: 1.7;
}

.dcp-chat-message .dcp-chat-message__content p {
  font-size: 14px;
  line-height: 1.7;
}

.dcp-chat-message .dcp-chat-message__content ul li,
.dcp-chat-message .dcp-chat-message__content ol li {
  font-size: 14px;
  line-height: 1.7;
}

/* The question pill: right-aligned, filled with the primary color, flat
   corner pointing at the composer. Long unbroken strings wrap. */
.dcp-chat-message[data-role="user"] {
  flex-direction: row-reverse;
}

.dcp-chat-message[data-role="user"] .dcp-chat-message__content {
  background: var(--color-primary);
  color: var(--color-onFilled);
  padding: 9px 14px;
  border-radius: 16px 16px 4px 16px;
  margin-left: auto;
  width: fit-content;
  max-width: min(560px, 88%);
  font-weight: 500;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* The reply reads as a document, not a bubble. */
.dcp-chat-message[data-role="assistant"] .dcp-chat-message__content {
  color: var(--color-dark);
  width: 100%;
}

/* Markdown in a reply. */
.dcp-chat-prose {
  color: var(--color-dark);
  font-size: 14px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-chat-prose > *:first-child {
  margin-top: 0;
}

.dcp-chat-prose > *:last-child {
  margin-bottom: 0;
}

.dcp-chat-prose > *:last-child > *:last-child {
  margin-bottom: 0;
}

.dcp-chat-prose p {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose p {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-chat-prose h1,
.dcp-chat-prose h2,
.dcp-chat-prose h3,
.dcp-chat-prose h4,
.dcp-chat-prose h5,
.dcp-chat-prose h6 {
  margin: 10px 0;
  padding: 0;
  color: var(--color-dark);
}

.dcp-chat-prose h1 {
  font-size: 28px;
  line-height: 1.3;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose h1 {
    font-size: 30px;
    line-height: 1.5;
  }
}

.dcp-chat-prose h2 {
  font-size: 24px;
  line-height: 1.3;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose h2 {
    font-size: 26px;
    line-height: 1.5;
  }
}

.dcp-chat-prose h3 {
  font-size: 18px;
  line-height: 1.6;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose h3 {
    font-size: 20px;
    line-height: 1.5;
  }
}

.dcp-chat-prose h4 {
  font-size: 16px;
  line-height: 1.6;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose h4 {
    font-size: 18px;
    line-height: 1.6;
  }
}

.dcp-chat-prose h5 {
  font-size: 16px;
  line-height: 1.6;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose h5 {
    font-size: 18px;
    line-height: 1.6;
  }
}

.dcp-chat-prose h6 {
  font-size: 16px;
  line-height: 1.6;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose h6 {
    font-size: 18px;
    line-height: 1.6;
  }
}

/* Underline drawn with box-shadow, clear of descenders. Anchors with their
   own class, or wrapping an image, are left alone. */
.dcp-chat-prose a:not([class]):not(:has(img)) {
  color: inherit;
  transition: all 0.3s ease;
  text-decoration: none;
  box-shadow: 0 2px 0 0 var(--color-primary);
}

.dcp-chat-prose a:not([class]):not(:has(img)):hover {
  color: var(--color-accent);
  box-shadow: 0 1px 0 0 var(--color-primary);
}

.dcp-chat-prose a:not([class]):not(:has(img)):focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow:
    0 2px 0 0 var(--color-primary),
    0 0 0 2px var(--color-primaryLight);
}

.dcp-chat-prose ul,
.dcp-chat-prose ol {
  margin: 0 0 10px;
  padding: 0;
}

.dcp-chat-prose ul li > .code-wrapper,
.dcp-chat-prose ol li > .code-wrapper {
  margin: 10px 0;
}

.dcp-chat-prose ul li p,
.dcp-chat-prose ol li p {
  display: inline;
}

.dcp-chat-prose ul {
  list-style: none;
}

.dcp-chat-prose ul li {
  text-indent: 0;
  display: block;
  position: relative;
  padding: 0 0 0 24px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose ul li {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-chat-prose ul li::before {
  content: "";
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  position: absolute;
  top: 0.65em;
  left: 9px;
}

.dcp-chat-prose ol {
  counter-reset: item;
}

.dcp-chat-prose ol > li {
  counter-increment: item;
  padding: 0 0 0 24px;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose ol > li {
    font-size: 16px;
    line-height: 1.7;
  }
}

.dcp-chat-prose ol > li::before {
  content: counter(item) ".";
  display: inline-block;
  min-width: 20px;
  margin-left: -24px;
  margin-right: 4px;
  text-align: right;
  font-weight: 700;
  color: var(--color-primary);
}

/* Inline code only: fenced blocks arrive with a highlighter class. */
.dcp-chat-prose code:not([class]) {
  background: color-mix(in srgb, var(--color-primaryLight) 20%, transparent);
  color: var(--color-dark);
  padding: 2px 4px;
  border-radius: 6px;
  font-family: "Roboto Mono", monospace;
  white-space: pre;
}

.dcp-chat-prose pre,
.dcp-chat-prose .hljs {
  margin: 10px 0;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

.dcp-chat-prose .code-wrapper {
  margin: 10px 0;
}

.dcp-chat-prose .code-wrapper pre {
  margin: 0;
}

.dcp-chat-prose blockquote {
  margin: 10px 0;
  padding: 0 0 0 16px;
  border-left: solid 2px var(--color-grayLight);
  color: var(--color-grayDark);
}

.dcp-chat-prose hr {
  margin: 10px 0;
  border: none;
  border-bottom: solid 1px var(--color-grayLight);
}

.dcp-chat-prose .table-wrapper {
  overflow-x: auto;
  width: 100%;
  margin: 0 0 10px;
  scrollbar-width: thin;
  scrollbar-color: var(--color-grayLight) transparent;
}

.dcp-chat-prose table {
  margin: 0;
  padding: 0;
  border-collapse: collapse;
  width: 100%;
  text-align: left;
}

.dcp-chat-prose table tr {
  margin: 0;
  padding: 0;
}

.dcp-chat-prose table th {
  border-bottom: solid 1px var(--color-grayLight);
  padding: 10px 10px 10px 0;
  font-size: 12px;
  line-height: 1.7;
  font-weight: 600;
  color: var(--color-dark);
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose table th {
    font-size: 14px;
    line-height: 1.7;
  }
}

.dcp-chat-prose table td {
  border-bottom: solid 1px var(--color-grayLight);
  padding: 10px 10px 10px 0;
  color: var(--color-grayDark);
  font-size: 12px;
  line-height: 1.7;
}

@media screen and (min-width: 992px) {
  .dcp-chat-prose table td {
    font-size: 14px;
    line-height: 1.7;
  }
}

.dcp-chat-prose img,
.dcp-chat-prose video,
.dcp-chat-prose iframe {
  max-width: 100%;
  border-radius: 12px;
  margin: 10px 0;
  display: block;
}

/* Source links under a reply. */
.dcp-chat-sources {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.dcp-chat-sources:not(:first-child) {
  margin-top: 10px;
}

.dcp-chat-source {
  position: relative;
  text-decoration: none;
  font-size: 14px;
  line-height: 1;
  color: var(--color-primary);
  display: flex;
  align-items: center;
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

.dcp-chat-source:hover {
  border-color: var(--color-primary);
}

.dcp-chat-source:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-chat-source svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.dcp-chat-source:hover {
  color: var(--color-accent);
}

/* The "Answering..." status. */
.dcp-chat-typing {
  width: 100%;
  font-weight: 600;
  color: var(--color-dark);
  font-size: 14px;
  line-height: 1.7;
}

.dcp-chat-typing__dot {
  animation: dcp-dot-fade 1s ease infinite;
}

.dcp-chat-typing__dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dcp-chat-typing__dot:nth-child(3) {
  animation-delay: 0.4s;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-chat-typing__dot {
    animation: none;
  }
}

/* The rainbow glow's colors, shared by the composer and the launcher. Kept
   as variables so the color-mix() fades below stay as written: the CSS
   build would otherwise fold them into legacy hex colors, which a gradient
   interpolates differently. */
.dcp-chat-input,
.dcp-chat-launcher {
  --dcp-glow-1: #cc5555;
  --dcp-glow-2: #d9a745;
  --dcp-glow-3: #3ab0cc;
  --dcp-glow-4: #cc7fc2;
  --dcp-glow-5: #4380cc;
  --dcp-glow-6: #4c1fa3;
}

/* The composer. */
.dcp-chat-composer {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: flex-end;
  background: var(--color-light);
  padding: 20px;
  width: 100%;
  flex-shrink: 0;
  border-top: solid 1px var(--color-grayLight);
}

/* The input's glow layers sit on negative z-index; the wrapper's stacking
   context keeps them above the composer's background. */
.dcp-chat-input {
  position: relative;
  flex: 1;
  min-width: 0;
  isolation: isolate;
}

/* The rainbow border: exactly under the textarea, showing through its
   border strip once a state turns that border transparent. */
.dcp-chat-input::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 6px;
  background: conic-gradient(
    from var(--dcp-gradient-angle),
    var(--dcp-glow-1),
    var(--dcp-glow-2),
    var(--dcp-glow-3),
    var(--dcp-glow-4),
    var(--dcp-glow-5),
    var(--dcp-glow-6),
    var(--dcp-glow-1)
  );
  opacity: 0;
  transition: all 0.3s ease;
  animation: dcp-rotate-gradient 3s linear infinite;
  z-index: 0;
}

/* The focus ring: a softened rainbow band growing out to 4px on focus and
   held at 2px while pressed. */
.dcp-chat-input::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 6px;
  background: conic-gradient(
    from var(--dcp-gradient-angle),
    color-mix(in srgb, var(--dcp-glow-1) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-2) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-3) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-4) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-5) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-6) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-1) 40%, transparent)
  );
  opacity: 0;
  transition: all 0.3s ease;
  animation: dcp-rotate-gradient 3s linear infinite;
  z-index: -1;
  pointer-events: none;
}

.dcp-chat-input:hover::before,
.dcp-chat-input:focus-within::before {
  opacity: 1;
}

.dcp-chat-input:focus-within::after {
  opacity: 1;
  inset: -4px;
  border-radius: 10px;
}

.dcp-chat-input:active::after {
  inset: -2px;
  border-radius: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-chat-input::before,
  .dcp-chat-input::after {
    animation: none;
  }
}

/* The radiating background glow: always soft, stronger on hover and focus.
   The animation lives on the inner layer because the pulse animates
   opacity, which would override this layer's own. */
.dcp-chat-input__radiant {
  position: absolute;
  inset: -10px;
  border-radius: 20px;
  pointer-events: none;
  z-index: -2;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.dcp-chat-input__radiant::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: conic-gradient(
    from var(--dcp-gradient-angle),
    color-mix(in srgb, var(--dcp-glow-1) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-2) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-3) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-4) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-5) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-6) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-1) 40%, transparent)
  );
  animation:
    dcp-rotate-gradient 3s linear infinite,
    dcp-pulse-glow 2s ease-in-out infinite;
}

.dcp-chat-input[data-active] .dcp-chat-input__radiant {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-chat-input__radiant::before {
    animation: none;
  }
}

.dcp-chat-input__sparkles {
  position: absolute;
  inset: -30px;
  pointer-events: none;
  overflow: hidden;
  border-radius: 30px;
  z-index: -3;
  opacity: 0;
  transition: all 0.3s ease;
}

.dcp-chat-input[data-active] .dcp-chat-input__sparkles {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-chat-input__sparkles {
    display: none;
  }
}

.dcp-chat-input__sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--dcp-sparkle-color);
  box-shadow: 0 0 6px var(--dcp-sparkle-color);
  left: var(--dcp-sparkle-left);
  top: var(--dcp-sparkle-top);
  animation: dcp-sparkle-float 2s ease-in-out infinite;
  animation-delay: var(--dcp-sparkle-delay);
}

/* The transition is scoped (not "all"): the panel animates visibility, and
   a transition on "all" would catch that flip and leave the textarea
   unfocusable for the frame the panel hands it focus. */
.dcp-chat-input__textarea {
  position: relative;
  z-index: 1;
  display: block;
  box-sizing: border-box;
  width: 100%;
  resize: none;
  font-family: inherit;
  line-height: 1.5;
  color: var(--color-dark);
  background: var(--color-light);
  outline: none;
  max-height: 160px;
  overflow-y: auto;
  border: solid 2px var(--color-grayLight);
  border-radius: 6px;
  padding: 11px 15px;
  font-size: 16px;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    background 0.3s ease;
  background-clip: padding-box;
}

.dcp-chat-input__textarea::placeholder {
  color: var(--color-gray);
}

.dcp-chat-input__textarea:disabled {
  cursor: not-allowed;
  background: var(--color-grayLight);
  border-color: var(--color-gray);
  color: var(--color-gray);
}

.dcp-chat-input__textarea:hover:not([disabled]),
.dcp-chat-input__textarea:focus:not([disabled]) {
  border-color: transparent;
}

/* The send button: a filled primary circle-ish pill, its icon centered. */
.dcp-chat-send {
  box-sizing: border-box;
  appearance: none;
  border: none;
  background: none;
  margin: 0;
  cursor: pointer;
  outline: none;
  font-family: inherit;
  display: inline-flex;
  padding: 15px 30px;
  border-radius: 100px;
  font-weight: 600;
  white-space: nowrap;
  hyphens: auto;
  color: var(--color-onFilled);
  text-decoration: none;
  transition: all 0.3s ease;
  text-align: center;
  gap: 10px;
  text-overflow: ellipsis;
  justify-content: center;
  align-items: center;
  height: 50px;
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  min-height: 0;
  position: relative;
}

.dcp-chat-send:not(:disabled) {
  color: var(--color-onFilled);
  background: var(--color-primary);
  border: solid 2px var(--color-primary);
  box-shadow: 0 0 0 0px var(--color-primary);
}

.dcp-chat-send:not(:disabled):hover {
  background: var(--color-primaryDark);
  border-color: var(--color-primaryDark);
}

.dcp-chat-send:not(:disabled):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-chat-send:disabled {
  cursor: not-allowed;
  background: var(--color-grayLight);
  border: solid 2px var(--color-grayLight);
  color: var(--color-gray);
}

.dcp-chat-send svg {
  transition: none;
  position: absolute;
  inset: 0;
  margin: auto;
}

.dcp-chat-send__spinner {
  color: var(--color-dark);
  animation: dcp-spin 1s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-chat-send__spinner {
    animation: none;
  }
}

/* The header's "Ask AI" launcher. Its own border stays solid 1px grayLight;
   the rainbow bands hug its outside: 1px on hover (::before), 2px while
   pressed (::after) and on keyboard focus (ring), as thin as the other
   controls' focus rings. They share one gradient and only cross-fade
   opacity, so the band reads as growing without repainting. */
.dcp-chat-launcher {
  transition: all 0.3s ease;
  box-shadow: 0 0 0 0px var(--color-primary);
  appearance: none;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
  height: 30px;
  background: var(--color-light);
  border: solid 1px var(--color-grayLight);
  color: var(--color-accent);
  border-radius: 6px;
  padding: 0;
  font-size: 12px;
  font-family: inherit;
  font-weight: 600;
  position: relative;
  isolation: isolate;
}

.dcp-chat-launcher .dcp-chat-launcher__inner {
  padding: 0 8px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-light);
  border-radius: 6px;
}

.dcp-chat-launcher svg {
  width: 16px;
  height: 16px;
  color: inherit;
}

.dcp-chat-launcher::before,
.dcp-chat-launcher::after,
.dcp-chat-launcher .dcp-chat-launcher__ring {
  content: "";
  position: absolute;
  background: conic-gradient(
    from var(--dcp-gradient-angle),
    var(--dcp-glow-1),
    var(--dcp-glow-2),
    var(--dcp-glow-3),
    var(--dcp-glow-4),
    var(--dcp-glow-5),
    var(--dcp-glow-6),
    var(--dcp-glow-1)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  animation: dcp-rotate-gradient 3s linear infinite;
  z-index: -1;
  pointer-events: none;
}

.dcp-chat-launcher::before {
  inset: -1px;
  border-radius: 7px;
}

.dcp-chat-launcher::after {
  inset: -2px;
  border-radius: 8px;
}

.dcp-chat-launcher .dcp-chat-launcher__ring {
  inset: -2px;
  border-radius: 8px;
}

/* The radiating glow: always softly on, stronger with interaction or while
   the panel is open. */
.dcp-chat-launcher .dcp-chat-launcher__glow {
  position: absolute;
  inset: -8px;
  border-radius: 14px;
  pointer-events: none;
  z-index: -3;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.dcp-chat-launcher .dcp-chat-launcher__glow::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: conic-gradient(
    from var(--dcp-gradient-angle),
    color-mix(in srgb, var(--dcp-glow-1) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-2) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-3) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-4) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-5) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-6) 40%, transparent),
    color-mix(in srgb, var(--dcp-glow-1) 40%, transparent)
  );
  animation:
    dcp-rotate-gradient 3s linear infinite,
    dcp-pulse-glow 2s ease-in-out infinite;
}

.dcp-chat-launcher:hover,
.dcp-chat-launcher:focus,
.dcp-chat-launcher:active {
  border-color: var(--color-grayLight);
  box-shadow: none;
}

.dcp-chat-launcher:hover::before,
.dcp-chat-launcher:focus::before,
.dcp-chat-launcher:active::before {
  opacity: 1;
}

.dcp-chat-launcher:active::after {
  opacity: 1;
}

.dcp-chat-launcher:focus-visible .dcp-chat-launcher__ring {
  opacity: 1;
}

.dcp-chat-launcher:hover .dcp-chat-launcher__glow,
.dcp-chat-launcher:focus .dcp-chat-launcher__glow,
.dcp-chat-launcher:active .dcp-chat-launcher__glow {
  opacity: 1;
}

.dcp-chat-launcher[aria-expanded="true"]::before,
.dcp-chat-launcher[aria-expanded="true"] .dcp-chat-launcher__glow {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .dcp-chat-launcher::before,
  .dcp-chat-launcher::after,
  .dcp-chat-launcher .dcp-chat-launcher__ring,
  .dcp-chat-launcher .dcp-chat-launcher__glow::before {
    animation: none;
  }
}`,
  classic: `/* The panel's header controls match the modern design's: 32px ghost
   squares, 4px apart. */
.dcp-chat-panel__actions {
  gap: 4px;
}

${squareButtonRules(".dcp-chat-panel__actions button")}`,
  modern: `/* The chat fitted to the modern chrome: a layout-free shell (display:
   contents) around the panel, a header bar matching the site header's
   height and hairline, ghost-square header controls, and a composer with the
   header's pill geometry. The composer glow stays. */
.dcp-chat-shell {
  display: contents;
}

.dcp-chat-panel__header {
  min-height: calc(var(--layout-header-height) + 1px);
  padding: 0 12px 0 20px;
  border-bottom-color: var(--color-grayLight);
}

.dcp-chat-panel__title {
  gap: 8px;
}

.dcp-chat-panel__title h3 {
  font-size: 14px;
  line-height: 20px;
  font-weight: 600;
}

.dcp-chat-panel__title svg {
  width: 16px;
  height: 16px;
  color: var(--color-grayDark);
}

.dcp-chat-panel__actions {
  gap: 4px;
}

/* The header controls: the shared 32px ghost square. */
${squareButtonRules(".dcp-chat-panel__actions button")}

/* The panel opens under a still cursor (the header's Ask AI pill sits where
   these buttons land), which would show one of them hovered before the
   reader touches anything. Their hover waits for a real pointer move. */
.dcp-chat-shell[data-pointer-moved="false"]
  .dcp-chat-panel__actions
  button:hover {
  color: var(--color-grayDark);
  background: transparent;
}

.dcp-chat-composer {
  gap: 8px;
  align-items: flex-end;
  padding: 12px 16px 16px;
  border-top-color: var(--color-grayLight);
}

/* The input and its glow layers: a pill at one row (24px line + 14px
   padding + 2px border = 40px), softening to a rounded box as it grows. */
.dcp-chat-input::before,
.dcp-chat-input::after,
.dcp-chat-input__textarea {
  border-radius: 20px;
}

.dcp-chat-input:focus-within::after {
  border-radius: 24px;
}

.dcp-chat-input:active::after {
  border-radius: 22px;
}

.dcp-chat-input__radiant {
  border-radius: 30px;
}

.dcp-chat-input__textarea {
  border-width: 1px;
  padding: 7px 16px;
  font-size: 14px;
  line-height: 24px;
}

.dcp-chat-send {
  width: 40px;
  height: 40px;
  min-width: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--color-dark);
  color: var(--color-light);
  box-shadow: none;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.dcp-chat-send svg {
  width: 18px;
  height: 18px;
  color: inherit;
}

.dcp-chat-send:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-dark) 82%, var(--color-light));
}

.dcp-chat-send:focus,
.dcp-chat-send:active {
  box-shadow: none;
}

.dcp-chat-send:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primaryLight);
}

.dcp-chat-send:disabled {
  background: color-mix(in srgb, var(--color-dark) 8%, transparent);
  color: var(--color-gray);
}`,
};
