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
    expect(rootLayout).toContain("r.dataset.theme=m;");
    expect(rootLayout).toContain("prefers-color-scheme:dark");
    expect(rootLayout).toContain("SameSite=Lax");
    expect(globalStylesTemplate).toContain(':root[data-theme="dark"]');
    expect(globalStylesTemplate).not.toContain(":root.dark");
  });

  it("decides the mode the same way before paint and after hydration", () => {
    // An explicit preference, else the legacy localStorage choice, else the
    // OS; the cookie only decides where storage is blocked. If the script and
    // the provider disagreed, mounting would flip the mode on a loaded page.
    expect(rootLayout).toContain(
      'm=p==="light"||p==="dark"?p:p!=="system"&&(t==="light"||t==="dark")?t:o;',
    );
    expect(rootLayout).toContain('m=c==="light"||c==="dark"?c:o;');
    expect(cherryThemeProviderTemplate).toContain(
      'const PREFERENCE_KEY = "themePreference";',
    );
    expect(cherryThemeProviderTemplate).toContain(
      'const legacy = window.localStorage.getItem("theme");',
    );
    expect(cherryThemeProviderTemplate).toContain(
      'return readCookieMode() ?? "system";',
    );
    // "system" follows the OS live.
    expect(cherryThemeProviderTemplate).toContain(
      'media.addEventListener("change", follow)',
    );
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
    // One theme object for both modes, with no mode flag: a toggle must not
    // hand styled-components a new theme, or every component renders again.
    expect(themeTemplate).not.toContain("themeDark");
    expect(themeTemplate).not.toMatch(/^\s+isDark: boolean;$/m);
    expect(themeTemplate).not.toContain(
      "colors: buildColors(colorsDark, true)",
    );
    expect(themeTemplate).not.toContain("shadows: shadowsDark");
  });

  it("switches modes without handing styled-components a new theme", () => {
    // The provider passes the one constant theme; the mode lives on <html>.
    expect(cherryThemeProviderTemplate).toContain(
      "<ThemeProvider theme={theme}>",
    );
    expect(cherryThemeProviderTemplate).not.toContain("ClientThemeProvider");
    expect(cherryThemeProviderTemplate).toContain("root.dataset.theme = mode");
    expect(cherryThemeProviderTemplate).toContain(
      'root.classList.toggle("dark", mode === "dark")',
    );
    // Cherry's ThemeToggle keeps working through its context.
    expect(cherryThemeProviderTemplate).toContain("<ThemeContext.Provider");
    expect(cherryThemeProviderTemplate).toContain("toggleTheme:");
    expect(rootLayout).toContain("<CherryThemeProvider>");
    expect(rootLayout).not.toContain("themeDark");
    // Cherry's mode-dependent colors are tokens, so none of its components
    // fall back to the isDark flag the theme no longer has.
    for (const token of [
      "link",
      "onFilled",
      "primaryTintHover",
      "primaryTintDrop",
      "primaryTintActive",
    ]) {
      expect(themeTemplate).toContain(`  ${token}: TString;`);
      expect(
        globalStylesTemplate.match(new RegExp(`--color-${token}:`, "g")),
      ).toHaveLength(2);
    }
    expect(themeTemplate).toContain("toast: TString;");
  });

  it("paints a mode switch with transitions off", () => {
    // Otherwise each control fades on its own and the page changes unevenly.
    expect(cherryThemeProviderTemplate).toContain(
      'root.classList.add("theme-switching")',
    );
    expect(cherryThemeProviderTemplate).toContain(
      'root.classList.remove("theme-switching")',
    );
    expect(globalStylesTemplate).toContain(".theme-switching *::after {");
    expect(globalStylesTemplate).toContain("transition: none !important;");
  });

  it("keeps the provider free of request data", () => {
    expect(cherryThemeProviderTemplate).not.toContain("cookies()");
    expect(cherryThemeProviderTemplate).not.toContain("headers()");
  });

  it("only rewrites the script-owned theme-color meta's content", () => {
    // Safari tints its chrome reliably only from the parser-inserted tag the
    // blocking script writes; creating, removing or unscoping metas from the
    // client is what broke the tint before.
    expect(cherryThemeProviderTemplate).toContain(
      "if (meta.content !== color) meta.content = color;",
    );
    expect(cherryThemeProviderTemplate).not.toContain("createElement");
    expect(cherryThemeProviderTemplate).not.toContain(".remove()");
  });

  it("writes the theme-color meta pre-paint from the resolved mode", () => {
    // The site's mode is cookie-based, so OS-scheme-scoped SSR metas (a
    // viewport themeColor export) would paint white browser chrome on a dark
    // site under a light OS until hydration - a visible flash on every load.
    // The meta must also stay out of React entirely: Safari only tints
    // reliably from a parser-inserted tag, so a server-rendered meta would
    // have to be corrected by the blocking script before paint, and React 19
    // hydration answers any pre-paint mutation of a head meta by inserting a
    // duplicate with the stale color beside it. The blocking script's
    // document.write is parser-inserted and invisible to hydration at once.
    expect(rootLayout).not.toContain("themeColor");
    expect(rootLayout).not.toContain("prefers-color-scheme: light");
    expect(rootLayout).not.toContain("content={colorsLight.primary}");
    // The script and the provider must stay on the same token, or the
    // chrome color jumps at hydration.
    expect(rootLayout).toContain(
      'document.write(\'<meta name="theme-color" content="\'+(m==="dark"?"${colorsDark.primary}":"${colorsLight.primary}")+\'">\');',
    );
    expect(cherryThemeProviderTemplate).toContain(
      'getPropertyValue("--color-primary")',
    );
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
