export const demoThemeTemplate = `"use client";
import { useContext } from "react";
import { useTheme } from "styled-components";
import { ThemeContext } from "cherry-styled-components";
import {
  buildColors,
  colorsLight,
  colorsDark,
  theme,
  themeDark,
  Theme,
} from "@/app/theme";
import { Button } from "@/components/layout/Button";
import { Columns } from "@/components/layout/Columns";

interface DemoThemeProps {
  variant: "purple" | "green" | "yellow";
}

type Palette = Record<string, string>;

// Each preset is light + dark color overrides, mirroring what a user editing
// theme.json would see. Applying one does two things: swaps in a theme object
// rebuilt with the overridden palette (Cherry's setTheme, which also persists
// the mode), and mirrors the overrides onto the --color-* CSS custom
// properties on <html> for the plain-CSS consumers that read variables
// (e.g. Callout's and Code's :root.dark blocks). Reset clears both so the
// defaults take over again.
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
    },
    dark: {
      primaryLight: "#ddd6fe",
      primary: "#a78bfa",
      primaryDark: "#7c3aed",
    },
  },
  green: {
    label: "Green",
    light: {
      primaryLight: "#86efac",
      primary: "#22c55e",
      primaryDark: "#15803d",
    },
    dark: {
      primaryLight: "#6ee7b7",
      primary: "#10b981",
      primaryDark: "#065f46",
    },
  },
  yellow: {
    label: "Yellow",
    light: {
      primaryLight: "#fbbf24",
      primary: "#f59e0b",
      primaryDark: "#d97706",
    },
    dark: {
      primaryLight: "#fed7aa",
      primary: "#fb923c",
      primaryDark: "#ea580c",
    },
  },
};

const PRESET_KEYS = ["primaryLight", "primary", "primaryDark"] as const;

function applyPresetVars(palette: Palette) {
  const root = document.documentElement;
  for (const key of PRESET_KEYS) {
    if (palette[key]) root.style.setProperty(\`--color-\${key}\`, palette[key]);
  }
}

function clearPresetVars() {
  const root = document.documentElement;
  for (const key of PRESET_KEYS) {
    root.style.removeProperty(\`--color-\${key}\`);
  }
}

// Rebuilds a mode's theme with the preset palette merged in, so the semantic
// tokens (accent, accentStrong, …) derive from the preset colors exactly like
// they would from a theme.json override.
function presetTheme(palette: Palette, dark: boolean): Theme {
  const base = dark ? themeDark : theme;
  const paletteBase = dark ? colorsDark : colorsLight;
  return {
    ...base,
    colors: buildColors({ ...paletteBase, ...palette }, dark),
  };
}

function DemoTheme({ variant }: DemoThemeProps) {
  const { setTheme } = useContext(ThemeContext);
  const activeTheme = useTheme() as Theme;
  const preset = PRESETS[variant];

  if (!preset) {
    return (
      <Columns cols={2}>
        <Button
          onClick={() => {
            clearPresetVars();
            setTheme(activeTheme.isDark ? themeDark : theme);
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
          setTheme(presetTheme(preset.light, false));
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
          setTheme(presetTheme(preset.dark, true));
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
