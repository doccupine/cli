export const cherryThemeProviderTemplate = `"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { ThemeProvider } from "styled-components";
import { ThemeContext } from "cherry-styled-components";
import { colorsDark, colorsLight, theme } from "@/app/theme";
import { GlobalStyles } from "@/components/layout/GlobalStyles";

export type ColorMode = "light" | "dark";
export type ColorModePreference = ColorMode | "system";

interface ColorModeContextValue {
  /** The mode in force. */
  mode: ColorMode;
  /** What the visitor picked: a fixed mode, or whatever the OS is set to. */
  preference: ColorModePreference;
  setPreference: (preference: ColorModePreference) => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "light",
  preference: "system",
  setPreference: () => {},
});

const PREFERENCE_KEY = "themePreference";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function systemMode(): ColorMode {
  return window.matchMedia && window.matchMedia(DARK_QUERY).matches
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
    .find((part) => part.startsWith("theme="));
  const value = entry?.slice("theme=".length);
  return value === "dark" || value === "light" ? value : undefined;
}

/**
 * The visitor's preference, decided exactly as the blocking script in the root
 * layout decides the first paint, so mounting never changes the mode:
 * an explicit \`themePreference\`; else a \`theme\` entry in localStorage, which
 * only older releases wrote, and only when the visitor toggled; else the OS.
 * The \`theme\` cookie is just a mirror of the resolved mode, except where
 * storage is blocked and it is the only thing that persists a choice.
 */
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
    // Storage is blocked: the cookie written by applyMode carries the choice.
  }
}

/**
 * Puts the page in \`mode\`: the data-theme attribute every theme variable in
 * GlobalStyles keys off, the "dark" class Cherry's own CSS reads, the cookie
 * mirror, and the theme-color meta. Only the meta's content is updated: the
 * tag is the one the blocking script wrote through document.write, which is
 * the only form Safari tints its chrome from reliably, so it is never
 * re-created. Its color is read from the computed --color-primary, so a
 * DemoTheme preset (inline overrides on <html>) shows in the chrome too.
 * Idempotent: writes only what differs.
 *
 * A real switch is painted with transitions off (\`.theme-switching\`, see
 * GlobalStyles), so the whole page changes at once instead of each control
 * fading on its own. The class comes off after the switch has painted.
 */
let switchId = 0;

function applyMode(mode: ColorMode) {
  const root = document.documentElement;
  if (root.dataset.theme !== mode) {
    const id = ++switchId;
    root.classList.add("theme-switching");
    root.dataset.theme = mode;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (id === switchId) root.classList.remove("theme-switching");
      }),
    );
  }
  root.classList.toggle("dark", mode === "dark");
  if (readCookieMode() !== mode) {
    document.cookie = \`theme=\${mode};path=/;max-age=31536000;SameSite=Lax\`;
  }
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (meta) {
    const color =
      getComputedStyle(root).getPropertyValue("--color-primary").trim() ||
      (mode === "dark" ? colorsDark.primary : colorsLight.primary);
    if (meta.content !== color) meta.content = color;
  }
}

interface ColorModeState {
  mode: ColorMode;
  preference: ColorModePreference;
}

// The mode lives outside React: the blocking script already decided it before
// the first paint, so the client reads the same answer on first use instead
// of settling it in an effect. The server cannot know it and renders the
// default; useSyncExternalStore swaps in the client value after hydration.
const SERVER_STATE: ColorModeState = { mode: "light", preference: "system" };
let state: ColorModeState | null = null;
const listeners = new Set<() => void>();

function getState(): ColorModeState {
  if (!state) {
    const preference = readPreference();
    state = { mode: resolveMode(preference), preference };
  }
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(next: ColorModeState) {
  // Always re-applied, so a DemoTheme preset re-syncs the theme-color even
  // when the mode stays the same.
  applyMode(next.mode);
  const current = getState();
  if (current.mode === next.mode && current.preference === next.preference) {
    return;
  }
  state = next;
  listeners.forEach((listener) => listener());
}

function setPreference(preference: ColorModePreference) {
  storePreference(preference);
  update({ mode: resolveMode(preference), preference });
}

// Cherry's ThemeContext, for its ThemeToggle. A constant that reads the mode
// when called, so a switch does not re-render the toggle or anything else
// consuming it.
const CHERRY_CONTEXT: React.ContextType<typeof ThemeContext> = {
  // Cherry's setTheme takes a theme object; only its isDark, when it carries
  // one, says anything about the mode.
  setTheme: (action) => {
    const next =
      typeof action === "function"
        ? action(theme as Parameters<typeof action>[0])
        : action;
    const dark = (next as { isDark?: boolean }).isDark;
    if (typeof dark === "boolean") setPreference(dark ? "dark" : "light");
  },
  toggleTheme: () =>
    setPreference(getState().mode === "dark" ? "light" : "dark"),
};

/**
 * The theme provider for both modes. The theme object never changes (its
 * colors are CSS variables, see app/theme.ts), so switching the mode renders
 * no styled component again: the attribute on <html> flips and the browser
 * repaints. Only components reading \`useColorMode()\` render on a switch.
 *
 * Deliberately reads NO request data (cookies/headers) so pages stay
 * statically renderable: the blocking script in the root layout sets the mode
 * before the first paint, and this provider takes over after hydration.
 * Cherry's ThemeToggle keeps working through its ThemeContext.
 */
function CherryThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, preference } = useSyncExternalStore(
    subscribe,
    getState,
    () => SERVER_STATE,
  );

  // "system" follows the OS live.
  useEffect(() => {
    if (preference !== "system" || !window.matchMedia) return;
    const media = window.matchMedia(DARK_QUERY);
    const follow = () =>
      update({ mode: media.matches ? "dark" : "light", preference: "system" });
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, [preference]);

  const modeValue = useMemo(
    () => ({ mode, preference, setPreference }),
    [mode, preference],
  );

  return (
    <ThemeProvider theme={theme}>
      <ThemeContext.Provider value={CHERRY_CONTEXT}>
        <ColorModeContext.Provider value={modeValue}>
          <GlobalStyles />
          {children}
        </ColorModeContext.Provider>
      </ThemeContext.Provider>
    </ThemeProvider>
  );
}

/**
 * The mode in force, with the visitor's preference and its setter. Read it for
 * what CSS cannot do (a canvas, a per-mode image); a color that differs by
 * mode is a token or a :root[data-theme="dark"] rule, not a branch on this.
 */
function useColorMode(): ColorModeContextValue {
  return useContext(ColorModeContext);
}

export { CherryThemeProvider, useColorMode };
`;
