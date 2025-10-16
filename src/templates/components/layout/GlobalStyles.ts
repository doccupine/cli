export const globalStylesTemplate = `"use client";
import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle\`
html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  scroll-behavior: smooth;
  background-color: \${({ theme }) => theme.colors.light};
  scroll-padding-top: 20px;
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
  color: \${({ theme }) => theme.colors.dark};
}

a {
  color: \${({ theme }) => (theme.isDark ? theme.colors.dark : theme.colors.primary)};
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
}\`;

export { GlobalStyles };`;
