import {
  DEFAULT_PALETTE_DARK,
  DEFAULT_PALETTE_LIGHT,
  PALETTE_KEYS,
  SHADOW_KEYS,
  SHADOWS_DARK,
  SHADOWS_LIGHT,
  type Palette,
  type PaletteKey,
  type ShadowKey,
} from "./palette.js";
import { contrastTokens } from "../../lib/contrast.js";

// app/styles/tokens.css: the site's color and shadow tokens as CSS custom
// properties, generated from theme.json. Light values sit on :root and dark
// ones on :root.dark (the class the pre-paint script in app/layout.tsx sets),
// so switching modes repaints without rendering anything again.
//
// Token names are part of the public surface (the theme docs and the Mermaid
// docs tell authors to use them in custom CSS):
//   --color-<paletteKey>  the 18 theme.json keys (primary, grayDark, ...)
//   --color-<semantic>    accent, accentStrong, accentMuted, surface, link,
//                         onFilled, primaryTintHover/Drop/Active, derived from
//                         the palette variables so a runtime override of a
//                         palette variable (the DemoTheme presets) cascades
//   --color-<key>-fill, --color-on-<key>, --color-<key>-fill-hover,
//   --color-on-<key>-hover, --color-<key>-text, --color-<key>-text-hover,
//   --color-text-muted
//                         text colors computed from the palette to pass
//                         WCAG AA (contrastTokens, src/lib/contrast.ts)
//   --shadow-<size>       xs, sm, md, lg, xl, toast
//   --mermaid-*           the diagram colors (see the Mermaid docs)

/** Semantic tokens derived from the palette, per mode. */
function semanticTokens(isDark: boolean): [string, string][] {
  const ref = (key: PaletteKey) => `var(--color-${key})`;
  const accent = ref(isDark ? "primaryLight" : "primaryDark");
  const tint = (percent: number) =>
    `color-mix(in srgb, ${ref("primary")} ${percent}%, transparent)`;
  return [
    ["accent", accent],
    // accent shifted ~10% toward black (light mode) or white (dark mode).
    [
      "accentStrong",
      `color-mix(in srgb, ${accent} 90%, ${isDark ? "white" : "black"})`,
    ],
    ["accentMuted", ref(isDark ? "grayDark" : "primary")],
    ["surface", ref(isDark ? "dark" : "light")],
    ["link", isDark ? ref("dark") : "var(--color-primary-text)"],
    ["onFilled", ref(isDark ? "dark" : "light")],
    ["primaryTintHover", tint(isDark ? 10 : 4)],
    ["primaryTintDrop", tint(isDark ? 12 : 5)],
    ["primaryTintActive", tint(isDark ? 18 : 10)],
  ];
}

const MERMAID_TOKENS: [string, string][] = [
  ["bg", "var(--color-light)"],
  ["fg", "var(--color-dark)"],
  ["line", "var(--color-grayDark)"],
  ["accent", "var(--color-accent)"],
  ["muted", "var(--color-grayDark)"],
  ["surface", "var(--color-grayLight)"],
  ["border", "var(--color-gray)"],
];

const SAFE_COLOR = /^[#a-zA-Z0-9(),.%\s/+-]{1,100}$/;
const COLOR_FUNCTIONS = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
  "color-mix",
]);

/**
 * A theme.json color as a CSS value, or null when it is not a plain color
 * (it would otherwise be written verbatim into a stylesheet). Normalized the
 * way Prettier prints it, so the generated file stays format-stable.
 */
