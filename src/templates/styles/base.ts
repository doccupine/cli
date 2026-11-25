// The base layer: element defaults for the whole site.
export const baseCss = `html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background-color: var(--color-light);
  scroll-padding-top: var(--layout-scroll-padding-top);
}

html:has(:target) {
  scroll-behavior: smooth;
}

body {
  font-family: "Inter", sans-serif;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
}

:root {
  interpolate-size: allow-keywords;
}

/* Stops transitions for the frame that paints a light/dark switch, so the
   page changes at once instead of control by control. */
.theme-switching,
.theme-switching *,
.theme-switching *::before,
.theme-switching *::after {
  transition: none !important;
}

hr {
  border: none;
  border-bottom: solid 1px var(--color-grayLight);
  margin: 10px 0;
}

pre,
code,
kbd,
samp {
  font-family: monospace, monospace;
}

pre,
code,
kbd,
samp,
blockquote,
p,
a,
h1,
h2,
h3,
h4,
h5,
h6,
ul li,
ol li {
  margin: 0;
  padding: 0;
  color: var(--color-dark);
}

a {
  color: var(--color-primary);
}

button,
input,
a,
img,
svg,
svg * {
  transition: all 0.3s ease;
}

strong,
b {
  font-weight: 700;
}`;
