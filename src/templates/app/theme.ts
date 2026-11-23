export const SIDEBAR_WIDTH = 280;
export const CHAT_WIDTH = 420;

export const themeTemplate = `import customThemeJson from "@/theme.json";

// Users can only override the brand palette via theme.json: semantic tokens
// (accent, surface, etc.) are derived from the brand colors by buildColors
// and are not directly overridable.
type CustomColors = Omit<
  Colors,
  | "accent"
  | "accentStrong"
  | "accentMuted"
  | "surface"
  | "link"
  | "onFilled"
  | "primaryTintHover"
  | "primaryTintDrop"
  | "primaryTintActive"
>;

interface CustomTheme {
  default?: Partial<CustomColors>;
  dark?: Partial<CustomColors>;
}

const customTheme = customThemeJson as CustomTheme;

const breakpoints: Breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1440,
  xxxl: 1920,
};

export function mq(minWidth: keyof Breakpoints) {
  return \`@media screen and (min-width: \${breakpoints[minWidth]}px)\`;
}

const spacing: Spacing = {
  maxWidth: { xs: "1280px", xxxl: "1440px" },
  padding: { xs: "20px", lg: "40px" },
  radius: { xs: "6px", lg: "12px", xl: "30px" },
  gridGap: { xs: "20px", lg: "40px" },
};

// Resolved hex palettes for each mode. Cherry's provider declares them as CSS
// custom properties, one block per mode, and that is where every painted color
// comes from. Custom theme.json overrides are merged here, so they flow
// through both.
export const colorsLight: CustomColors = {
  primaryLight: "#d1d5db",
  primary: "#556272",
  primaryDark: "#374151",
  secondaryLight: "#c4b5fd",
  secondary: "#8b5cf6",
  secondaryDark: "#5b21b6",
  tertiaryLight: "#86efac",
  tertiary: "#22c55e",
  tertiaryDark: "#15803d",
  grayLight: "#e5e7eb",
  gray: "#9ca3af",
  grayDark: "#4b5563",
  success: "#84cc16",
  error: "#ef4444",
  warning: "#eab308",
  info: "#06b6d4",
  dark: "#000000",
  light: "#ffffff",
  ...(customTheme.default
    ? (customTheme.default as Partial<CustomColors>)
    : {}),
};

export const colorsDark: CustomColors = {
  primaryLight: "#9ca3af",
  primary: "#6b7280",
  primaryDark: "#374151",
  secondaryLight: "#ddd6fe",
  secondary: "#a78bfa",
  secondaryDark: "#7c3aed",
  tertiaryLight: "#6ee7b7",
  tertiary: "#10b981",
  tertiaryDark: "#065f46",
  grayLight: "#1a1a1a",
  gray: "#454444",
  grayDark: "#808080",
  success: "#84cc16",
  error: "#ef4444",
  warning: "#eab308",
  info: "#06b6d4",
  dark: "#ffffff",
  light: "#000000",
  ...(customTheme.dark ? (customTheme.dark as Partial<CustomColors>) : {}),
};

export const shadowsLight: Shadows = {
  xs: "0px 4px 4px 0px rgba(18, 18, 18, 0.04), 0px 1px 3px 0px rgba(39, 41, 45, 0.02)",
  sm: "0px 4px 4px 0px rgba(18, 18, 18, 0.08), 0px 1px 3px 0px rgba(39, 41, 45, 0.04)",
  md: "0px 8px 8px 0px rgba(18, 18, 18, 0.16), 0px 2px 3px 0px rgba(39, 41, 45, 0.06)",
  lg: "0px 16px 24px 0px rgba(18, 18, 18, 0.20), 0px 2px 3px 0px rgba(39, 41, 45, 0.08)",
  xl: "0px 24px 32px 0px rgba(18, 18, 18, 0.24), 0px 2px 3px 0px rgba(39, 41, 45, 0.12)",
  toast:
    "0px 4px 4px 0px rgba(18, 18, 18, 0.04), 0px 1px 3px 0px rgba(39, 41, 45, 0.02)",
};

export const shadowsDark: Shadows = {
  xs: "0px 4px 4px 0px rgba(255, 255, 255, 0.04), 0px 1px 3px 0px rgba(255, 255, 255, 0.02)",
  sm: "0px 4px 4px 0px rgba(255, 255, 255, 0.08), 0px 1px 3px 0px rgba(255, 255, 255, 0.04)",
  md: "0px 8px 8px 0px rgba(255, 255, 255, 0.16), 0px 2px 3px 0px rgba(255, 255, 255, 0.06)",
  lg: "0px 16px 24px 0px rgba(255, 255, 255, 0.20), 0px 2px 3px 0px rgba(255, 255, 255, 0.08)",
  xl: "0px 24px 32px 0px rgba(255, 255, 255, 0.24), 0px 2px 3px 0px rgba(255, 255, 255, 0.12)",
  toast:
    "0px 4px 4px 0px rgba(255, 255, 255, 0.08), 0px 1px 3px 0px rgba(255, 255, 255, 0.04)",
};

const fonts: Fonts = {
  text: "Inter",
  head: "Inter",
  mono: "Roboto Mono, monospace",
};

const fontSizes: FontSizes = {
  hero1: { xs: "72px", lg: "128px" },
  hero2: { xs: "60px", lg: "96px" },
  hero3: { xs: "36px", lg: "72px" },

  h1: { xs: "40px", lg: "60px" },
  h2: { xs: "30px", lg: "36px" },
  h3: { xs: "28px", lg: "30px" },
  h4: { xs: "24px", lg: "26px" },
  h5: { xs: "18px", lg: "20px" },
  h6: { xs: "16px", lg: "18px" },

  text: { xs: "14px", lg: "16px" },
  strong: { xs: "14px", lg: "16px" },
  small: { xs: "12px", lg: "14px" },

  blockquote: { xs: "16px", lg: "18px" },
  code: { xs: "14px", lg: "16px" },

  button: { xs: "16px", lg: "16px" },
  buttonBig: { xs: "18px", lg: "18px" },
  buttonSmall: { xs: "14px", lg: "14px" },

  input: { xs: "16px", lg: "16px" },
  inputBig: { xs: "18px", lg: "18px" },
  inputSmall: { xs: "14px", lg: "14px" },
};

const lineHeights: LineHeights = {
  hero1: { xs: "1.1", lg: "1.1" },
  hero2: { xs: "1.1", lg: "1.1" },
  hero3: { xs: "1.17", lg: "1.1" },

  h1: { xs: "1", lg: "1.07" },
  h2: { xs: "1.2", lg: "1.2" },
  h3: { xs: "1.3", lg: "1.5" },
  h4: { xs: "1.3", lg: "1.5" },
  h5: { xs: "1.6", lg: "1.5" },
  h6: { xs: "1.6", lg: "1.6" },

  text: { xs: "1.7", lg: "1.7" },
  strong: { xs: "1.7", lg: "1.7" },
  small: { xs: "1.7", lg: "1.7" },

  blockquote: { xs: "1.7", lg: "1.7" },
  code: { xs: "1.7", lg: "1.7" },

  button: { xs: "1", lg: "1" },
  buttonBig: { xs: "1", lg: "1" },
  buttonSmall: { xs: "1", lg: "1" },

  input: { xs: "1", lg: "1" },
  inputBig: { xs: "1", lg: "1" },
  inputSmall: { xs: "1", lg: "1" },
};

// \`color\` at \`percent\`% opacity, as native CSS (what Cherry's alpha() writes).
function tint(color: string, percent: number): string {
  return \`color-mix(in srgb, \${color} \${percent}%, transparent)\`;
}

// A palette color as the CSS variable Cherry declares for it, so a token built
// from it follows runtime overrides of that variable (the DemoTheme presets).
const ref = (key: keyof CustomColors) => \`var(--cherry-color-\${key})\`;

// Builds the full Colors record for a mode: the resolved brand palette plus
// the semantic tokens derived from it. The semantic tokens reference the
// palette's CSS variables rather than copying its values, so overriding
// --cherry-color-primary* at runtime cascades into them.
export function buildColors(palette: CustomColors, isDark: boolean): Colors {
  const accent = ref(isDark ? "primaryLight" : "primaryDark");
  return {
    ...palette,
    accent,
    // accent shifted ~10% toward black (light mode) or white (dark mode).
    accentStrong: \`color-mix(in srgb, \${accent} 90%, \${isDark ? "white" : "black"})\`,
    accentMuted: ref(isDark ? "grayDark" : "primary"),
    surface: ref(isDark ? "dark" : "light"),
    // Cherry's mode tokens, stated here so they follow the presets too.
    link: ref(isDark ? "dark" : "primary"),
    onFilled: ref(isDark ? "dark" : "light"),
    primaryTintHover: tint(ref("primary"), isDark ? 10 : 4),
    primaryTintDrop: tint(ref("primary"), isDark ? 12 : 5),
    primaryTintActive: tint(ref("primary"), isDark ? 18 : 10),
  };
}

// The light and dark themes, with real values, for Cherry's ClientThemeProvider
// (see CherryThemeProvider). Cherry turns them into one theme whose colors and
// shadows are CSS variables (\`var(--cherry-color-primary)\`), declares the light
// values on :root and the dark ones on :root.dark, and switches the mode by
// flipping the \`dark\` class on <html>, so no styled component renders again.
// The blocking script in the root layout sets that class before the first
// paint. A style that differs by mode is a token or a \`:root.dark &\` rule,
// never a branch in JS; code that needs the mode reads Cherry's useColorMode().
export const theme: Theme = {
  breakpoints,
  spacing,
  colors: buildColors(colorsLight, false),
  shadows: shadowsLight,
  fonts,
  fontSizes,
  lineHeights,
};

export const themeDark: Theme = {
  ...theme,
  colors: buildColors(colorsDark, true),
  shadows: shadowsDark,
};

interface Breakpoints<TNumber = number> {
  xs: TNumber;
  sm: TNumber;
  md: TNumber;
  lg: TNumber;
  xl: TNumber;
  xxl: TNumber;
  xxxl: TNumber;
}

interface Spacing<TString = string> {
  maxWidth: { xs: TString; xxxl: TString };
  padding: { xs: TString; lg: TString };
  radius: { xs: TString; lg: TString; xl: TString };
  gridGap: { xs: TString; lg: TString };
}

// Matches cherry-styled-components' Colors shape for the brand keys, plus a
// handful of semantic tokens derived from the brand palette by buildColors.
// The brand keys (primaryLight…light) are customizable via theme.json; the
// semantic keys (accent*, surface) are derived and not overridable — see
// CustomColors above.
interface Colors<TString = string> {
  primaryLight: TString;
  primary: TString;
  primaryDark: TString;

  secondaryLight: TString;
  secondary: TString;
  secondaryDark: TString;

  tertiaryLight: TString;
  tertiary: TString;
  tertiaryDark: TString;

  grayLight: TString;
  gray: TString;
  grayDark: TString;

  success: TString;
  error: TString;
  warning: TString;
  info: TString;

  dark: TString;
  light: TString;

  /** High-contrast accent text. Was: isDark ? primaryLight : primaryDark. */
  accent: TString;
  /** Slightly stronger accent (lightened/darkened by ~10%). */
  accentStrong: TString;
  /** Muted body text. Was: isDark ? grayDark : primary. */
  accentMuted: TString;
  /** Elevated surface color, white-ish in both modes. Was: isDark ? dark : light. */
  surface: TString;
  /** Link text (Cherry). primary in light mode, dark in dark mode. */
  link: TString;
  /** Text on a filled control (Cherry). The palette end contrasting with the mode. */
  onFilled: TString;
  /** primary tints Cherry uses for hover / drop / active backgrounds. */
  primaryTintHover: TString;
  primaryTintDrop: TString;
  primaryTintActive: TString;
}

interface Shadows<TString = string> {
  xs: TString;
  sm: TString;
  md: TString;
  lg: TString;
  xl: TString;
  /** Cherry's toast shadow: xs in light mode, sm in dark mode. */
  toast: TString;
}

interface Fonts<TString = string> {
  head: TString;
  text: TString;
  mono: TString;
}

interface FontSizes<TString = string> {
  hero1: { xs: TString; lg: TString };
  hero2: { xs: TString; lg: TString };
  hero3: { xs: TString; lg: TString };

  h1: { xs: TString; lg: TString };
  h2: { xs: TString; lg: TString };
  h3: { xs: TString; lg: TString };
  h4: { xs: TString; lg: TString };
  h5: { xs: TString; lg: TString };
  h6: { xs: TString; lg: TString };

  text: { xs: TString; lg: TString };
  strong: { xs: TString; lg: TString };
  small: { xs: TString; lg: TString };

  blockquote: { xs: TString; lg: TString };
  code: { xs: TString; lg: TString };

  button: { xs: TString; lg: TString };
  buttonBig: { xs: TString; lg: TString };
  buttonSmall: { xs: TString; lg: TString };

  input: { xs: TString; lg: TString };
  inputBig: { xs: TString; lg: TString };
  inputSmall: { xs: TString; lg: TString };
}

interface LineHeights<TString = string> {
  hero1: { xs: TString; lg: TString };
  hero2: { xs: TString; lg: TString };
  hero3: { xs: TString; lg: TString };

  h1: { xs: TString; lg: TString };
  h2: { xs: TString; lg: TString };
  h3: { xs: TString; lg: TString };
  h4: { xs: TString; lg: TString };
  h5: { xs: TString; lg: TString };
  h6: { xs: TString; lg: TString };

  text: { xs: TString; lg: TString };
  strong: { xs: TString; lg: TString };
  small: { xs: TString; lg: TString };

  blockquote: { xs: TString; lg: TString };
  code: { xs: TString; lg: TString };

  button: { xs: TString; lg: TString };
  buttonBig: { xs: TString; lg: TString };
  buttonSmall: { xs: TString; lg: TString };

  input: { xs: TString; lg: TString };
  inputBig: { xs: TString; lg: TString };
  inputSmall: { xs: TString; lg: TString };
}

export interface Theme {
  breakpoints: Breakpoints;
  spacing: Spacing;
  colors: Colors;
  shadows: Shadows;
  fonts: Fonts;
  fontSizes: FontSizes;
  lineHeights: LineHeights;
}
`;
