export const globalStylesTemplate = `"use client";
import { createGlobalStyle } from "styled-components";
import { theme } from "@/app/theme";
import { SCROLL_PADDING_TOP } from "@/components/layout/designTokens";

// The theme's colors and shadows are CSS variables Cherry's provider declares,
// light on :root and dark on :root.dark (--cherry-color-primary, ...). The
// shorter --color-* and --shadow-* names are kept as aliases for CSS written
// against them, including the diagram variables the Mermaid docs describe.
function aliases(prefix: string, record: object): string {
  return Object.keys(record)
    .map((key) => \`  --\${prefix}-\${key}: var(--cherry-\${prefix}-\${key});\`)
    .join("\\n");
}

const aliasVars = [
  aliases("color", theme.colors),
  aliases("shadow", theme.shadows),
].join("\\n");

const diagramVars = [
  \`  --mermaid-bg: var(--cherry-color-light);\`,
  \`  --mermaid-fg: var(--cherry-color-dark);\`,
  \`  --mermaid-line: var(--cherry-color-grayDark);\`,
  \`  --mermaid-accent: var(--cherry-color-accent);\`,
  \`  --mermaid-muted: var(--cherry-color-grayDark);\`,
  \`  --mermaid-surface: var(--cherry-color-grayLight);\`,
  \`  --mermaid-border: var(--cherry-color-gray);\`,
].join("\\n");

const GlobalStyles = createGlobalStyle\`
:root {
  color-scheme: light;
\${aliasVars}
\${diagramVars}
}

/* The blocking theme-init script in the root layout sets the dark class before
   the first paint, so a statically rendered page arrives already dark.
   Declaring color-scheme here rather than inline on <html> keeps native form
   controls and scrollbars following the mode when the theme is toggled. */
:root.dark {
  color-scheme: dark;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background-color: var(--cherry-color-light);
  scroll-padding-top: \${SCROLL_PADDING_TOP}px;
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
  border-bottom: solid 1px var(--cherry-color-grayLight);
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
  color: var(--cherry-color-dark);
}

a {
  color: var(--cherry-color-primary);
}

/* Keyboard-focus ring, defined once globally so links don't each re-declare it.
   :focus-visible keeps it keyboard-only (no ring on mouse click); box-shadow
   gives a soft primaryLight glow that follows the element's border-radius. The
   6px radius mirrors theme.spacing.radius.xs so the ring rounds on links that
   have no radius of their own. Cherry link-buttons (.button-link) are excluded
   via :where() so the exclusion adds no specificity - this keeps the selector
   at (0,1,1) so bespoke per-component :focus-visible rules (inline content
   links, the section bar, the sidebar group rows) still override it. */
a:focus-visible:where(:not(.button-link)) {
  outline: none;
  border-radius: 6px;
  box-shadow: 0 0 0 2px var(--cherry-color-primaryLight);
}

ol,
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 100%;
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
   and Moon icons; Header uses them to swap light/dark logos. Pure CSS so the
   swap happens via the active <html> attribute without JS or re-render. */
:root.dark .light-only {
  display: none !important;
}
:root:not(.dark) .dark-only {
  display: none !important;
}
\`;

export { GlobalStyles };
`;
