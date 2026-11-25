import { contrastTokens } from "../../../lib/contrast.js";
import {
  DEFAULT_PALETTE_DARK,
  DEFAULT_PALETTE_LIGHT,
} from "../../styles/palette.js";

// The contrast tokens tokens.css computes from theme.json for the primary
// color (its fill, label, hover pair and text colors), computed the same way
// for each preset over the default palette, so a preset's buttons and labels
// keep AA contrast too.
const PRESET_TOKENS = [
  "primary-fill",
  "on-primary",
  "primary-fill-hover",
  "on-primary-hover",
  "primary-text",
  "primary-text-hover",
] as const;

function presetTextTokens(
  primary: string,
  primaryLight: string,
  primaryDark: string,
  mode: "light" | "dark",
): string {
  const defaults =
    mode === "light" ? DEFAULT_PALETTE_LIGHT : DEFAULT_PALETTE_DARK;
  const tokens = Object.fromEntries(
    contrastTokens({ ...defaults, primary, primaryLight, primaryDark }),
  );
  return PRESET_TOKENS.map((name) => `"${name}": "${tokens[name]}",`).join(
    "\n      ",
  );
}

export const demoThemeTemplate = `"use client";
import { useColorMode } from "@/components/useColorMode";
import { Button } from "@/components/layout/Button";
import { Columns } from "@/components/layout/Columns";

interface DemoThemeProps {
  variant: "purple" | "green" | "yellow";
}

type Palette = Record<string, string>;

// Each preset is light + dark color overrides, mirroring what a user editing
// theme.json would see. Applying one writes the overrides as inline
// --color-* custom properties on <html>, which is where every painted
// color resolves from, and switches the mode through the color-mode
// preference so the choice persists. Reset removes the properties so the
// values from theme.json (or the defaults) take over again. Both re-sync the
// browser's theme-color, since ColorModeSync only does that when the mode
// changes. The primary-* and on-primary* entries are the contrast tokens
// tokens.css computes from theme.json, computed for each preset by the CLI.
const PRESETS: Record<
  DemoThemeProps["variant"],
  { light: Palette; dark: Palette; label: string }
> = {
  purple: {
    label: "Purple",
    light: {
      primaryLight: "#c4b5fd",
      primary: "#8b5cf6",
      primaryDark: "#5b21b6",
      ${presetTextTokens("#8b5cf6", "#c4b5fd", "#5b21b6", "light")}
    },
    dark: {
      primaryLight: "#ddd6fe",
      primary: "#a78bfa",
      primaryDark: "#7c3aed",
      ${presetTextTokens("#a78bfa", "#ddd6fe", "#7c3aed", "dark")}
    },
  },
  green: {
    label: "Green",
    light: {
      primaryLight: "#86efac",
      primary: "#22c55e",
      primaryDark: "#15803d",
      ${presetTextTokens("#22c55e", "#86efac", "#15803d", "light")}
    },
    dark: {
      primaryLight: "#6ee7b7",
      primary: "#10b981",
      primaryDark: "#065f46",
      ${presetTextTokens("#10b981", "#6ee7b7", "#065f46", "dark")}
    },
  },
  yellow: {
    label: "Yellow",
    light: {
      primaryLight: "#fbbf24",
      primary: "#f59e0b",
      primaryDark: "#d97706",
      ${presetTextTokens("#f59e0b", "#fbbf24", "#d97706", "light")}
    },
    dark: {
      primaryLight: "#fed7aa",
      primary: "#fb923c",
      primaryDark: "#ea580c",
      ${presetTextTokens("#fb923c", "#fed7aa", "#ea580c", "dark")}
    },
  },
};

const PRESET_KEYS = [
  "primaryLight",
  "primary",
  "primaryDark",
  "primary-fill",
  "on-primary",
  "primary-fill-hover",
  "on-primary-hover",
  "primary-text",
  "primary-text-hover",
] as const;

function applyPresetVars(palette: Palette) {
  const root = document.documentElement;
  for (const key of PRESET_KEYS) {
    if (palette[key]) {
      root.style.setProperty(\`--color-\${key}\`, palette[key]);
    }
  }
  syncThemeColor();
}

function clearPresetVars() {
  const root = document.documentElement;
  for (const key of PRESET_KEYS) {
    root.style.removeProperty(\`--color-\${key}\`);
  }
  syncThemeColor();
}

// Points the theme-color meta at the primary now in force. Only the content
// of the existing tag changes: it is the one the root layout's blocking script
// wrote, the only form Safari tints its chrome from reliably.
function syncThemeColor() {
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]:not([media])',
  );
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-primary")
    .trim();
  if (meta && color && meta.content !== color) meta.content = color;
}

function DemoTheme({ variant }: DemoThemeProps) {
  const { setPreference } = useColorMode();
  const preset = PRESETS[variant];

  if (!preset) {
    return (
      <Columns cols={2}>
        <Button
          onClick={() => {
            clearPresetVars();
          }}
          fullWidth
        >
          Reset to Default
        </Button>
      </Columns>
    );
  }

  return (
    <Columns cols={2}>
      <Button
        onClick={() => {
          applyPresetVars(preset.light);
          setPreference("light");
        }}
        icon="sun"
        fullWidth
      >
        Demo {preset.label} Light
      </Button>
      <Button
        outline
        onClick={() => {
          applyPresetVars(preset.dark);
          setPreference("dark");
        }}
        icon="moon-star"
        fullWidth
      >
        Demo {preset.label} Dark
      </Button>
    </Columns>
  );
}

export { DemoTheme };
`;
