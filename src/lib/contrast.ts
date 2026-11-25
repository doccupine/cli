// WCAG 2.x text contrast for a site palette: the math (relative luminance,
// contrast ratio, sRGB mixing), the two adjustments (pick a label color for a
// fill; move a color toward the body text until it passes), and the text
// tokens built from them (contrastTokens). Self-contained and dependency-free
// on purpose: doccupine.com's own stylesheet uses a verbatim copy of this file,
// so the generated sites and the platform compute identical values. Keep the
// exported names and parameters stable, and change both copies together.
//
// The CLI runs it in Node when it writes app/styles/tokens.css (and the
// badge palette and DemoTheme presets), so a site's text colors pass against
// its own theme.json without any runtime cost.
//
// Colors are read as plain sRGB: hex (#rgb, #rgba, #rrggbb, #rrggbbaa),
// rgb()/rgba(), hsl()/hsla() and the names white and black. Alpha is ignored.
// Anything else (lab(), oklch(), color-mix(), ...) parses to null and the
// callers fall back to the color they used before.

export type Rgb = [number, number, number];

/** WCAG AA for normal-size text: every computed text color targets it. */
export const AA_TEXT = 4.5;

/** Step of the move toward the body text: 1% of an sRGB mix per step. */
export const MIX_STEP = 0.01;

/** Share of a color in the tint a "-text" color must also pass on (20%). */
export const TINT_WEIGHT = 0.2;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function channel(part: string, max: number): number | null {
  const value = parseFloat(part);
  if (Number.isNaN(value)) return null;
  return clamp(part.trim().endsWith("%") ? (value / 100) * max : value, 0, max);
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

/** A CSS color as sRGB channels (0 to 255), or null when it is not plain sRGB. */
export function parseColor(value: string): Rgb | null {
  const color = value.trim().toLowerCase();
  if (color === "white") return [255, 255, 255];
  if (color === "black") return [0, 0, 0];
  const hex = color.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      digits = [...digits.slice(0, 3)].map((digit) => digit + digit).join("");
    } else if (digits.length === 6 || digits.length === 8) {
      digits = digits.slice(0, 6);
    } else {
      return null;
    }
    return [0, 2, 4].map((index) =>
      parseInt(digits.slice(index, index + 2), 16),
    ) as Rgb;
  }
  const fn = color.match(/^(rgba?|hsla?)\(([^()]*)\)$/);
  if (!fn) return null;
  const parts = fn[2]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .slice(0, 3);
  if (parts.length < 3) return null;
  if (fn[1].startsWith("rgb")) {
    const rgb = parts.map((part) => channel(part, 255));
    return rgb.some((part) => part === null) ? null : (rgb as Rgb);
  }
  const h = parseFloat(parts[0]);
  const s = channel(parts[1], 1);
  const l = channel(parts[2], 1);
  if (Number.isNaN(h) || s === null || l === null) return null;
  return hslToRgb(((h % 360) + 360) % 360, s, l);
}

/** WCAG relative luminance of an sRGB color, 0 (black) to 1 (white). */
export function relativeLuminance([r, g, b]: Rgb): number {
  const linear = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio of two colors, 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (light + 0.05) / (dark + 0.05);
}

/** `color-mix(in srgb, a <weight * 100>%, b)`, weight being a's share. */
export function mixRgb(a: Rgb, b: Rgb, weight: number): Rgb {
  return a.map(
    (value, index) => value * weight + b[index] * (1 - weight),
  ) as Rgb;
}

