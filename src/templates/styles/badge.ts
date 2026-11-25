import type { DesignStyles } from "./index.js";

// Badge (components/layout/Badge.tsx): a small label.
//
//   .dcp-badge                 the chip
//     data-size                xs | sm | md | lg
//     data-shape               rounded | pill
//     data-color               the color name (gray, blue, ..., info, error)
//     data-variant             filled | stroke | solid, resolved by the
//                              component from its stroke/solid props
//     data-mono                monospace, uppercase label (HTTP methods)
//     data-disabled            dimmed
//
// Variants are written `.dcp-badge:where([...])`, so every rule keeps the
// chip's own single-class specificity and a component that restyles a badge
// through its own class (the sidebar's method tag) wins with one class more.
//
// The color table below is generated from these palettes. The hex colors are
// label-semantic and independent of theme.json (as Callout's alert tints);
// the semantic colors (info, success, warning, error) and the surface
// variants read theme tokens, so they follow theme.json and the mode.

interface Swatch {
  background: string;
  text: string;
  border: string;
}

interface Pair {
  light: Swatch;
  dark: Swatch;
}

const swatch = (background: string, text: string, border: string): Swatch => ({
  background,
  text,
  border,
});

const same = (value: Swatch): Pair => ({ light: value, dark: value });

const surface: Pair = {
  light: swatch(
    "var(--color-light)",
    "var(--color-grayDark)",
    "var(--color-grayLight)",
  ),
  dark: swatch(
    "var(--color-light)",
    "var(--color-grayDark)",
    "var(--color-gray)",
  ),
};

// Strong fills; white and surface have no solid form and stay filled.
const SOLID: Record<string, string> = {
  gray: "#71717a",
  blue: "#3b82f6",
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
  purple: "#a855f7",
};

const STROKE: Record<string, Pair> = {
  gray: {
    light: swatch("transparent", "#52525b", "#a1a1aa"),
    dark: swatch("transparent", "#d4d4d8", "#71717a"),
  },
  blue: {
    light: swatch("transparent", "#1d4ed8", "#3b82f6"),
    dark: swatch("transparent", "#93c5fd", "#3b82f6"),
  },
  green: {
    light: swatch("transparent", "#15803d", "#22c55e"),
    dark: swatch("transparent", "#86efac", "#22c55e"),
  },
  yellow: {
    light: swatch("transparent", "#a16207", "#eab308"),
    dark: swatch("transparent", "#fde047", "#eab308"),
  },
  orange: {
    light: swatch("transparent", "#c2410c", "#f97316"),
    dark: swatch("transparent", "#fdba74", "#f97316"),
  },
  red: {
    light: swatch("transparent", "#b91c1c", "#ef4444"),
    dark: swatch("transparent", "#fca5a5", "#ef4444"),
  },
  purple: {
    light: swatch("transparent", "#7e22ce", "#a855f7"),
    dark: swatch("transparent", "#d8b4fe", "#a855f7"),
  },
  white: {
    light: swatch("transparent", "#18181b", "#e4e4e7"),
    dark: swatch("transparent", "#fafafa", "#3f3f46"),
  },
  surface: {
    light: { ...surface.light, background: "transparent" },
    dark: { ...surface.dark, background: "transparent" },
  },
  "white-destructive": {
    light: swatch("transparent", "#b91c1c", "#ef4444"),
    dark: swatch("transparent", "#fca5a5", "#ef4444"),
  },
  "surface-destructive": {
    light: swatch("transparent", "#b91c1c", "#ef4444"),
    dark: swatch("transparent", "#fca5a5", "#ef4444"),
  },
};

const FILLED: Record<string, Pair> = {
  gray: {
    light: swatch("#f4f4f5", "#3f3f46", "transparent"),
    dark: swatch("#71717a33", "#d4d4d8", "transparent"),
  },
  blue: {
    light: swatch("#dbeafe", "#1e40af", "transparent"),
    dark: swatch("#3b82f633", "#93c5fd", "transparent"),
  },
  green: {
    light: swatch("#dcfce7", "#166534", "transparent"),
    dark: swatch("#22c55e33", "#86efac", "transparent"),
  },
  yellow: {
    light: swatch("#fef9c3", "#854d0e", "transparent"),
    dark: swatch("#eab30833", "#fde047", "transparent"),
  },
  orange: {
    light: swatch("#ffedd5", "#9a3412", "transparent"),
    dark: swatch("#f9731633", "#fdba74", "transparent"),
  },
  red: {
    light: swatch("#fee2e2", "#991b1b", "transparent"),
    dark: swatch("#ef444433", "#fca5a5", "transparent"),
  },
  purple: {
    light: swatch("#f3e8ff", "#6b21a8", "transparent"),
    dark: swatch("#a855f733", "#d8b4fe", "transparent"),
  },
  // Literally white in both modes, so it stays legible on images, colored
  // frames and hero areas. The surface variants follow the mode.
  white: same(swatch("#ffffff", "#18181b", "#e4e4e7")),
  surface,
  "white-destructive": same(swatch("#ffffff", "#b91c1c", "#fecaca")),
  "surface-destructive": {
    light: { ...surface.light, text: "#b91c1c", border: "#fecaca" },
    dark: { ...surface.dark, text: "#fca5a5", border: "#ef444466" },
  },
};

