export const SIDEBAR_WIDTH = 280;
export const CHAT_WIDTH = 420;

export const themeTemplate = `"use client";
import customThemeJson from "@/theme.json";

interface CustomTheme {
  default?: Partial<Colors>;
  dark?: Partial<Colors>;
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

const colors: Colors = {
  primaryLight: "#d1d5db",
  primary: "#6b7280",
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
  ...(customTheme.default ? (customTheme.default as Partial<Colors>) : {}),
};

const colorsDark: Colors = {
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
  ...(customTheme.dark ? (customTheme.dark as Partial<Colors>) : {}),
};

const shadows: Shadows = {
  xs: "0px 4px 4px 0px rgba(18, 18, 18, 0.04), 0px 1px 3px 0px rgba(39, 41, 45, 0.02)",
  sm: "0px 4px 4px 0px rgba(18, 18, 18, 0.08), 0px 1px 3px 0px rgba(39, 41, 45, 0.04)",
  md: "0px 8px 8px 0px rgba(18, 18, 18, 0.16), 0px 2px 3px 0px rgba(39, 41, 45, 0.06)",
  lg: "0px 16px 24px 0px rgba(18, 18, 18, 0.20), 0px 2px 3px 0px rgba(39, 41, 45, 0.08)",
  xl: "0px 24px 32px 0px rgba(18, 18, 18, 0.24), 0px 2px 3px 0px rgba(39, 41, 45, 0.12)",
};

const shadowsDark: Shadows = {
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

export const theme: Theme = {
  breakpoints,
  spacing,
  colors,
  shadows,
  fonts,
  fontSizes,
  lineHeights,
  isDark: false,
};

export const themeDark: Theme = {
  breakpoints,
  spacing,
  colors: colorsDark,
  shadows: shadowsDark,
  fonts,
  fontSizes,
  lineHeights,
  isDark: true,
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
}

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
