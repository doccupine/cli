export const demoThemeTemplate = `"use client";
import React from "react";
import { Button } from "@/components/layout/Button";
import { useThemeOverride } from "@/components/layout/ClientThemeProvider";
import { Theme, theme, themeDark } from "@/app/theme";
import { Columns } from "@/components/layout/Columns";

interface DemoThemeProps {
  variant: "purple" | "green" | "yellow";
}

function DemoTheme({ variant }: DemoThemeProps) {
  const { setTheme } = useThemeOverride();

  const purpleLight: Theme = {
    ...theme,
    colors: {
      primaryLight: "#c4b5fd",
      primary: "#8b5cf6",
      primaryDark: "#5b21b6",
      secondaryLight: "#86efac",
      secondary: "#22c55e",
      secondaryDark: "#15803d",
      tertiaryLight: "#fbbf24",
      tertiary: "#f59e0b",
      tertiaryDark: "#d97706",
      grayLight: "#f3f4f6",
      gray: "#9ca3af",
      grayDark: "#374151",
      success: "#10b981",
      error: "#f43f5e",
      warning: "#f59e0b",
      info: "#3b82f6",
      dark: "#000000",
      light: "#ffffff",
    },
  };

  const purpleDark: Theme = {
    ...themeDark,
    colors: {
      primaryLight: "#ddd6fe",
      primary: "#a78bfa",
      primaryDark: "#7c3aed",
      secondaryLight: "#6ee7b7",
      secondary: "#10b981",
      secondaryDark: "#065f46",
      tertiaryLight: "#fed7aa",
      tertiary: "#fb923c",
      tertiaryDark: "#ea580c",
      grayLight: "#1f2937",
      gray: "#6b7280",
      grayDark: "#9ca3af",
      success: "#10b981",
      error: "#f43f5e",
      warning: "#f59e0b",
      info: "#3b82f6",
      dark: "#ffffff",
      light: "#000000",
    },
  };

  const greenLight: Theme = {
    ...theme,
    colors: {
      primaryLight: "#86efac",
      primary: "#22c55e",
      primaryDark: "#15803d",
      secondaryLight: "#c4b5fd",
      secondary: "#8b5cf6",
      secondaryDark: "#5b21b6",
      tertiaryLight: "#fbbf24",
      tertiary: "#f59e0b",
      tertiaryDark: "#d97706",
      grayLight: "#f3f4f6",
      gray: "#9ca3af",
      grayDark: "#374151",
      success: "#10b981",
      error: "#f43f5e",
      warning: "#f59e0b",
      info: "#3b82f6",
      dark: "#000000",
      light: "#ffffff",
    },
  };

  const greenDark: Theme = {
    ...themeDark,
    colors: {
      primaryLight: "#6ee7b7",
      primary: "#10b981",
      primaryDark: "#065f46",
      secondaryLight: "#ddd6fe",
      secondary: "#a78bfa",
      secondaryDark: "#7c3aed",
      tertiaryLight: "#fed7aa",
      tertiary: "#fb923c",
      tertiaryDark: "#ea580c",
      grayLight: "#1f2937",
      gray: "#6b7280",
      grayDark: "#9ca3af",
      success: "#10b981",
      error: "#f43f5e",
      warning: "#f59e0b",
      info: "#3b82f6",
      dark: "#ffffff",
      light: "#000000",
    },
  };

  const yellowLight: Theme = {
    ...theme,
    colors: {
      primaryLight: "#fbbf24",
      primary: "#f59e0b",
      primaryDark: "#d97706",
      secondaryLight: "#c4b5fd",
      secondary: "#8b5cf6",
      secondaryDark: "#5b21b6",
      tertiaryLight: "#86efac",
      tertiary: "#22c55e",
      tertiaryDark: "#15803d",
      grayLight: "#f3f4f6",
      gray: "#9ca3af",
      grayDark: "#374151",
      success: "#10b981",
      error: "#f43f5e",
      warning: "#f59e0b",
      info: "#3b82f6",
      dark: "#000000",
      light: "#ffffff",
    },
  };

  const yellowDark: Theme = {
    ...themeDark,
    colors: {
      primaryLight: "#fed7aa",
      primary: "#fb923c",
      primaryDark: "#ea580c",
      secondaryLight: "#ddd6fe",
      secondary: "#a78bfa",
      secondaryDark: "#7c3aed",
      tertiaryLight: "#6ee7b7",
      tertiary: "#10b981",
      tertiaryDark: "#065f46",
      grayLight: "#1f2937",
      gray: "#6b7280",
      grayDark: "#9ca3af",
      success: "#10b981",
      error: "#f43f5e",
      warning: "#f59e0b",
      info: "#3b82f6",
      dark: "#ffffff",
      light: "#000000",
    },
  };

  if (variant === "purple") {
    return (
      <Columns cols={2}>
        <Button onClick={() => setTheme(purpleLight)} icon="sun" fullWidth>
          Demo Purple Light
        </Button>
        <Button
          outline
          onClick={() => setTheme(purpleDark)}
          icon="moon-star"
          fullWidth
        >
          Demo Purple Dark
        </Button>
      </Columns>
    );
  }

  if (variant === "green") {
    return (
      <Columns cols={2}>
        <Button onClick={() => setTheme(greenLight)} icon="sun" fullWidth>
          Demo Green Light
        </Button>
        <Button
          outline
          onClick={() => setTheme(greenDark)}
          icon="moon-star"
          fullWidth
        >
          Demo Green Dark
        </Button>
      </Columns>
    );
  }

  if (variant === "yellow") {
    return (
      <Columns cols={2}>
        <Button onClick={() => setTheme(yellowLight)} icon="sun" fullWidth>
          Demo Yellow Light
        </Button>
        <Button
          outline
          onClick={() => setTheme(yellowDark)}
          icon="moon-star"
          fullWidth
        >
          Demo Yellow Dark
        </Button>
      </Columns>
    );
  }

  return (
    <Columns cols={2}>
      <Button onClick={() => setTheme(null)} fullWidth>
        Reset to Default
      </Button>
    </Columns>
  );
}

export { DemoTheme };
`;
