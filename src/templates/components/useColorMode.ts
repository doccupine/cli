export const useColorModeTemplate = `"use client";
import { useSyncExternalStore } from "react";
import {
  getColorModeState,
  setColorModePreference,
  subscribeColorMode,
  toggleColorMode,
  type ColorMode,
  type ColorModePreference,
  type ColorModeState,
} from "@/utils/colorMode";

export interface ColorModeValue {
  /** The mode in force. */
  mode: ColorMode;
  /** What the visitor picked: light, dark, or whatever the OS is set to. */
  preference: ColorModePreference;
  /** Switches to the other mode and remembers it. */
  toggleTheme: () => void;
  /** Picks a mode, or "system" to follow the OS, and remembers it. */
  setPreference: (preference: ColorModePreference) => void;
}

// The server cannot know the visitor's mode, so the server render (and the
// hydration pass) reads "light"; React re-renders the reading component with
// the real state right after hydrating. Colors never depend on this: they
// follow the "dark" class the pre-paint script set.
const SERVER_STATE: ColorModeState = { mode: "light", preference: "system" };

/**
 * The visitor's light/dark mode, for the few places CSS cannot do the job (a
 * toggle's pressed state, a label). Only the components that call it render
 * again when the mode changes.
 */
export function useColorMode(): ColorModeValue {
  const { mode, preference } = useSyncExternalStore(
    subscribeColorMode,
    getColorModeState,
    () => SERVER_STATE,
  );
  return {
    mode,
    preference,
    toggleTheme: toggleColorMode,
    setPreference: setColorModePreference,
  };
}
`;
