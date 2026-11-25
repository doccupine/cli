import { describe, expect, it } from "vitest";

import { rootLayoutTemplate } from "../lib/layout.js";
import { appStructureFor } from "../lib/structures.js";
import { SITE_TEMPLATES } from "../lib/templates.js";
import { themeTemplate } from "./app/theme.js";
import { colorModeSyncTemplate } from "./components/ColorModeSync.js";
import { useColorModeTemplate } from "./components/useColorMode.js";
import { cardTemplate } from "./components/layout/Card.js";
import { demoThemeTemplate } from "./components/layout/DemoTheme.js";
import { stepsTemplate } from "./components/layout/Steps.js";
import { baseStylesheet } from "./styles/index.js";
import {
  DEFAULT_PALETTE_DARK,
  DEFAULT_PALETTE_LIGHT,
  PALETTE_KEYS,
} from "./styles/palette.js";
import { cssColorValue, tokensCssTemplate } from "./styles/tokens.js";
import { colorModeTemplate } from "./utils/colorMode.js";

// Doc pages are force-static, so the server cannot know the visitor's mode.
// The whole no-flash story rests on painted colors resolving from CSS custom
// properties: the blocking script puts the "dark" class on <html> before the
// first paint and the page is correct from that frame on, with nothing hidden
// and nothing waiting for hydration. app/styles/tokens.css declares those
// properties under :root and :root.dark, and the color-mode store switches the
// mode by flipping the same class, so a toggle re-renders nothing but the
// toggle. These tests pin that contract down.
describe("generated theming", () => {
  const rootLayout = rootLayoutTemplate(null);
  const tokens = tokensCssTemplate(null).css;

  it("resolves the mode before first paint, onto the dark class", () => {
    expect(rootLayout).toContain('r.classList.toggle("dark",m==="dark");');
    expect(rootLayout).not.toContain("dataset.theme");
    expect(rootLayout).toContain("prefers-color-scheme:dark");
    expect(rootLayout).toContain("SameSite=Lax");
  });

  it("decides the mode the way the color-mode store does after hydration", () => {
    // An explicit preference, else the legacy localStorage choice, else the
    // OS; the cookie only decides where storage is blocked. If the script and
    // the store (utils/colorMode.ts) disagreed, mounting would flip the mode.
    expect(rootLayout).toContain(
      'm=p==="light"||p==="dark"?p:p!=="system"&&(t==="light"||t==="dark")?t:o;',
    );
    expect(rootLayout).toContain('m=c==="light"||c==="dark"?c:o;');
    expect(rootLayout).toContain('localStorage.getItem("themePreference")');
    expect(colorModeTemplate).toContain(
      'const PREFERENCE_KEY = "themePreference";',
    );
    expect(colorModeTemplate).toContain(
      'stored === "light" || stored === "dark" || stored === "system"',
    );
    expect(colorModeTemplate).toContain(
      'const legacy = window.localStorage.getItem("theme");',
    );
    expect(colorModeTemplate).toContain('return readCookieMode() ?? "system";');
  });

  it("keys every mode-specific style off the dark class", () => {
    // The script and the store only set the class; a data-theme selector
    // would never match. Every generated file of every design, so a new
    // design's styles are held to the same rule.
    for (const template of SITE_TEMPLATES) {
      for (const [file, content] of Object.entries(appStructureFor(template))) {
        expect(content, `${template}: ${file}`).not.toContain("data-theme");
      }
    }
    expect(tokens).toContain("  :root.dark {");
    expect(baseStylesheet).toContain(":root.dark .light-only {");
    expect(baseStylesheet).toContain(":root:not(.dark) .dark-only {");
    for (const template of SITE_TEMPLATES) {
      const design = appStructureFor(template)["app/styles/design.css"];
      expect(design, template).toContain(":root.dark .dcp-callout");
      expect(design, template).toContain(":root.dark .dcp-code__body {");
    }
  });

  it("never hides the page while waiting for hydration", () => {
    expect(rootLayout).not.toContain("visibility:hidden");
    expect(rootLayout).not.toContain("__theme-init");
    expect(rootLayout).not.toContain("MutationObserver");
    // color-scheme belongs to the stylesheet, keyed off the same class, so it
    // follows a toggle instead of sticking to the first visit's mode.
    expect(rootLayout).not.toContain("colorScheme");
    expect(tokens).toContain("color-scheme: light;");
    expect(tokens).toContain("color-scheme: dark;");
  });

  it("imports the stylesheets in layer order and syncs the mode outside React state", () => {
    const order = [
      'import "./styles/reset.css";',
      'import "./styles/tokens.css";',
      'import "./styles/base.css";',
      'import "./styles/components.css";',
      'import "./styles/design.css";',
    ].map((line) => rootLayout.indexOf(line));
    expect(order.every((index) => index > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(rootLayout).toContain("<ColorModeSync />");
    expect(rootLayout).not.toContain("CherryThemeProvider");
    expect(rootLayout).not.toContain("ClientThemeProvider");
    // The sync reads the store directly: a hydration snapshot is the server's
    // "light" and applying it would flip a dark page for a frame.
    expect(colorModeSyncTemplate).toContain(
      "const sync = () => applyColorMode(getColorModeState().mode);",
    );
    expect(colorModeSyncTemplate).not.toContain("useSyncExternalStore");
    expect(colorModeSyncTemplate).toContain("return null;");
    expect(useColorModeTemplate).toContain("useSyncExternalStore(");
    // No theme object for components to read at all: colors are CSS
    // variables, and app/theme.ts only resolves the palettes.
    expect(rootLayout).not.toContain("ThemeProvider");
    expect(rootLayout).not.toContain("StyledComponentsRegistry");
    expect(themeTemplate).not.toContain("export const theme");
    expect(themeTemplate).toContain("export const colorsLight: Palette = {");
  });

  it("derives semantic tokens from the palette's CSS variables", () => {
    // So a runtime override of --color-primary* (the DemoTheme presets)
    // cascades into accent, tints and the rest.
    expect(tokens).toContain("--color-accent: var(--color-primaryDark);");
    expect(tokens).toContain("--color-accent: var(--color-primaryLight);");
    expect(tokens).toContain("var(--color-primary) 4%,");
    expect(tokens).toContain("var(--color-primary) 10%,");
    expect(demoThemeTemplate).toContain("--color-");
    expect(demoThemeTemplate).not.toContain("--cherry-");
    expect(demoThemeTemplate).toContain(
      'import { useColorMode } from "@/components/useColorMode";',
    );
    for (const token of [
      "link",
      "onFilled",
      "primaryTintHover",
      "primaryTintDrop",
      "primaryTintActive",
    ]) {
      expect(tokens).toContain(`--color-${token}:`);
    }
    expect(tokens).toContain("--shadow-toast:");
  });

  it("declares the documented --color-*, --shadow-* and --mermaid-* names", () => {
    // The theme and Mermaid docs pages tell users to style with them.
    for (const key of PALETTE_KEYS) {
      expect(tokens).toContain(
        `--color-${key}: ${DEFAULT_PALETTE_LIGHT[key]};`,
      );
      expect(tokens).toContain(`--color-${key}: ${DEFAULT_PALETTE_DARK[key]};`);
    }
    expect(tokens).toContain("--mermaid-accent: var(--color-accent);");
    expect(tokens).not.toContain("--cherry-");
  });

  it("generates the palette from theme.json, refusing anything but a color", () => {
    const { css, warnings } = tokensCssTemplate(
      JSON.stringify({
        default: { primary: "#79C5FF", secondary: "red;} body{display:none" },
        dark: { primary: "rgb(1,2 , 3)", light: "url(x)" },
      }),
    );
    expect(css).toContain("--color-primary: #79c5ff;");
    expect(css).toContain("--color-primary: rgb(1, 2, 3);");
    expect(css).toContain(
      `--color-secondary: ${DEFAULT_PALETTE_LIGHT.secondary};`,
    );
    expect(css).not.toContain("display:none");
    expect(css).not.toContain("url(");
    expect(warnings).toHaveLength(2);
    expect(cssColorValue("</style>")).toBeNull();
    expect(cssColorValue("#fff/*")).toBeNull();
    expect(tokensCssTemplate("not json").css).toBe(tokens);
  });

  it("keeps the defaults of theme.ts and tokens.css in step", () => {
    for (const key of PALETTE_KEYS) {
      expect(themeTemplate).toContain(
        `  ${key}: "${DEFAULT_PALETTE_LIGHT[key]}",`,
      );
      expect(themeTemplate).toContain(
        `  ${key}: "${DEFAULT_PALETTE_DARK[key]}",`,
      );
    }
  });

  it("keeps the mode runtime free of request data", () => {
    for (const template of [colorModeTemplate, colorModeSyncTemplate]) {
      expect(template).not.toContain("cookies()");
      expect(template).not.toContain("headers()");
    }
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
    // After hydration the store keeps that tag's content on the same token,
    // and neither it nor DemoTheme ever creates or removes a tag.
    expect(colorModeTemplate).toContain('getPropertyValue("--color-primary")');
    for (const template of [colorModeTemplate, demoThemeTemplate]) {
      expect(template).toContain(
        "if (color && meta && meta.content !== color) meta.content = color;".replace(
          template === demoThemeTemplate ? "color && meta" : "\0",
          "meta && color",
        ),
      );
      expect(template).not.toContain("createElement");
      expect(template).not.toContain(".remove()");
    }
    // The layout reads palette values server-side, so the theme module must
    // not be a client module.
    expect(themeTemplate).not.toContain('"use client"');
  });

  it("tints icons in CSS, since var() does not resolve in SVG attributes", () => {
    for (const template of [cardTemplate, stepsTemplate]) {
      expect(template).not.toContain("color={");
    }
    for (const template of SITE_TEMPLATES) {
      const design = appStructureFor(template)["app/styles/design.css"];
      expect(design, template).toContain(".dcp-card > svg.lucide {");
      expect(design, template).toContain(".dcp-steps__title > svg.lucide {");
    }
  });
});
