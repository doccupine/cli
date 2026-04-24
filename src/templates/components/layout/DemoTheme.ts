export const demoThemeTemplate = `"use client";
import { Button } from "@/components/layout/Button";
import { useThemeOverride } from "@/components/layout/ClientThemeProvider";
import { Columns } from "@/components/layout/Columns";

interface DemoThemeProps {
  variant: "purple" | "green" | "yellow";
}

type Palette = Record<string, string>;

// Each preset is light + dark color overrides applied directly to CSS custom
// properties on <html>. This mirrors what a user editing theme.json would see:
// the variable names are identical, the variables flip light vs dark via the
// "dark" class on <html>, and Reset clears the overrides so the defaults take
// over again.
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

function applyPreset(palette: Palette) {
  const root = document.documentElement;
  for (const key of PRESET_KEYS) {
    if (palette[key]) root.style.setProperty(\`--color-\${key}\`, palette[key]);
  }
}

function clearPreset() {
  const root = document.documentElement;
  for (const key of PRESET_KEYS) {
    root.style.removeProperty(\`--color-\${key}\`);
  }
}

function DemoTheme({ variant }: DemoThemeProps) {
  const { setMode } = useThemeOverride();
  const preset = PRESETS[variant];

  if (!preset) {
    return (
      <Columns cols={2}>
        <Button onClick={() => clearPreset()} fullWidth>
          Reset to Default
        </Button>
      </Columns>
    );
  }

  return (
    <Columns cols={2}>
      <Button
        onClick={() => {
          applyPreset(preset.light);
          setMode("light");
        }}
        icon="sun"
        fullWidth
      >
        Demo {preset.label} Light
      </Button>
      <Button
        outline
        onClick={() => {
          applyPreset(preset.dark);
          setMode("dark");
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
