export const colorModeSyncTemplate = `"use client";
import { useEffect } from "react";
import {
  DARK_MODE_QUERY,
  applyColorMode,
  followSystemMode,
  getColorModeState,
  subscribeColorMode,
} from "@/utils/colorMode";

/**
 * Keeps the page in the visitor's mode: applies every change made through
 * useColorMode() (the "dark" class, the cookie, the theme-color meta) and
 * follows the OS while the preference is "system". Renders nothing and never
 * renders again, so a toggle re-renders no part of the page.
 *
 * It reads the store directly instead of a React snapshot: during hydration a
 * snapshot is the server's "light", and applying it would flip a dark page
 * for a frame. Every write is idempotent, so StrictMode's double effect run
 * is harmless.
 */
export function ColorModeSync() {
  useEffect(() => {
    const sync = () => applyColorMode(getColorModeState().mode);
    sync();
    const unsubscribe = subscribeColorMode(sync);
    const media = window.matchMedia?.(DARK_MODE_QUERY);
    media?.addEventListener("change", followSystemMode);
    return () => {
      unsubscribe();
      media?.removeEventListener("change", followSystemMode);
    };
  }, []);
  return null;
}
`;