export function cssColorValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!SAFE_COLOR.test(trimmed)) return null;
  for (const [, name] of trimmed.matchAll(/([a-zA-Z-]*)\(/g)) {
    if (!COLOR_FUNCTIONS.has(name.toLowerCase())) return null;
  }
  return trimmed
    .replace(/\s*,\s*/g, ", ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/#[0-9a-fA-F]+\b/g, (hex) => hex.toLowerCase());
}

interface ThemeJsonModes {
  default?: unknown;
  dark?: unknown;
}

/** Merges one mode's theme.json overrides over the default palette. */
function mergePalette(
  defaults: Palette,
  overrides: unknown,
  mode: string,
  warnings: string[],
): Palette {
  const out: Palette = { ...defaults };
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return out;
  }
  for (const key of PALETTE_KEYS) {
    const raw = (overrides as Record<string, unknown>)[key];
    if (raw === undefined) continue;
    const value = cssColorValue(raw);
    if (value === null) {
      warnings.push(
        `theme.json "${mode}.${key}" is not a CSS color; using the default.`,
      );
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** The light and dark palettes for theme.json's raw source. */
export function resolvePalettes(source: string | null): {
  light: Palette;
  dark: Palette;
  warnings: string[];
} {
  const warnings: string[] = [];
  let parsed: ThemeJsonModes = {};
  if (source !== null) {
    try {
      const value: unknown = JSON.parse(source);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        parsed = value as ThemeJsonModes;
      }
    } catch {
      // The config readers report unparseable JSON; fall back to defaults.
    }
  }
  return {
    light: mergePalette(
      DEFAULT_PALETTE_LIGHT,
      parsed.default,
      "default",
      warnings,
    ),
    dark: mergePalette(DEFAULT_PALETTE_DARK, parsed.dark, "dark", warnings),
    warnings,
  };
}

/** `  --name: value;` as Prettier prints it, breaking long color-mix() calls. */
function declaration(name: string, value: string, indent: string): string {
  const line = `${indent}${name}: ${value};`;
  if (line.length <= 80) return line;
  const mix = value.match(/^color-mix\((.*)\)$/);
  if (mix) {
    const args = mix[1].split(", ");
    return [
      `${indent}${name}: color-mix(`,
      ...args.map(
        (arg, index) =>
          `${indent}  ${arg}${index < args.length - 1 ? "," : ""}`,
      ),
      `${indent});`,
    ].join("\n");
  }
  const parts = value.split(/,\s(?![^()]*\))/);
  if (parts.length > 1) {
    return [
      `${indent}${name}:`,
      ...parts.map(
        (part, index) =>
          `${indent}  ${part}${index < parts.length - 1 ? "," : ";"}`,
      ),
    ].join("\n");
  }
  return line;
}

function modeBlock(
  selector: string,
  scheme: "light" | "dark",
  palette: Palette,
  shadows: Record<ShadowKey, string>,
  extra: [string, string][] = [],
): string {
  const indent = "    ";
  const lines = [
    `  ${selector} {`,
    `${indent}color-scheme: ${scheme};`,
    ...PALETTE_KEYS.map((key) =>
      declaration(`--color-${key}`, palette[key], indent),
    ),
    ...semanticTokens(scheme === "dark").map(([key, value]) =>
      declaration(`--color-${key}`, value, indent),
    ),
    ...contrastTokens(palette).map(([key, value]) =>
      declaration(`--color-${key}`, value, indent),
    ),
    ...SHADOW_KEYS.map((key) =>
      declaration(`--shadow-${key}`, shadows[key], indent),
    ),
    ...extra.map(([key, value]) => declaration(key, value, indent)),
    "  }",
  ];
  return lines.join("\n");
}

/** app/styles/tokens.css for theme.json's raw source (null when absent). */
export function tokensCssTemplate(themeSource: string | null): {
  css: string;
  warnings: string[];
} {
  const { light, dark, warnings } = resolvePalettes(themeSource);
  const css = `/* Generated from theme.json by doccupine: edit theme.json, not this file.
   Light values sit on :root and dark ones on :root.dark, the class the
   pre-paint script in app/layout.tsx sets before the first paint. Read them
   anywhere with var(--color-primary), var(--shadow-md), ... */
@layer tokens {
${modeBlock(
  ":root",
  "light",
  light,
  SHADOWS_LIGHT,
  MERMAID_TOKENS.map(([key, value]) => [`--mermaid-${key}`, value]),
)}

${modeBlock(":root.dark", "dark", dark, SHADOWS_DARK)}
}
`;
  return { css, warnings };
}
