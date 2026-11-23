import { describe, expect, it } from "vitest";

import { rootLayoutTemplate } from "../lib/layout.js";
import { themeTemplate } from "./app/theme.js";
import { cardTemplate } from "./components/layout/Card.js";
import { badgeTemplate } from "./components/layout/Badge.js";
import { calloutTemplate } from "./components/layout/Callout.js";
import { cherryThemeProviderTemplate } from "./components/layout/CherryThemeProvider.js";
import { codeTemplate } from "./components/layout/Code.js";
import { demoThemeTemplate } from "./components/layout/DemoTheme.js";
import { globalStylesTemplate } from "./components/layout/GlobalStyles.js";
import { stepsTemplate } from "./components/layout/Steps.js";

// Doc pages are force-static, so the server cannot know the visitor's mode.
// The whole no-flash story rests on painted colors resolving from CSS custom
// properties: the blocking script puts the "dark" class on <html> before the
// first paint and the page is correct from that frame on, with nothing hidden
// and nothing waiting for hydration. Cherry's provider (0.3+) declares those
// properties and switches the mode by flipping the same class, so a toggle
// re-renders no styled component. These tests pin that contract down.
describe("generated theming", () => {
  const rootLayout = rootLayoutTemplate(null);

  it("resolves the mode before first paint, onto the dark class", () => {
    expect(rootLayout).toContain('r.classList.toggle("dark",m==="dark");');
    expect(rootLayout).not.toContain("dataset.theme");
    expect(rootLayout).toContain("prefers-color-scheme:dark");
    expect(rootLayout).toContain("SameSite=Lax");
  });

  it("decides the mode the way Cherry's provider does after hydration", () => {
    // An explicit preference, else the legacy localStorage choice, else the
    // OS; the cookie only decides where storage is blocked. This is Cherry's
    // rule (color-mode.ts); if the two disagreed, mounting would flip the mode.
    expect(rootLayout).toContain(
      'm=p==="light"||p==="dark"?p:p!=="system"&&(t==="light"||t==="dark")?t:o;',
    );
    expect(rootLayout).toContain('m=c==="light"||c==="dark"?c:o;');
    expect(rootLayout).toContain('localStorage.getItem("themePreference")');
  });

  it("keys every mode-specific style off the dark class", () => {
    // Cherry only sets the class; a data-theme selector would never match.
    for (const template of [
      globalStylesTemplate,
      calloutTemplate,
      codeTemplate,
      badgeTemplate,
      cherryThemeProviderTemplate,
    ]) {
      expect(template).not.toContain("data-theme");
    }
    expect(globalStylesTemplate).toContain(":root.dark {");
    expect(globalStylesTemplate).toContain(":root.dark .light-only {");
    expect(globalStylesTemplate).toContain(":root:not(.dark) .dark-only {");
    expect(calloutTemplate).toContain(":root.dark & {");
  });

  it("never hides the page while waiting for hydration", () => {
    expect(rootLayout).not.toContain("visibility:hidden");
    expect(rootLayout).not.toContain("__theme-init");
    expect(rootLayout).not.toContain("MutationObserver");
    // color-scheme belongs to the stylesheet, keyed off the same class, so it
    // follows a toggle instead of sticking to the first visit's mode. Cherry's
    // variable stylesheet does not set it.
    expect(rootLayout).not.toContain("colorScheme");
    expect(globalStylesTemplate).toContain("color-scheme: light");
    expect(globalStylesTemplate).toContain("color-scheme: dark");
  });

  it("hands Cherry's provider a light and a dark theme", () => {
    expect(cherryThemeProviderTemplate).toContain(
      'import { ClientThemeProvider } from "cherry-styled-components";',
    );
    expect(cherryThemeProviderTemplate).toContain("theme={theme}");
    expect(cherryThemeProviderTemplate).toContain("themeDark={themeDark}");
    // The app ships its own GlobalStyles.
    expect(cherryThemeProviderTemplate).toContain("$globalStyles={false}");
    expect(cherryThemeProviderTemplate).toContain("<GlobalStyles />");
    expect(themeTemplate).toContain("colors: buildColors(colorsDark, true)");
    expect(themeTemplate).toContain("shadows: shadowsDark");
    // No mode flag on the theme type: components never branch on the mode.
    expect(themeTemplate).not.toMatch(/^\s+isDark: boolean;$/m);
    expect(rootLayout).toContain("<CherryThemeProvider>");
  });

  it("derives semantic tokens from the palette's CSS variables", () => {
    // So a runtime override of --cherry-color-primary* (the DemoTheme
    // presets) cascades into accent, tints and the rest.
    expect(themeTemplate).toContain("var(--cherry-color-");
    expect(themeTemplate).toContain('tint(ref("primary"), isDark ? 10 : 4)');
    expect(demoThemeTemplate).toContain("--cherry-color-");
    expect(demoThemeTemplate).toContain(
      'import { useColorMode } from "cherry-styled-components";',
    );
    // Cherry's mode tokens are all set, so none of its components fall back
    // to a light-mode default.
    for (const token of [
      "link",
      "onFilled",
      "primaryTintHover",
      "primaryTintDrop",
      "primaryTintActive",
    ]) {
      expect(themeTemplate).toContain(`  ${token}: TString;`);
    }
    expect(themeTemplate).toContain("toast: TString;");
  });

  it("keeps the --color-* names as aliases of Cherry's variables", () => {
    // The Mermaid docs page tells users to style diagrams with them.
    expect(globalStylesTemplate).toContain(
      "--${prefix}-${key}: var(--cherry-${prefix}-${key});",
    );
    expect(globalStylesTemplate).toContain(
      "--mermaid-accent: var(--cherry-color-accent);",
    );
  });

  it("keeps the provider free of request data", () => {
    expect(cherryThemeProviderTemplate).not.toContain("cookies()");
    expect(cherryThemeProviderTemplate).not.toContain("headers()");
  });

  it("writes the theme-color meta pre-paint, and only rewrites its content after", () => {
    // The site's mode is per visitor, so OS-scheme-scoped SSR metas (a
    // viewport themeColor export) would paint the wrong browser chrome until
    // hydration. The meta must also stay out of React entirely: Safari only
    // tints reliably from a parser-inserted tag, and React 19 hydration
    // answers any pre-paint mutation of a head meta by inserting a duplicate
    // with the stale color. The blocking script's document.write is
    // parser-inserted and invisible to hydration at once.
    expect(rootLayout).not.toContain("themeColor");
    expect(rootLayout).not.toContain("prefers-color-scheme: light");
    expect(rootLayout).toContain(
      'document.write(\'<meta name="theme-color" content="\'+(m==="dark"?"${colorsDark.primary}":"${colorsLight.primary}")+\'">\');',
    );
    // After hydration Cherry keeps that tag's content on the same token.
    expect(cherryThemeProviderTemplate).toContain('$themeColor="primary"');
    // DemoTheme re-syncs it on a preset without creating or removing tags.
    expect(demoThemeTemplate).toContain(
      "if (meta && color && meta.content !== color) meta.content = color;",
    );
    expect(demoThemeTemplate).not.toContain("createElement");
    expect(demoThemeTemplate).not.toContain(".remove()");
    // The layout reads palette values server-side, so the theme module must
    // not be a client module.
    expect(themeTemplate).not.toContain('"use client"');
  });

  it("tints icons in CSS, since var() does not resolve in SVG attributes", () => {
    for (const template of [cardTemplate, stepsTemplate]) {
      expect(template).not.toContain("color={theme.colors.primary}");
      expect(template).toContain("& > svg.lucide {");
    }
  });
});
