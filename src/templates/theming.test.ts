import { describe, expect, it } from "vitest";

import { rootLayoutTemplate } from "../lib/layout.js";
import { appStructure } from "../lib/structures.js";
import { themeTemplate } from "./app/theme.js";
import { cardTemplate } from "./components/layout/Card.js";
import { cherryThemeProviderTemplate } from "./components/layout/CherryThemeProvider.js";
import { globalStylesTemplate } from "./components/layout/GlobalStyles.js";
import { nextConfigTemplate } from "./next.config.js";
import { stepsTemplate } from "./components/layout/Steps.js";
import { polishedCompatTemplate } from "./utils/polishedCompat.js";

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
    // The provider's class is out of step on mount, so the attribute has to be
    // mirrored from the active theme rather than read back off that class.
    expect(cherryThemeProviderTemplate).toContain("root.dataset.theme =");
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
    // A meta tag cannot resolve a custom property, so the provider must not be
    // left to copy a var() reference into it.
    expect(cherryThemeProviderTemplate).toContain("$themeColor={false}");
    expect(cherryThemeProviderTemplate).toContain('name="theme-color"');
    expect(cherryThemeProviderTemplate).not.toContain("cookies()");
    expect(cherryThemeProviderTemplate).not.toContain("$initial");
  });

  it("tints icons in CSS, since var() does not resolve in SVG attributes", () => {
    for (const template of [cardTemplate, stepsTemplate]) {
      expect(template).not.toContain("color={theme.colors.primary}");
      expect(template).toContain("& > svg.lucide {");
    }
  });

  it("routes JavaScript color math into CSS, where var() resolves", () => {
    // A dependency that parses colors in JavaScript throws on a var()
    // reference and takes the whole render down with it. The shim does the
    // same operations in CSS; it only works if both halves are wired up.
    expect(polishedCompatTemplate).toContain("export const rgba");
    expect(polishedCompatTemplate).toContain("export const darken");
    expect(polishedCompatTemplate).toContain("export const lighten");
    expect(polishedCompatTemplate).toContain("color-mix(in srgb");
    const configs = [
      nextConfigTemplate(null),
      nextConfigTemplate({ provider: "posthog", posthog: { key: "phc_x" } }),
    ];
    for (const config of configs) {
      expect(config).toContain('polished: "./utils/polishedCompat.ts"');
    }
    expect(appStructure["utils/polishedCompat.ts"]).toBe(
      polishedCompatTemplate,
    );
  });
});
