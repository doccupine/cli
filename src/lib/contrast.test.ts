import { describe, expect, it } from "vitest";
import {
  CONTRAST_KEYS,
  contrastRatio,
  contrastTokens,
  fillFor,
  MAX_FILL_SHIFT,
  toHex,
  ensureContrast,
  mixRgb,
  parseColor,
  pickOnColor,
  relativeLuminance,
  tint,
  type Rgb,
} from "./contrast.js";
import { tokensCssTemplate } from "../templates/styles/tokens.js";

const rgb = (color: string) => parseColor(color) as Rgb;
const ratio = (a: string, b: string) => contrastRatio(rgb(a), rgb(b));

/** The value of `--name` in a mode block of tokens.css. */
function token(css: string, mode: "light" | "dark", name: string): string {
  const block = css.split(":root.dark {")[mode === "light" ? 0 : 1];
  const match = block.match(new RegExp(`--${name}: ([^;]+);`));
  if (!match) throw new Error(`--${name} missing from the ${mode} block`);
  return match[1];
}

describe("contrast helpers", () => {
  it("parses plain sRGB colors and rejects the rest", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("#2563EB")).toEqual([37, 99, 235]);
    expect(parseColor("#2563eb80")).toEqual([37, 99, 235]);
    expect(parseColor("rgb(37, 99, 235)")).toEqual([37, 99, 235]);
    expect(parseColor("rgba(37 99 235 / 0.5)")).toEqual([37, 99, 235]);
    expect(parseColor("rgb(100%, 0%, 0%)")).toEqual([255, 0, 0]);
    expect(parseColor("hsl(0, 100%, 50%)")).toEqual([255, 0, 0]);
    expect(parseColor("hsl(120 100% 25%)")).toEqual([0, 127.5, 0]);
    expect(parseColor("white")).toEqual([255, 255, 255]);
    expect(parseColor("oklch(0.6 0.2 250)")).toBeNull();
    expect(parseColor("color-mix(in srgb, red 50%, blue)")).toBeNull();
    expect(parseColor("#12345")).toBeNull();
  });

  it("computes WCAG relative luminance", () => {
    expect(relativeLuminance([255, 255, 255])).toBe(1);
    expect(relativeLuminance([0, 0, 0])).toBe(0);
    expect(relativeLuminance(rgb("#808080"))).toBeCloseTo(0.2159, 4);
    expect(relativeLuminance(rgb("#ff0000"))).toBeCloseTo(0.2126, 4);
  });

  it("computes WCAG contrast ratios for known pairs", () => {
    expect(ratio("#ffffff", "#000000")).toBe(21);
    expect(ratio("#000000", "#ffffff")).toBe(21);
    expect(ratio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
    expect(ratio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(ratio("#2563eb", "#ffffff")).toBeCloseTo(5.17, 2);
    expect(ratio("#9ca3af", "#ffffff")).toBeCloseTo(2.54, 2);
    expect(ratio("#ffffff", "#1e7ae0")).toBeCloseTo(4.27, 2);
  });

  it("mixes in sRGB as color-mix() does", () => {
    expect(mixRgb([255, 255, 255], [0, 0, 0], 0.2)).toEqual([51, 51, 51]);
    expect(tint("#f43f5e", 0.2, "#ffffff")).toBe("#fdd9df");
  });

  it("picks the first text color that passes on a fill, else the best", () => {
    const candidates = ["#ffffff", "#000000"];
    expect(pickOnColor("#2563eb", candidates)).toBe("#ffffff");
    expect(pickOnColor("#1e7ae0", candidates)).toBe("#000000");
    expect(pickOnColor("#facc15", candidates)).toBe("#000000");
    // Neither passes on mid-gray: the higher ratio wins.
    expect(pickOnColor("#777777", ["#ffffff", "#333333"])).toBe("#ffffff");
    expect(pickOnColor("lab(50% 0 0)", candidates)).toBeNull();
  });

  it("keeps a passing color and moves a failing one just far enough", () => {
    expect(ensureContrast("#2563eb", "#000000", ["#ffffff"])).toBe("#2563eb");

    const muted = ensureContrast("#9ca3af", "#000000", ["#ffffff"]) as string;
    expect(ratio(muted, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    // Just enough: the first 1% step that passes stays close to 4.5.
    expect(ratio(muted, "#ffffff")).toBeLessThan(4.7);

    // Against several backgrounds, the worst one decides.
    const onTint = ensureContrast("#f43f5e", "#000000", [
      "#ffffff",
      "#fdd9df",
    ]) as string;
    expect(ratio(onTint, "#fdd9df")).toBeGreaterThanOrEqual(4.5);
    expect(ratio(onTint, "#ffffff")).toBeGreaterThanOrEqual(4.5);

    // Lightening on a dark page works the same way.
    const dark = ensureContrast("#1e7ae0", "#ffffff", [
      "#000000",
      "#1f2833",
    ]) as string;
    expect(ratio(dark, "#1f2833")).toBeGreaterThanOrEqual(4.5);

    expect(ensureContrast("oklch(0.6 0.2 250)", "#000", ["#fff"])).toBeNull();
  });
});

describe("fillFor", () => {
  it("keeps a fill white already reads on", () => {
    expect(fillFor("#2563eb")).toEqual({ fill: "#2563eb", on: "#ffffff" });
    expect(fillFor("#71717a")).toEqual({ fill: "#71717a", on: "#ffffff" });
  });

  it("nudges a fill toward black, within the cap, until white passes", () => {
    for (const [color, expected] of [
      ["#1e7ae0", "#1d76d9"],
      ["#3b82f6", "#3472d8"],
      ["#ef4444", "#d73d3d"],
      ["#a855f7", "#9b4ee3"],
      ["#f43f5e", "#d93854"],
    ]) {
      const pair = fillFor(color);
      expect(pair).toEqual({ fill: expected, on: "#ffffff" });
      expect(ratio("#ffffff", expected)).toBeGreaterThanOrEqual(4.5);
      // The first passing step: one 1% step less still falls short.
      const step = [...Array(101).keys()].find(
        (k) => toHex(mixRgb(rgb("#000000"), rgb(color), k / 100)) === expected,
      ) as number;
      expect(step).toBeGreaterThan(0);
      expect(step / 100).toBeLessThanOrEqual(MAX_FILL_SHIFT);
      const previous = toHex(
        mixRgb(rgb("#000000"), rgb(color), (step - 1) / 100),
      );
      expect(ratio("#ffffff", previous)).toBeLessThan(4.5);
    }
  });

  it("keeps the color with a dark label when white needs more than the cap", () => {
    // White would need 24% to 37% of black on these.
    for (const color of ["#f59e0b", "#22c55e", "#eab308", "#f97316"]) {
      expect(fillFor(color)).toEqual({ fill: color, on: "#18181b" });
      expect(ratio("#18181b", color)).toBeGreaterThanOrEqual(4.5);
    }
    // The palette's own near-black goes first.
    expect(fillFor("#a78bfa", "#000000")).toEqual({
      fill: "#a78bfa",
      on: "#000000",
    });
    expect(fillFor("oklch(0.9 0.1 90)")).toBeNull();
  });
});

describe("contrast tokens in tokens.css", () => {
  const docsTheme = JSON.stringify({
    default: {
      primaryLight: "#93c5fd",
      primary: "#2563eb",
      gray: "#9ca3af",
      grayLight: "#f3f4f6",
      error: "#f43f5e",
    },
    dark: {
      primaryLight: "#9bcaff",
      primary: "#1e7ae0",
      gray: "#6b7280",
      grayLight: "#1f2937",
    },
  });

  it("emits fill and label pairs, base and hover, that pass AA", () => {
    const { css } = tokensCssTemplate(docsTheme);
    // White on #2563eb is 5.17:1: kept.
    expect(token(css, "light", "color-primary-fill")).toBe("#2563eb");
    // White on #1e7ae0 is 4.27:1: nudged 3%.
    expect(token(css, "dark", "color-primary-fill")).toBe("#1d76d9");
    for (const mode of ["light", "dark"] as const) {
      const page = token(css, mode, "color-light");
      for (const key of CONTRAST_KEYS) {
        for (const suffix of ["", "-hover"]) {
          const fill = token(css, mode, `color-${key}-fill${suffix}`);
          const on = token(css, mode, `color-on-${key}${suffix}`);
          expect(ratio(on, fill)).toBeGreaterThanOrEqual(4.5);
        }
        const textHover = token(css, mode, `color-${key}-text-hover`);
        expect(ratio(textHover, page)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("emits text colors that pass on the page and their own tint", () => {
    const { css } = tokensCssTemplate(docsTheme);
    for (const mode of ["light", "dark"] as const) {
      const page = token(css, mode, "color-light");
      const muted = token(css, mode, "color-text-muted");
      expect(ratio(muted, page)).toBeGreaterThanOrEqual(4.5);
      for (const key of ["success", "warning", "error", "info"]) {
        const color = token(css, mode, `color-${key}`);
        const text = token(css, mode, `color-${key}-text`);
        expect(ratio(text, page)).toBeGreaterThanOrEqual(4.5);
        expect(
          ratio(text, tint(color, 0.2, page) as string),
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
    // Already passing: written unchanged.
    expect(token(css, "light", "color-primary-text")).toBe("#2563eb");
    expect(token(css, "light", "color-link")).toBe("var(--color-primary-text)");
  });

  it("adapts to a palette white text cannot read on", () => {
    const { css } = tokensCssTemplate(
      JSON.stringify({ default: { primary: "#facc15", success: "#4ade80" } }),
    );
    expect(token(css, "light", "color-primary-fill")).toBe("#facc15");
    expect(token(css, "light", "color-on-primary")).toBe("#000000");
    expect(token(css, "light", "color-on-success")).toBe("#000000");
    const text = token(css, "light", "color-primary-text");
    expect(ratio(text, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("falls back to the previous colors for values it cannot read", () => {
    const { css } = tokensCssTemplate(
      JSON.stringify({ default: { primary: "oklch(0.6 0.2 250)" } }),
    );
    expect(token(css, "light", "color-on-primary")).toBe(
      "var(--color-onFilled)",
    );
    expect(token(css, "light", "color-primary-fill")).toBe(
      "var(--color-primary)",
    );
    expect(token(css, "light", "color-primary-text")).toBe(
      "var(--color-primary)",
    );
  });
});

// docs.doccupine.com's theme.json: the reference values doccupine.com's copy
// of this module must produce too.
const DOCS_LIGHT = {
  primaryLight: "#93c5fd",
  primary: "#2563eb",
  primaryDark: "#1e40af",
  secondary: "#8b5cf6",
  secondaryDark: "#5b21b6",
  tertiary: "#f59e0b",
  tertiaryDark: "#d97706",
  grayLight: "#f3f4f6",
  gray: "#9ca3af",
  success: "#10b981",
  error: "#f43f5e",
  warning: "#f59e0b",
  info: "#3b82f6",
  dark: "#000000",
  light: "#ffffff",
};
const DOCS_DARK = {
  primaryLight: "#9bcaff",
  primary: "#1e7ae0",
  primaryDark: "#033d7e",
  secondary: "#a78bfa",
  secondaryDark: "#7c3aed",
  tertiary: "#fb923c",
  tertiaryDark: "#ea580c",
  grayLight: "#1f2937",
  gray: "#6b7280",
  success: "#10b981",
  error: "#f43f5e",
  warning: "#f59e0b",
  info: "#3b82f6",
  dark: "#ffffff",
  light: "#000000",
};

describe("contrastTokens", () => {
  it("produces the reference values for the docs.doccupine.com theme", () => {
    expect(Object.fromEntries(contrastTokens(DOCS_LIGHT))).toEqual(
      GOLDEN_LIGHT,
    );
    expect(Object.fromEntries(contrastTokens(DOCS_DARK))).toEqual(GOLDEN_DARK);
  });

  it("uses the given fallbacks for colors it cannot read", () => {
    const tokens = Object.fromEntries(
      contrastTokens(
        { ...DOCS_LIGHT, primary: "oklch(0.6 0.2 250)" },
        {
          fill: (key) => `var(--${key}-fill)`,
          on: () => "#fff",
          text: (key) => `var(--${key})`,
        },
      ),
    );
    expect(tokens["primary-fill"]).toBe("var(--primary-fill)");
    expect(tokens["on-primary"]).toBe("#fff");
    expect(tokens["primary-text"]).toBe("var(--primary)");
  });
});

// Pinned reference values for the docs theme (the tests above check that
// every pair passes AA). A change here changes every generated site and
// doccupine.com, which copies this module.
const GOLDEN_LIGHT: Record<string, string> = {
  "primary-fill": "#2563eb",
  "secondary-fill": "#8558ec",
  "tertiary-fill": "#f59e0b",
  "success-fill": "#10b981",
  "warning-fill": "#f59e0b",
  "error-fill": "#d93854",
  "info-fill": "#3472d8",
  "on-primary": "#ffffff",
  "on-secondary": "#ffffff",
  "on-tertiary": "#000000",
  "on-success": "#000000",
  "on-warning": "#000000",
  "on-error": "#ffffff",
  "on-info": "#ffffff",
  "primary-fill-hover": "#1e40af",
  "secondary-fill-hover": "#5b21b6",
  "tertiary-fill-hover": "#d97706",
  "success-fill-hover": "#0ea774",
  "warning-fill-hover": "#dd8e0a",
  "error-fill-hover": "#c3324c",
  "info-fill-hover": "#2f67c2",
  "on-primary-hover": "#ffffff",
  "on-secondary-hover": "#ffffff",
  "on-tertiary-hover": "#000000",
  "on-success-hover": "#000000",
  "on-warning-hover": "#000000",
  "on-error-hover": "#ffffff",
  "on-info-hover": "#ffffff",
  "primary-text-hover": "#1e40af",
  "secondary-text-hover": "#5b21b6",
  "tertiary-text-hover": "#b26205",
  "success-text-hover": "#0b875e",
  "warning-text-hover": "#a46907",
  "error-text-hover": "#c3324c",
  "info-text-hover": "#2f67c2",
  "primary-text": "#2563eb",
  "secondary-text": "#724bca",
  "tertiary-text": "#956007",
  "success-text": "#0a7854",
  "warning-text": "#956007",
  "error-text": "#b93047",
  "info-text": "#2d64bd",
  "text-muted": "#6a6f77",
};
const GOLDEN_DARK: Record<string, string> = {
  "primary-fill": "#1d76d9",
  "secondary-fill": "#a78bfa",
  "tertiary-fill": "#fb923c",
  "success-fill": "#10b981",
  "warning-fill": "#f59e0b",
  "error-fill": "#d93854",
  "info-fill": "#3472d8",
  "on-primary": "#ffffff",
  "on-secondary": "#000000",
  "on-tertiary": "#000000",
  "on-success": "#000000",
  "on-warning": "#000000",
  "on-error": "#ffffff",
  "on-info": "#ffffff",
  "primary-fill-hover": "#033d7e",
  "secondary-fill-hover": "#7c3aed",
  "tertiary-fill-hover": "#ea580c",
  "success-fill-hover": "#0ea774",
  "warning-fill-hover": "#dd8e0a",
  "error-fill-hover": "#c3324c",
  "info-fill-hover": "#2f67c2",
  "on-primary-hover": "#ffffff",
  "on-secondary-hover": "#ffffff",
  "on-tertiary-hover": "#000000",
  "on-success-hover": "#000000",
  "on-warning-hover": "#000000",
  "on-error-hover": "#ffffff",
  "on-info-hover": "#ffffff",
  "primary-text-hover": "#4f77a5",
  "secondary-text-hover": "#8c52ef",
  "tertiary-text-hover": "#ea580c",
  "success-text-hover": "#0ea774",
  "warning-text-hover": "#dd8e0a",
  "error-text-hover": "#c9475e",
  "info-text-hover": "#4275c7",
  "primary-text": "#4491e5",
  "secondary-text": "#a78bfa",
  "tertiary-text": "#fb923c",
  "success-text": "#10b981",
  "warning-text": "#f59e0b",
  "error-text": "#f43f5e",
  "info-text": "#3b82f6",
  "text-muted": "#8a909b",
};
