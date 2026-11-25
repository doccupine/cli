import {
  DEFAULT_PALETTE_DARK,
  DEFAULT_PALETTE_LIGHT,
  PALETTE_KEYS,
  type Palette,
} from "../styles/palette.js";

const paletteLines = (palette: Palette) =>
  PALETTE_KEYS.map((key) => `  ${key}: "${palette[key]}",`).join("\n");

const paletteKeyUnion = PALETTE_KEYS.map((key) => `  | "${key}"`).join("\n");

export const themeTemplate = `import customThemeJson from "@/theme.json";

// The site's brand palette, resolved per mode, for code that needs a real
// color value (the pre-paint script's theme-color meta, the web manifest).
// Painted colors do not come from here: they are the CSS custom properties in
// app/styles/tokens.css (var(--color-primary), ...), which the CLI generates
// from the same defaults and theme.json overrides. Users override the palette
// in theme.json ("default" for light, "dark" for dark); the semantic tokens
// (accent, surface, ...) are derived from it in tokens.css.
export type PaletteKey =
${paletteKeyUnion};

export type Palette = Record<PaletteKey, string>;

interface CustomTheme {
  default?: Partial<Palette>;
  dark?: Partial<Palette>;
}

const customTheme = customThemeJson as CustomTheme;

export const colorsLight: Palette = {
${paletteLines(DEFAULT_PALETTE_LIGHT)}
  ...(customTheme.default ?? {}),
};

export const colorsDark: Palette = {
${paletteLines(DEFAULT_PALETTE_DARK)}
  ...(customTheme.dark ?? {}),
};
`;