export function toHex(rgb: Rgb): string {
  return `#${rgb
    .map((value) =>
      Math.round(clamp(value, 0, 255))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/**
 * The text color to put on a fill: the first candidate that reaches `target`
 * against it, else the candidate with the highest ratio. Candidates are CSS
 * colors; the chosen one is returned as written. Null when the fill or every
 * candidate is unreadable.
 */
export function pickOnColor(
  fill: string,
  candidates: string[],
  target = AA_TEXT,
): string | null {
  const background = parseColor(fill);
  if (!background) return null;
  let best: { color: string; ratio: number } | null = null;
  for (const color of candidates) {
    const rgb = parseColor(color);
    if (!rgb) continue;
    const ratio = contrastRatio(rgb, background);
    if (ratio >= target) return color;
    if (!best || ratio > best.ratio) best = { color, ratio };
  }
  return best?.color ?? null;
}

/**
 * `color` moved toward `toward` in MIX_STEP steps (an sRGB mix, as color-mix()
 * does)
 * until it reaches `target` against every background. Returns `color` as
 * written when it already passes, a hex color otherwise, and null when a
 * color cannot be read. When even `toward` itself falls short, returns the
 * step with the best worst-case ratio.
 */
export function ensureContrast(
  color: string,
  toward: string,
  backgrounds: string[],
  target = AA_TEXT,
): string | null {
  const start = parseColor(color);
  const end = parseColor(toward);
  const surfaces = backgrounds.map(parseColor);
  if (!start || !end || surfaces.some((surface) => !surface)) return null;
  const worst = (rgb: Rgb) =>
    Math.min(...surfaces.map((surface) => contrastRatio(rgb, surface as Rgb)));
  if (worst(start) >= target) return color;
  let best = { rgb: start, ratio: worst(start) };
  const steps = Math.round(1 / MIX_STEP);
  for (let step = 1; step <= steps; step++) {
    const rgb = mixRgb(end, start, step * MIX_STEP);
    // Rounded, so the ratio checked is the ratio of the color written out.
    const written = parseColor(toHex(rgb)) as Rgb;
    const ratio = worst(written);
    if (ratio >= target) return toHex(written);
    if (ratio > best.ratio) best = { rgb: written, ratio };
  }
  return toHex(best.rgb);
}

/** The preferred label on a fill: white. */
export const ON_FILL_TEXT = "#ffffff";

/**
 * How far a fill may move toward black (as an sRGB mix share) to carry a
 * white label. A color that needs more keeps its own value and takes a dark
 * label instead: white stays on blues, reds, purples; ambers, yellows, light
 * greens and pastels keep their color with dark text.
 */
export const MAX_FILL_SHIFT = 0.12;

/** Dark labels tried, after the palette's own near-black, in this order. */
export const DARK_ON_FILL = ["#18181b", "#000000"] as const;

/**
 * The fill and label for a filled surface of `color`. White on `color`
 * moved toward black in MIX_STEP steps, at most MAX_FILL_SHIFT, as soon as
 * white reaches AA_TEXT (no move when it already does); else `color` as
 * written with the first of `darkText`, then DARK_ON_FILL, that reaches
 * AA_TEXT on it (the highest ratio when none does). Null when `color` cannot
 * be read.
 */
export function fillFor(
  color: string,
  darkText?: string,
): { fill: string; on: string } | null {
  const start = parseColor(color);
  if (!start) return null;
  const white = parseColor(ON_FILL_TEXT) as Rgb;
  if (contrastRatio(white, start) >= AA_TEXT) {
    return { fill: color, on: ON_FILL_TEXT };
  }
  const steps = Math.round(MAX_FILL_SHIFT / MIX_STEP);
  for (let step = 1; step <= steps; step++) {
    const fill = toHex(mixRgb([0, 0, 0], start, step * MIX_STEP));
    if (contrastRatio(white, parseColor(fill) as Rgb) >= AA_TEXT) {
      return { fill, on: ON_FILL_TEXT };
    }
  }
  const candidates = [...(darkText ? [darkText] : []), ...DARK_ON_FILL];
  return { fill: color, on: pickOnColor(color, candidates) ?? "#000000" };
}

/** The over-the-page color of `color` at `weight` (0 to 1) over `background`. */
export function tint(
  color: string,
  weight: number,
  background: string,
): string | null {
  const a = parseColor(color);
  const b = parseColor(background);
  return a && b ? toHex(mixRgb(a, b, weight)) : null;
}

/** The palette keys whose fills carry labels and whose color is used as text. */
export const CONTRAST_KEYS = [
  "primary",
  "secondary",
  "tertiary",
  "success",
  "warning",
  "error",
  "info",
] as const;

export type ContrastKey = (typeof CONTRAST_KEYS)[number];

/** The palette colors contrastTokens reads, for one mode. */
export type ContrastPalette = Record<
  | ContrastKey
  | "primaryLight"
  | "primaryDark"
  | "secondaryDark"
  | "tertiaryDark"
  | "gray"
  | "grayLight"
  | "light"
  | "dark",
  string
>;

/** Share of black mixed into a status color for its hover (as before). */
export const HOVER_SHIFT = 0.1;

/**
 * The color a filled control of `key` turns on hover: the palette's
 * <key>Dark for primary, secondary and tertiary, the control's fill
 * (`fill`, its <key>-fill) with HOVER_SHIFT of black for the status colors.
 * Null when it cannot be read.
 */
export function hoverColor(
  palette: ContrastPalette,
  key: ContrastKey,
  fill: string = palette[key],
): string | null {
  if (key === "primary" || key === "secondary" || key === "tertiary") {
    return parseColor(palette[`${key}Dark`]) ? palette[`${key}Dark`] : null;
  }
  const rgb = parseColor(fill);
  return rgb ? toHex(mixRgb([0, 0, 0], rgb, HOVER_SHIFT)) : null;
}

/**
 * The text tokens of one mode, as [name, value] pairs without the `--color-`
 * prefix. The page background is `light` and the body text `dark` in both
 * modes (the dark palette swaps them).
 *
 *   <key>-fill        <key> as a filled surface (buttons, solid badges,
 *                     ...) and its label, from fillFor: white on <key>
 *   on-<key>          nudged at most MAX_FILL_SHIFT toward black, else <key>
 *                     itself with the palette's near-black (or DARK_ON_FILL)
 *   <key>-fill-hover  the same pair for the control's hover color
 *   on-<key>-hover    (hoverColor)
 *   <key>-text-hover  the hover color as an outlined control's text on the
 *                     page, moved toward the body text until it passes
 *   <key>-text  <key> as text: kept when it reaches AA_TEXT on the page and on
 *               its own TINT_WEIGHT tint over the page (primary's tint is
 *               primaryLight's), else moved toward the body text in MIX_STEP
 *               steps until it does
 *   text-muted  gray, moved the same way until it reaches AA_TEXT on the
 *               page, on grayLight and on the primaryLight tint
 *
 * A value that cannot be read (not plain sRGB) falls back to the CSS
 * `fallbacks` give: by default var(--color-<key>) for the fill and the text,
 * var(--color-onFilled) for the label, var(--color-gray) for muted text, and
 * for hovers the base fill's tokens: the colors used before these tokens
 * existed, or the closest.
 */
export function contrastTokens(
  palette: ContrastPalette,
  fallbacks: {
    fill?: (key: ContrastKey) => string;
    on?: (key: ContrastKey) => string;
    text?: (key: ContrastKey) => string;
    muted?: string;
  } = {},
): [string, string][] {
  const fallbackFill = fallbacks.fill ?? ((key) => `var(--color-${key})`);
  const fallbackOn = fallbacks.on ?? (() => "var(--color-onFilled)");
  const fallbackText = fallbacks.text ?? ((key) => `var(--color-${key})`);
  const fallbackMuted = fallbacks.muted ?? "var(--color-gray)";
  const page = palette.light;
  const text = palette.dark;
  const pageRgb = parseColor(page);
  const textRgb = parseColor(text);
  // The palette's near-black: the body text in light mode, the page in dark.
  const darker =
    pageRgb &&
    textRgb &&
    relativeLuminance(pageRgb) < relativeLuminance(textRgb)
      ? page
      : text;
  const tokens: [string, string][] = [];
  const fills = CONTRAST_KEYS.map((key) => fillFor(palette[key], darker));
  CONTRAST_KEYS.forEach((key, index) => {
    tokens.push([`${key}-fill`, fills[index]?.fill ?? fallbackFill(key)]);
  });
  CONTRAST_KEYS.forEach((key, index) => {
    tokens.push([`on-${key}`, fills[index]?.on ?? fallbackOn(key)]);
  });
  const hovers = CONTRAST_KEYS.map((key, index) => {
    const color = hoverColor(palette, key, fills[index]?.fill);
    return color ? { color, ...fillFor(color, darker) } : null;
  });
  CONTRAST_KEYS.forEach((key, index) => {
    tokens.push([
      `${key}-fill-hover`,
      hovers[index]?.fill ?? `var(--color-${key}-fill)`,
    ]);
  });
  CONTRAST_KEYS.forEach((key, index) => {
    tokens.push([
      `on-${key}-hover`,
      hovers[index]?.on ?? `var(--color-on-${key})`,
    ]);
  });
  CONTRAST_KEYS.forEach((key, index) => {
    const hover = hovers[index];
    tokens.push([
      `${key}-text-hover`,
      (hover && ensureContrast(hover.color, text, [page])) ??
        `var(--color-${key}-text)`,
    ]);
  });
  for (const key of CONTRAST_KEYS) {
    const ownTint = tint(
      palette[key === "primary" ? "primaryLight" : key],
      TINT_WEIGHT,
      page,
    );
    tokens.push([
      `${key}-text`,
      (ownTint && ensureContrast(palette[key], text, [page, ownTint])) ??
        fallbackText(key),
    ]);
  }
  const primaryTint = tint(palette.primaryLight, TINT_WEIGHT, page);
  tokens.push([
    "text-muted",
    (primaryTint &&
      ensureContrast(palette.gray, text, [
        page,
        palette.grayLight,
        primaryTint,
      ])) ??
      fallbackMuted,
  ]);
  return tokens;
}
