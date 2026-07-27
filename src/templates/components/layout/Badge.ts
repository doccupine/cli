export const badgeTemplate = `"use client";
import styled, { css } from "styled-components";
import { Theme } from "@/app/theme";
import { Icon } from "@/components/layout/Icon";

type BadgeColor =
  | "gray"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "purple"
  | "white"
  | "surface"
  | "white-destructive"
  | "surface-destructive"
  | "info"
  | "success"
  | "warning"
  | "error";

type BadgeSize = "xs" | "sm" | "md" | "lg";

type BadgeShape = "rounded" | "pill";

// The semantic colors read theme tokens instead of the fixed palette, so
// they follow theme.json and the light/dark toggle. They are also what the
// HTTP method chips use.
const THEME_TOKEN_COLORS = ["info", "success", "warning", "error"] as const;

type ThemeTokenColor = (typeof THEME_TOKEN_COLORS)[number];

type HexBadgeColor = Exclude<BadgeColor, ThemeTokenColor>;

function isThemeTokenColor(color: BadgeColor): color is ThemeTokenColor {
  return (THEME_TOKEN_COLORS as readonly string[]).includes(color);
}

// Single source for verb -> badge color, shared by the sidebar method tags
// and the API playground so every surface colors HTTP verbs identically.
const HTTP_METHOD_COLORS: Record<string, BadgeColor> = {
  get: "info",
  post: "success",
  put: "warning",
  patch: "warning",
  delete: "error",
  head: "gray",
  options: "gray",
  trace: "gray",
};

function httpMethodBadgeColor(method: string): BadgeColor {
  return HTTP_METHOD_COLORS[method.toLowerCase()] ?? "gray";
}

interface BadgePalette {
  background: string;
  text: string;
  border: string;
  darkBackground: string;
  darkText: string;
  darkBorder: string;
}

// Strong fills for the hex palette; the white and surface variants have no
// distinct solid form and fall back to their filled palette.
const SOLID_ACCENTS: Partial<Record<HexBadgeColor, string>> = {
  gray: "#71717a",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
  purple: "#a855f7",
};

// Color tints are label-semantic and intentionally independent of theme.json
// (same rationale as Callout's alert tints); only the surface and semantic
// token variants read theme tokens, so they follow the active theme on both
// modes. When both are set, solid wins over stroke.
function badgePalette(
  theme: Theme,
  color: BadgeColor,
  stroke: boolean,
  solid: boolean,
): BadgePalette {
  if (isThemeTokenColor(color)) {
    const token = theme.colors[color];
    if (solid) {
      return {
        background: token,
        text: theme.colors.surface,
        border: "transparent",
        darkBackground: token,
        darkText: theme.colors.surface,
        darkBorder: "transparent",
      };
    }
    if (stroke) {
      return {
        background: "transparent",
        text: token,
        border: token,
        darkBackground: "transparent",
        darkText: token,
        darkBorder: token,
      };
    }
    const tint = \`color-mix(in srgb, \${token} 15%, transparent)\`;
    return {
      background: tint,
      text: token,
      border: "transparent",
      darkBackground: tint,
      darkText: token,
      darkBorder: "transparent",
    };
  }

  const solidAccent = SOLID_ACCENTS[color];
  if (solid && solidAccent) {
    return {
      background: solidAccent,
      text: "#ffffff",
      border: "transparent",
      darkBackground: solidAccent,
      darkText: "#ffffff",
      darkBorder: "transparent",
    };
  }

  const surface = {
    background: theme.colors.surface,
    text: theme.colors.grayDark,
    border: theme.colors.grayLight,
    darkBackground: theme.colors.surface,
    darkText: theme.colors.grayDark,
    darkBorder: theme.colors.grayLight,
  };

  if (stroke && !solid) {
    const strokes: Record<HexBadgeColor, BadgePalette> = {
      gray: {
        background: "transparent",
        text: "#52525b",
        border: "#a1a1aa",
        darkBackground: "transparent",
        darkText: "#d4d4d8",
        darkBorder: "#71717a",
      },
      blue: {
        background: "transparent",
        text: "#1d4ed8",
        border: "#3b82f6",
        darkBackground: "transparent",
        darkText: "#93c5fd",
        darkBorder: "#3b82f6",
      },
      green: {
        background: "transparent",
        text: "#15803d",
        border: "#22c55e",
        darkBackground: "transparent",
        darkText: "#86efac",
        darkBorder: "#22c55e",
      },
      yellow: {
        background: "transparent",
        text: "#a16207",
        border: "#eab308",
        darkBackground: "transparent",
        darkText: "#fde047",
        darkBorder: "#eab308",
      },
      orange: {
        background: "transparent",
        text: "#c2410c",
        border: "#f97316",
        darkBackground: "transparent",
        darkText: "#fdba74",
        darkBorder: "#f97316",
      },
      red: {
        background: "transparent",
        text: "#b91c1c",
        border: "#ef4444",
        darkBackground: "transparent",
        darkText: "#fca5a5",
        darkBorder: "#ef4444",
      },
      purple: {
        background: "transparent",
        text: "#7e22ce",
        border: "#a855f7",
        darkBackground: "transparent",
        darkText: "#d8b4fe",
        darkBorder: "#a855f7",
      },
      white: {
        background: "transparent",
        text: "#18181b",
        border: "#e4e4e7",
        darkBackground: "transparent",
        darkText: "#fafafa",
        darkBorder: "#3f3f46",
      },
      surface: { ...surface, background: "transparent" },
      "white-destructive": {
        background: "transparent",
        text: "#b91c1c",
        border: "#ef4444",
        darkBackground: "transparent",
        darkText: "#fca5a5",
        darkBorder: "#ef4444",
      },
      "surface-destructive": {
        background: "transparent",
        text: "#b91c1c",
        border: "#ef4444",
        darkBackground: "transparent",
        darkText: "#fca5a5",
        darkBorder: "#ef4444",
      },
    };
    return strokes[color];
  }

  const filled: Record<HexBadgeColor, BadgePalette> = {
    gray: {
      background: "#f4f4f5",
      text: "#3f3f46",
      border: "transparent",
      darkBackground: "#71717a33",
      darkText: "#d4d4d8",
      darkBorder: "transparent",
    },
    blue: {
      background: "#dbeafe",
      text: "#1e40af",
      border: "transparent",
      darkBackground: "#3b82f633",
      darkText: "#93c5fd",
      darkBorder: "transparent",
    },
    green: {
      background: "#dcfce7",
      text: "#166534",
      border: "transparent",
      darkBackground: "#22c55e33",
      darkText: "#86efac",
      darkBorder: "transparent",
    },
    yellow: {
      background: "#fef9c3",
      text: "#854d0e",
      border: "transparent",
      darkBackground: "#eab30833",
      darkText: "#fde047",
      darkBorder: "transparent",
    },
    orange: {
      background: "#ffedd5",
      text: "#9a3412",
      border: "transparent",
      darkBackground: "#f9731633",
      darkText: "#fdba74",
      darkBorder: "transparent",
    },
    red: {
      background: "#fee2e2",
      text: "#991b1b",
      border: "transparent",
      darkBackground: "#ef444433",
      darkText: "#fca5a5",
      darkBorder: "transparent",
    },
    purple: {
      background: "#f3e8ff",
      text: "#6b21a8",
      border: "transparent",
      darkBackground: "#a855f733",
      darkText: "#d8b4fe",
      darkBorder: "transparent",
    },
    white: {
      background: "#ffffff",
      text: "#18181b",
      border: "#e4e4e7",
      darkBackground: "#ffffff",
      darkText: "#18181b",
      darkBorder: "#e4e4e7",
    },
    surface,
    "white-destructive": {
      background: "#ffffff",
      text: "#b91c1c",
      border: "#fecaca",
      darkBackground: "#ffffff",
      darkText: "#b91c1c",
      darkBorder: "#fecaca",
    },
    "surface-destructive": {
      ...surface,
      text: "#b91c1c",
      border: "#fecaca",
      darkText: "#fca5a5",
      darkBorder: "#ef44444d",
    },
  };
  return filled[color];
}

const badgeSizes = {
  xs: css\`
    font-size: 11px;
    line-height: 16px;
    padding: 1px 6px;
    gap: 3px;
  \`,
  sm: css\`
    font-size: 12px;
    line-height: 18px;
    padding: 2px 8px;
    gap: 4px;
  \`,
  md: css\`
    font-size: 13px;
    line-height: 20px;
    padding: 3px 10px;
    gap: 5px;
  \`,
  lg: css\`
    font-size: 14px;
    line-height: 22px;
    padding: 4px 12px;
    gap: 6px;
  \`,
};

const badgeIconSizes: Record<BadgeSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
};

const StyledBadge = styled.span<{
  theme: Theme;
  $color: BadgeColor;
  $size: BadgeSize;
  $shape: BadgeShape;
  $stroke: boolean;
  $solid: boolean;
  $mono: boolean;
  $disabled: boolean;
}>\`
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  max-width: max-content;
  font-family: inherit;
  font-weight: 600;
  white-space: nowrap;

  & svg.lucide {
    flex-shrink: 0;
    color: inherit;
  }

  \${({ $size }) => badgeSizes[$size]}

  \${({ theme, $mono }) =>
    $mono &&
    css\`
      font-family: \${theme.fonts.mono};
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    \`}

  \${({ theme, $shape }) =>
    $shape === "pill"
      ? css\`
          border-radius: 999px;
        \`
      : css\`
          border-radius: \${theme.spacing.radius.xs};
        \`}

  \${({ theme, $color, $stroke, $solid }) => {
    const palette = badgePalette(theme, $color, $stroke, $solid);
    return css\`
      background: \${palette.background};
      color: \${palette.text};
      border: solid 1px \${palette.border};

      :root.dark & {
        background: \${palette.darkBackground};
        color: \${palette.darkText};
        border-color: \${palette.darkBorder};
      }
    \`;
  }}

  \${({ $disabled }) =>
    $disabled &&
    css\`
      opacity: 0.5;
    \`}
\`;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  shape?: BadgeShape;
  icon?: string;
  stroke?: boolean;
  solid?: boolean;
  mono?: boolean;
  disabled?: boolean;
}

function Badge({
  children,
  color = "gray",
  size = "md",
  shape = "rounded",
  icon,
  stroke = false,
  solid = false,
  mono = false,
  disabled = false,
  className,
}: BadgeProps) {
  return (
    <StyledBadge
      className={className}
      $color={color}
      $size={size}
      $shape={shape}
      $stroke={stroke}
      $solid={solid}
      $mono={mono}
      $disabled={disabled}
    >
      {icon ? <Icon name={icon} size={badgeIconSizes[size]} /> : null}
      {children}
    </StyledBadge>
  );
}

export { Badge, httpMethodBadgeColor };
`;
