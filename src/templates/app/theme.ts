export const SIDEBAR_WIDTH = 280;
export const CHAT_WIDTH = 420;

export const themeTemplate = `"use client";
import customThemeJson from "@/theme.json";

// Users can only override the brand palette via theme.json — semantic tokens
// (accent, surface, etc.) are derived in GlobalStyles from the brand colors
// and are not directly overridable.
interface CustomTheme {
  default?: Partial<BrandColors>;
  dark?: Partial<BrandColors>;
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

// Resolved hex palettes for each mode. GlobalStyles emits these as CSS
// custom properties on :root and :root.dark. Components never read these
// directly — they read \`theme.colors.*\` which resolves to var(--color-…)
// and lets the browser pick the right value based on the active class.
export const colorsLight: BrandColors = {
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
  ...(customTheme.default ? (customTheme.default as Partial<BrandColors>) : {}),
};

export const colorsDark: BrandColors = {
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
  ...(customTheme.dark ? (customTheme.dark as Partial<BrandColors>) : {}),
};

export const shadowsLight: Shadows = {
  xs: "0px 4px 4px 0px rgba(18, 18, 18, 0.04), 0px 1px 3px 0px rgba(39, 41, 45, 0.02)",
  sm: "0px 4px 4px 0px rgba(18, 18, 18, 0.08), 0px 1px 3px 0px rgba(39, 41, 45, 0.04)",
  md: "0px 8px 8px 0px rgba(18, 18, 18, 0.16), 0px 2px 3px 0px rgba(39, 41, 45, 0.06)",
  lg: "0px 16px 24px 0px rgba(18, 18, 18, 0.20), 0px 2px 3px 0px rgba(39, 41, 45, 0.08)",
  xl: "0px 24px 32px 0px rgba(18, 18, 18, 0.24), 0px 2px 3px 0px rgba(39, 41, 45, 0.12)",
};

export const shadowsDark: Shadows = {
  xs: "0px 4px 4px 0px rgba(255, 255, 255, 0.04), 0px 1px 3px 0px rgba(255, 255, 255, 0.02)",
  sm: "0px 4px 4px 0px rgba(255, 255, 255, 0.08), 0px 1px 3px 0px rgba(255, 255, 255, 0.04)",
  md: "0px 8px 8px 0px rgba(255, 255, 255, 0.16), 0px 2px 3px 0px rgba(255, 255, 255, 0.06)",
  lg: "0px 16px 24px 0px rgba(255, 255, 255, 0.20), 0px 2px 3px 0px rgba(255, 255, 255, 0.08)",
  xl: "0px 24px 32px 0px rgba(255, 255, 255, 0.24), 0px 2px 3px 0px rgba(255, 255, 255, 0.12)",
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

// Single theme object exported to consumers. Every color/shadow value is a
// CSS custom-property reference; the browser resolves it against :root or
// :root.dark depending on the active class. Components access these exactly
// like before — \`theme.colors.primary\`, \`theme.shadows.sm\` — but the values
// flip without React re-rendering.
const colors: Colors = {
  // Brand palette — directly customizable via theme.json's "default" / "dark".
  primaryLight: "var(--color-primaryLight)",
  primary: "var(--color-primary)",
  primaryDark: "var(--color-primaryDark)",
  secondaryLight: "var(--color-secondaryLight)",
  secondary: "var(--color-secondary)",
  secondaryDark: "var(--color-secondaryDark)",
  tertiaryLight: "var(--color-tertiaryLight)",
  tertiary: "var(--color-tertiary)",
  tertiaryDark: "var(--color-tertiaryDark)",
  grayLight: "var(--color-grayLight)",
  gray: "var(--color-gray)",
  grayDark: "var(--color-grayDark)",
  success: "var(--color-success)",
  error: "var(--color-error)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
  dark: "var(--color-dark)",
  light: "var(--color-light)",

  // Semantic tokens — derived in GlobalStyles to capture the most common
  // mode-aware swaps that components used to express via \`theme.isDark ? A : B\`.
  // They follow the same single-noun convention as the brand palette.
  accent: "var(--color-accent)",
  accentStrong: "var(--color-accentStrong)",
  accentMuted: "var(--color-accentMuted)",
  surface: "var(--color-surface)",
};

const shadows: Shadows = {
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
};

export const theme: Theme = {
  breakpoints,
  spacing,
  colors,
  shadows,
  fonts,
  fontSizes,
  lineHeights,
  // Stub for type compatibility with cherry-styled-components' Theme.
  // Mode switching is handled entirely via CSS vars flipped by :root.dark,
  // so the runtime value is irrelevant for our own code.
  isDark: false,
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

// Brand palette — directly customizable via theme.json. These are the only
// colors that hold raw hex values per mode (in colorsLight / colorsDark).
interface BrandColors<TString = string> {
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
}

// Semantic tokens — derived from the brand palette by GlobalStyles. Naming
// follows the existing single-noun convention; each captures one recurring
// mode-aware pattern that previously required a JS isDark branch.
interface SemanticColors<TString = string> {
  /** High-contrast accent text. Was: isDark ? primaryLight : primaryDark. */
  accent: TString;
  /** Slightly stronger accent (lightened/darkened by ~10%). */
  accentStrong: TString;
  /** Muted body text. Was: isDark ? grayDark : primary. */
  accentMuted: TString;
  /** Elevated surface color, white-ish in both modes. Was: isDark ? dark : light. */
  surface: TString;
}

interface Colors<TString = string>
  extends BrandColors<TString>,
    SemanticColors<TString> {}

interface Shadows<TString = string> {
  xs: TString;
  sm: TString;
  md: TString;
  lg: TString;
  xl: TString;
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
  isDark: boolean;
}
`;