const TOKENS = ["info", "success", "warning", "error"];

function tokenPalettes(token: string): Record<string, Pair> {
  const value = `var(--color-${token})`;
  return {
    solid: same(swatch(value, "var(--color-surface)", "transparent")),
    stroke: same(swatch("transparent", value, value)),
    filled: same(
      swatch(
        `color-mix(in srgb, ${value} 15%, transparent)`,
        value,
        "transparent",
      ),
    ),
  };
}

/** `:root.dark <selector> {` as Prettier prints it inside the layer block. */
function darkSelector(attributes: string): string {
  const target = `.dcp-badge:where(${attributes})`;
  if (`  :root.dark ${target} {`.length <= 80) return `:root.dark ${target} {`;
  if (`    ${target} {`.length <= 80) return `:root.dark\n  ${target} {`;
  return `:root.dark\n  .dcp-badge:where(\n    ${attributes}\n  ) {`;
}

function colorRules(color: string, variant: string, pair: Pair): string {
  const attributes = `[data-color="${color}"][data-variant="${variant}"]`;
  const target = `.dcp-badge:where(${attributes})`;
  return `${target} {
  background: ${pair.light.background};
  color: ${pair.light.text};
  border: solid 1px ${pair.light.border};
}

${darkSelector(attributes)}
  background: ${pair.dark.background};
  color: ${pair.dark.text};
  border-color: ${pair.dark.border};
}`;
}

const palettes: string[] = [];
for (const color of Object.keys(FILLED)) {
  palettes.push(colorRules(color, "filled", FILLED[color]));
  palettes.push(colorRules(color, "stroke", STROKE[color]));
  const solid = SOLID[color];
  if (solid) {
    palettes.push(
      colorRules(color, "solid", same(swatch(solid, "#ffffff", "transparent"))),
    );
  }
}
for (const token of TOKENS) {
  for (const [variant, pair] of Object.entries(tokenPalettes(token))) {
    palettes.push(colorRules(token, variant, pair));
  }
}

/** The hex colors that have a solid form (the component reads this list). */
export const BADGE_SOLID_COLORS = Object.keys(SOLID);

// The article's ".lucide" rule (docs.ts) lives in the design layer, so the
// chip's icon color restates it there.
const icon = `.dcp-badge svg.lucide {
  flex-shrink: 0;
  color: inherit;
}`;

export const badgeStyles: DesignStyles = {
  shared: `.dcp-badge {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  max-width: max-content;
  font-family: inherit;
  font-weight: 600;
  white-space: nowrap;
}

${icon}

.dcp-badge:where([data-size="xs"]) {
  font-size: 11px;
  line-height: 16px;
  padding: 1px 6px;
  gap: 3px;
}

.dcp-badge:where([data-size="sm"]) {
  font-size: 12px;
  line-height: 18px;
  padding: 2px 8px;
  gap: 4px;
}

.dcp-badge:where([data-size="md"]) {
  font-size: 13px;
  line-height: 20px;
  padding: 3px 10px;
  gap: 5px;
}

.dcp-badge:where([data-size="lg"]) {
  font-size: 14px;
  line-height: 22px;
  padding: 4px 12px;
  gap: 6px;
}

.dcp-badge:where([data-mono]) {
  font-family: "Roboto Mono", monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dcp-badge:where([data-shape="rounded"]) {
  border-radius: 6px;
}

.dcp-badge:where([data-shape="pill"]) {
  border-radius: 999px;
}

${palettes.join("\n\n")}

.dcp-badge:where([data-disabled]) {
  opacity: 0.5;
}`,
  classic: icon,
  modern: icon,
};
