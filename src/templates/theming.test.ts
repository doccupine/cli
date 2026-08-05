import { describe, expect, it } from "vitest";

import { rootLayoutTemplate } from "../lib/layout.js";
import { themeTemplate } from "./app/theme.js";
import { cardTemplate } from "./components/layout/Card.js";
import { cherryThemeProviderTemplate } from "./components/layout/CherryThemeProvider.js";
import { globalStylesTemplate } from "./components/layout/GlobalStyles.js";
import { stepsTemplate } from "./components/layout/Steps.js";

// Doc pages are force-static, so the server cannot know the visitor's mode.
// The whole no-flash story rests on painted colors resolving from CSS custom
// properties: the blocking script puts one class on <html> before the first
// paint and the page is correct from that frame on, with nothing hidden and
// nothing waiting for hydration. These tests pin that contract down, because
// reintroducing a literal color into the theme objects would silently bring
// back the "dark mode loads as a blank rectangle" behavior.
describe("generated theming", () => {
  const rootLayout = rootLayoutTemplate(null);

  it("resolves the mode before first paint, onto our own attribute", () => {
    // Keyed on data-theme rather than the "dark" class: that class belongs to
    // Cherry's provider, which strips it for a frame on mount while it
    // reconciles the server's light theme against the cookie. Anything painted
    // from it flashes light on every dark load.
    expect(rootLayout).toContain('r.dataset.theme=d?"dark":"light"');
    expect(rootLayout).toContain("prefers-color-scheme:dark");
    expect(rootLayout).toContain("SameSite=Lax");
    expect(globalStylesTemplate).toContain(':root[data-theme="dark"]');
    expect(globalStylesTemplate).not.toContain(":root.dark");
    // The attribute mirror must read the cookie, not the theme object: the
    // first client render carries the unreconciled light theme, and a
    // skip-the-first-pass ref alone breaks under StrictMode's dev
    // double-invocation - the second pass writes light and the page flashes
    // white on every dark load. The theme object is only the cookie-less
    // fallback, where the first pass must still be skipped.
    expect(cherryThemeProviderTemplate).toContain("theme=(dark|light)");
    expect(cherryThemeProviderTemplate).toContain(
      "document.documentElement.dataset.theme = activeTheme.isDark",
    );
    expect(cherryThemeProviderTemplate).toContain("settled.current");
  });

  it("never hides the page or freezes transitions while waiting for hydration", () => {
    expect(rootLayout).not.toContain("visibility:hidden");
    expect(rootLayout).not.toContain("__theme-init");
    expect(rootLayout).not.toContain("__theme-transitions");
    expect(rootLayout).not.toContain("MutationObserver");
    expect(rootLayout).not.toContain("background:#000");
    // color-scheme belongs to the stylesheet, keyed off the same attribute, so
    // it follows a toggle instead of sticking to the first visit's mode.
    expect(rootLayout).not.toContain("colorScheme");
    expect(globalStylesTemplate).toContain("color-scheme: light");
    expect(globalStylesTemplate).toContain("color-scheme: dark");
  });

  it("paints every theme token through a CSS custom property", () => {
    expect(themeTemplate).toContain(
      'cssVarTokens("color", buildColors(colorsLight, false))',
    );
    expect(themeTemplate).toContain('cssVarTokens("shadow", shadowsLight)');
    expect(themeTemplate).toContain("`var(--${prefix}-${key})`");
    // The two theme objects must stay identical apart from isDark: anything
    // else would make the server's render mode visible before hydration.
    expect(themeTemplate).toContain(
      "export const themeDark: Theme = {\n  ...theme,\n  isDark: true,\n};",
    );
    expect(themeTemplate).not.toContain(
      "colors: buildColors(colorsDark, true)",
    );
    expect(themeTemplate).not.toContain("shadows: shadowsDark");
  });

  it("keeps the provider free of request data and mode guessing", () => {
    expect(cherryThemeProviderTemplate).toContain("$globalStyles={false}");
    // Cherry's provider resolves var() color references through computed
    // styles, so the post-hydration theme-color sync belongs to it
    // ($themeColor="primary"), exactly as on the Doccupine platform site,
    // and the template must not duplicate the meta bookkeeping by hand.
    expect(cherryThemeProviderTemplate).toContain('$themeColor="primary"');
    expect(cherryThemeProviderTemplate).not.toContain('name="theme-color"');
    expect(cherryThemeProviderTemplate).not.toContain("MutationObserver");
    expect(cherryThemeProviderTemplate).not.toContain("cookies()");
    expect(cherryThemeProviderTemplate).not.toContain("$initial");
  });

  it("serves one theme-color meta and hands the correction to Cherry", () => {
    // A single unscoped tag with the light primary from the static viewport
    // export - the same channel the Doccupine platform site uses - corrected
    // by Cherry's $themeColor sync after hydration. The pre-paint script
    // must never touch it: React 19 hydration answers any pre-paint edit of
    // a head meta by inserting a duplicate with the stale value beside it.
    expect(rootLayout).toContain("themeColor: colorsLight.primary");
    expect(rootLayout).not.toContain("prefers-color-scheme: light");
    expect(rootLayout).not.toContain("content={colorsLight.primary}");
    expect(rootLayout).not.toContain("document.write");
    expect(rootLayout).not.toContain('meta[name="theme-color"]');
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
