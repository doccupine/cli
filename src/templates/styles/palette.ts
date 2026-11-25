// The default brand palette and shadows of a generated site, one record per
// mode. theme.json overrides the palette keys per mode ("default" for light,
// "dark" for dark). Two outputs read these: app/styles/tokens.css (the CSS
// custom properties every painted color comes from, see tokens.ts) and
// app/theme.ts (the same values for code that needs a real color, such as
// the pre-paint script's theme-color meta).

export const PALETTE_KEYS = [
  "primaryLight",
  "primary",
  "primaryDark",
  "secondaryLight",
  "secondary",
  "secondaryDark",
  "tertiaryLight",
  "tertiary",
  "tertiaryDark",
  "grayLight",
  "gray",
  "grayDark",
  "success",
  "error",
  "warning",
  "info",
  "dark",
  "light",
] as const;

export type PaletteKey = (typeof PALETTE_KEYS)[number];
export type Palette = Record<PaletteKey, string>;

export const DEFAULT_PALETTE_LIGHT: Palette = {
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
};

export const DEFAULT_PALETTE_DARK: Palette = {
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
};

export const SHADOW_KEYS = ["xs", "sm", "md", "lg", "xl", "toast"] as const;

export type ShadowKey = (typeof SHADOW_KEYS)[number];

export const SHADOWS_LIGHT: Record<ShadowKey, string> = {
  xs: "0px 4px 4px 0px rgba(18, 18, 18, 0.04), 0px 1px 3px 0px rgba(39, 41, 45, 0.02)",
  sm: "0px 4px 4px 0px rgba(18, 18, 18, 0.08), 0px 1px 3px 0px rgba(39, 41, 45, 0.04)",
  md: "0px 8px 8px 0px rgba(18, 18, 18, 0.16), 0px 2px 3px 0px rgba(39, 41, 45, 0.06)",
  lg: "0px 16px 24px 0px rgba(18, 18, 18, 0.20), 0px 2px 3px 0px rgba(39, 41, 45, 0.08)",
  xl: "0px 24px 32px 0px rgba(18, 18, 18, 0.24), 0px 2px 3px 0px rgba(39, 41, 45, 0.12)",
  toast:
    "0px 4px 4px 0px rgba(18, 18, 18, 0.04), 0px 1px 3px 0px rgba(39, 41, 45, 0.02)",
};

export const SHADOWS_DARK: Record<ShadowKey, string> = {
  xs: "0px 4px 4px 0px rgba(255, 255, 255, 0.04), 0px 1px 3px 0px rgba(255, 255, 255, 0.02)",
  sm: "0px 4px 4px 0px rgba(255, 255, 255, 0.08), 0px 1px 3px 0px rgba(255, 255, 255, 0.04)",
  md: "0px 8px 8px 0px rgba(255, 255, 255, 0.16), 0px 2px 3px 0px rgba(255, 255, 255, 0.06)",
  lg: "0px 16px 24px 0px rgba(255, 255, 255, 0.20), 0px 2px 3px 0px rgba(255, 255, 255, 0.08)",
  xl: "0px 24px 32px 0px rgba(255, 255, 255, 0.24), 0px 2px 3px 0px rgba(255, 255, 255, 0.12)",
  toast:
    "0px 4px 4px 0px rgba(255, 255, 255, 0.08), 0px 1px 3px 0px rgba(255, 255, 255, 0.04)",
};
