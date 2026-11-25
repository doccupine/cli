export const colorModeTemplate = `// The light/dark mode, outside React. Adapted from cherry-styled-components
// (MIT, https://github.com/cherry-design-system/styled-components).
//
// The mode is the \`dark\` class on <html>: every painted color is a CSS
// variable from app/styles/tokens.css that follows it, so switching modes
// repaints without rendering anything again. What the visitor picked lives in
// this small store; components read it with useColorMode().
//
// The pre-paint script in app/layout.tsx makes the same decision before the
// first paint, so mounting never flips the mode:
//
//   1. an explicit \`themePreference\` in localStorage: light, dark or system;
//   2. else a \`theme\` entry in localStorage, which older releases wrote when
//      the visitor toggled, so it counts as their choice;
//   3. else the OS ("system"), followed live.
//
// Where storage is blocked, the \`theme\` cookie is the only thing that keeps a
// choice, so it decides. The cookie always mirrors the mode in force.

export type ColorMode = "light" | "dark";
export type ColorModePreference = ColorMode | "system";

export interface ColorModeState {
  /** The mode in force. */
  mode: ColorMode;
  /** What the visitor picked: a fixed mode, or whatever the OS is set to. */
  preference: ColorModePreference;
}

const PREFERENCE_KEY = "themePreference";
export const DARK_MODE_QUERY = "(prefers-color-scheme: dark)";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function systemMode(): ColorMode {
  return typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia(DARK_MODE_QUERY).matches
    ? "dark"
    : "light";
}

function resolveMode(preference: ColorModePreference): ColorMode {
  return preference === "system" ? systemMode() : preference;
}

function readCookieMode(): ColorMode | undefined {
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.indexOf("theme=") === 0);
  const value = entry ? entry.slice("theme=".length) : undefined;
  return value === "dark" || value === "light" ? value : undefined;
}

function readPreference(): ColorModePreference {
  try {
    const stored = window.localStorage.getItem(PREFERENCE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    const legacy = window.localStorage.getItem("theme");
    return legacy === "light" || legacy === "dark" ? legacy : "system";
  } catch {
    return readCookieMode() ?? "system";
  }
}

function storePreference(preference: ColorModePreference) {
  try {
    window.localStorage.setItem(PREFERENCE_KEY, preference);
  } catch {
    // Storage is blocked: the cookie applyColorMode writes keeps the choice.
  }
}

let state: ColorModeState | null = null;
const listeners = new Set<() => void>();

/** The visitor's mode and preference (client only). */
export function getColorModeState(): ColorModeState {
  if (!state) {
    const preference = readPreference();
    state = { mode: resolveMode(preference), preference };
  }
  return state;
}

export function subscribeColorMode(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(next: ColorModeState) {
  const current = getColorModeState();
  if (current.mode === next.mode && current.preference === next.preference) {
    return;
  }
  state = next;
  listeners.forEach((listener) => listener());
}

/** Picks a mode, or "system" to follow the OS, and remembers it. */
export function setColorModePreference(preference: ColorModePreference) {
  storePreference(preference);
  update({ mode: resolveMode(preference), preference });
}

/** Switches to the other mode and remembers it. */
export function toggleColorMode() {
  setColorModePreference(
    getColorModeState().mode === "dark" ? "light" : "dark",
  );
}

/** Re-reads the OS mode, when the preference is "system". */
export function followSystemMode() {
  const current = getColorModeState();
  if (current.preference !== "system") return;
  update({ mode: systemMode(), preference: "system" });
}

let switchId = 0;

/**
 * Puts the page in \`mode\`: the \`dark\` class on <html> (painted with
 * transitions off for that frame, \`.theme-switching\`, so the page changes at
 * once instead of control by control) and the \`theme\` cookie. Writes only
 * what differs, so running it again is harmless.
 *
 * It also keeps the theme-color meta on the \`primary\` token, the color the
 * pre-paint script wrote. That tag belongs to the script (document.write, the
 * only form Safari tints its chrome from reliably): this only ever rewrites
 * its content, and never creates, removes or re-scopes a tag.
 */
export function applyColorMode(mode: ColorMode) {
  const root = document.documentElement;
  const dark = mode === "dark";
  if (root.classList.contains("dark") !== dark) {
    const id = ++switchId;
    root.classList.add("theme-switching");
    root.classList.toggle("dark", dark);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (id === switchId) root.classList.remove("theme-switching");
      }),
    );
  }
  if (readCookieMode() !== mode) {
    document.cookie = \`theme=\${mode};path=/;max-age=\${COOKIE_MAX_AGE};SameSite=Lax\`;
  }
  const color = getComputedStyle(root)
    .getPropertyValue("--color-primary")
    .trim();
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]:not([media])',
  );
  if (color && meta && meta.content !== color) meta.content = color;
}
`;
