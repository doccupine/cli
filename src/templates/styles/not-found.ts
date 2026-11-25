import type { DesignStyles } from "./index.js";

// The 404 page (components/layout/NotFound.tsx): a full-page canvas with a
// faint dot grid and a soft glow in the accent color, both faded out toward
// the edges. Every color is a token, so it follows the mode and the palette.
//
//   .dcp-not-found            the page (<main>)
//   .dcp-not-found__logo      the logo link at the top
//   .dcp-not-found__content   the centered message
//   .dcp-not-found__code      the big "404", fading into the page
//   .dcp-not-found__title     the heading
//   .dcp-not-found__text      the explanation
//   .dcp-not-found__actions   the buttons
export const notFoundStyles: DesignStyles = {
  shared: `.dcp-not-found {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  overflow: hidden;
  isolation: isolate;
  background: var(--color-light);
}

.dcp-not-found::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: radial-gradient(
    color-mix(in srgb, var(--color-dark) 14%, transparent) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
  mask-image: radial-gradient(ellipse at center, black 10%, transparent 70%);
}

.dcp-not-found::after {
  content: "";
  position: absolute;
  top: -20%;
  left: 50%;
  z-index: -1;
  width: min(720px, 120vw);
  aspect-ratio: 1;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-accent) 14%, transparent) 0%,
    transparent 65%
  );
}

.dcp-not-found__logo {
  display: inline-flex;
  align-items: center;
  height: 32px;
  margin-bottom: auto;
}

.dcp-not-found__logo img,
.dcp-not-found__logo svg {
  height: 28px;
  width: auto;
}

.dcp-not-found__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 480px;
  padding: 48px 0;
  margin-bottom: auto;
  text-align: center;
}

.dcp-not-found__code {
  margin: 0 0 4px;
  font-size: 96px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: -0.05em;
  color: transparent;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--color-dark) 22%, transparent) 20%,
    color-mix(in srgb, var(--color-dark) 4%, transparent) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  user-select: none;
}

@media screen and (min-width: 992px) {
  .dcp-not-found__code {
    font-size: 144px;
  }
}

.dcp-not-found__title {
  margin: 0;
  font-size: 30px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-dark);
}

@media screen and (min-width: 992px) {
  .dcp-not-found__title {
    font-size: 36px;
  }
}

.dcp-not-found__text {
  margin: 0;
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-grayDark);
}

@media screen and (min-width: 992px) {
  .dcp-not-found__text {
    font-size: 18px;
  }
}

.dcp-not-found__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}`,
};
