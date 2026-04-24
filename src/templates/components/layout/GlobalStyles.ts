export const globalStylesTemplate = `"use client";
import { createGlobalStyle } from "styled-components";
import {
  colorsLight,
  colorsDark,
  shadowsLight,
  shadowsDark,
} from "@/app/theme";

// Build "name: value;" lines for every entry in a record. Used to emit
// :root and :root.dark blocks from the resolved hex objects in theme.ts.
// Custom theme.json overrides flow through automatically because they are
// already merged into colorsLight / colorsDark.
function toCssVars<T extends object>(prefix: string, record: T): string {
  return Object.entries(record)
    .map(([k, v]) => \`  --\${prefix}-\${k}: \${v};\`)
    .join("\\n");
}

const lightVars = [
  toCssVars("color", colorsLight),
  toCssVars("shadow", shadowsLight),
  // Semantic tokens — derived from the brand palette per mode. See the
  // SemanticColors interface in theme.ts for the intent of each.
  // These reference the palette via var() (not baked hex) so that any
  // runtime override of --color-primary* (e.g. the DemoTheme presets)
  // cascades into the semantic tokens automatically.
  \`  --color-accent: var(--color-primaryDark);\`,
  // accentStrong = accent shifted ~10% toward black (light mode) or white (dark
  // mode). color-mix in sRGB is not identical to polished's HSL darken/lighten
  // but the visual difference at 10% on a UI accent is imperceptible.
  \`  --color-accentStrong: color-mix(in srgb, var(--color-primaryDark) 90%, black);\`,
  \`  --color-accentMuted: var(--color-primary);\`,
  \`  --color-surface: var(--color-light);\`,
].join("\\n");

const darkVars = [
  toCssVars("color", colorsDark),
  toCssVars("shadow", shadowsDark),
  \`  --color-accent: var(--color-primaryLight);\`,
  \`  --color-accentStrong: color-mix(in srgb, var(--color-primaryLight) 90%, white);\`,
  \`  --color-accentMuted: var(--color-grayDark);\`,
  \`  --color-surface: var(--color-dark);\`,
].join("\\n");

const GlobalStyles = createGlobalStyle\`
:root {
\${lightVars}
}

:root.dark {
\${darkVars}
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background-color: var(--color-light);
  scroll-padding-top: 80px;
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

* {
  box-sizing: border-box;
  min-width: 0;
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

ol,
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

figure {
  margin: 0;
}

fieldset {
  appearance: none;
  border: none;
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
}

.full-width {
  width: 100%;
}

/* Mode-conditional visibility helpers. ThemeToggle uses these to swap Sun
   and Moon icons; Header uses them to swap light/dark logos. Pure CSS so
   the swap happens via the active <html> class without JS or re-render. */
:root.dark .light-only {
  display: none !important;
}
:root:not(.dark) .dark-only {
  display: none !important;
}
\`;

export { GlobalStyles };
`;
