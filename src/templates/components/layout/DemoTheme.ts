export const demoThemeTemplate = `"use client";
import { useContext } from "react";
import { useTheme } from "styled-components";
import { ThemeContext } from "cherry-styled-components";
import { theme, themeDark, Theme } from "@/app/theme";
import { Button } from "@/components/layout/Button";
import { Columns } from "@/components/layout/Columns";

interface DemoThemeProps {
  variant: "purple" | "green" | "yellow";
}

type Palette = Record<string, string>;

// Each preset is light + dark color overrides, mirroring what a user editing
// theme.json would see. Applying one does two things: writes the overrides as
// --color-* custom properties on <html>, which is where every painted color
// resolves from, and switches the mode through Cherry's setTheme so the choice
// persists and the "dark" class follows. Reset removes the properties so the
// values from theme.json (or the defaults) take over again.
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
          setTheme(theme);
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
          setTheme(themeDark);
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
